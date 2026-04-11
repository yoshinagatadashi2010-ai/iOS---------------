const STORAGE_KEY = "promptweaver.web.v1";
const DATABASE_NAME = "promptweaver-web";
const DATABASE_VERSION = 1;
const STATE_STORE_NAME = "app-state";
const STATE_RECORD_KEY = "main";

export const PERSISTENCE_BACKENDS = Object.freeze({
  INDEXED_DB: "indexeddb",
  LOCAL_STORAGE: "localStorage"
});

function getSafeLocalStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function getSafeIndexedDb() {
  try {
    return globalThis.indexedDB ?? null;
  } catch {
    return null;
  }
}

function derivePersistedAt(projects) {
  if (!Array.isArray(projects) || !projects.length) {
    return new Date(0).toISOString();
  }

  const latest = projects.reduce((currentLatest, project) => {
    const candidate = `${project?.updatedAt ?? ""}`.trim();
    if (!candidate) {
      return currentLatest;
    }

    if (!currentLatest) {
      return candidate;
    }

    return new Date(candidate) > new Date(currentLatest) ? candidate : currentLatest;
  }, "");

  return latest || new Date(0).toISOString();
}

function normalizeSnapshot(parsed) {
  if (!parsed || !Array.isArray(parsed.projects)) {
    return null;
  }

  return {
    version: Math.max(1, Number(parsed.version) || 1),
    persistedAt: `${parsed.persistedAt ?? derivePersistedAt(parsed.projects)}`,
    projects: parsed.projects,
    settings: parsed.settings ?? {}
  };
}

export function parsePersistedSnapshot(raw) {
  if (!raw) {
    return null;
  }

  try {
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function createPersistedSnapshot(projects, settings, persistedAt = new Date().toISOString()) {
  return {
    version: 2,
    persistedAt,
    projects,
    settings
  };
}

export function choosePreferredSnapshot(primarySnapshot, secondarySnapshot) {
  if (primarySnapshot && secondarySnapshot) {
    return new Date(primarySnapshot.persistedAt) >= new Date(secondarySnapshot.persistedAt)
      ? primarySnapshot
      : secondarySnapshot;
  }

  return primarySnapshot ?? secondarySnapshot ?? null;
}

export function loadPersistedStateFromLocalStorage(storage = getSafeLocalStorage()) {
  if (!storage) {
    return null;
  }

  try {
    return parsePersistedSnapshot(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function removeLegacyLocalStorage(storage = getSafeLocalStorage()) {
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore cleanup failures.
  }
}

function openIndexedDb(indexedDb = getSafeIndexedDb()) {
  if (!indexedDb) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDb.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE_NAME)) {
        database.createObjectStore(STATE_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("ブラウザの拡張保存を初期化できませんでした。"));
    };

    request.onblocked = () => {
      reject(new Error("ブラウザの拡張保存が他のタブで使用中です。"));
    };
  });
}

function runIndexedDbRequest(database, mode, callback) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STATE_STORE_NAME, mode);
    const store = transaction.objectStore(STATE_STORE_NAME);
    const request = callback(store);
    let result = null;

    request.onsuccess = () => {
      result = request.result ?? null;
    };

    request.onerror = () => {
      reject(request.error ?? new Error("ブラウザの拡張保存でエラーが発生しました。"));
    };

    transaction.oncomplete = () => {
      resolve(result);
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("ブラウザの拡張保存が中断されました。"));
    };
  });
}

async function loadPersistedStateFromIndexedDb(indexedDb = getSafeIndexedDb()) {
  const database = await openIndexedDb(indexedDb);
  if (!database) {
    return null;
  }

  try {
    const record = await runIndexedDbRequest(database, "readonly", (store) => store.get(STATE_RECORD_KEY));
    return normalizeSnapshot(record?.snapshot ?? null);
  } finally {
    database.close();
  }
}

async function savePersistedStateToIndexedDb(snapshot, indexedDb = getSafeIndexedDb()) {
  const database = await openIndexedDb(indexedDb);
  if (!database) {
    return false;
  }

  try {
    await runIndexedDbRequest(database, "readwrite", (store) =>
      store.put(
        {
          snapshot,
          updatedAt: snapshot.persistedAt
        },
        STATE_RECORD_KEY
      )
    );
    return true;
  } finally {
    database.close();
  }
}

function isQuotaExceeded(error) {
  return (
    error?.name === "QuotaExceededError" ||
    error?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(`${error?.message ?? ""}`)
  );
}

function formatPersistenceError(error) {
  if (isQuotaExceeded(error)) {
    return new Error("保存容量の上限に達しました。参照画像を減らすか、別のプロジェクトに分けてください。");
  }

  return error instanceof Error
    ? error
    : new Error("ブラウザへの保存に失敗しました。");
}

function savePersistedStateToLocalStorage(snapshot, storage = getSafeLocalStorage()) {
  if (!storage) {
    throw new Error("このブラウザでは保存領域を利用できません。");
  }

  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot, null, 2));
}

export async function loadPersistedState(options = {}) {
  const localStorageBackend = options.localStorageBackend ?? getSafeLocalStorage();
  const indexedDb = options.indexedDb ?? getSafeIndexedDb();
  const localSnapshot = loadPersistedStateFromLocalStorage(localStorageBackend);

  if (!indexedDb) {
    return {
      snapshot: localSnapshot,
      backend: PERSISTENCE_BACKENDS.LOCAL_STORAGE,
      migrated: false
    };
  }

  try {
    const indexedDbSnapshot = await loadPersistedStateFromIndexedDb(indexedDb);
    const preferredSnapshot = choosePreferredSnapshot(indexedDbSnapshot, localSnapshot);

    if (!preferredSnapshot) {
      return {
        snapshot: null,
        backend: PERSISTENCE_BACKENDS.INDEXED_DB,
        migrated: false
      };
    }

    if (preferredSnapshot === localSnapshot) {
      await savePersistedStateToIndexedDb(localSnapshot, indexedDb);
    }

    removeLegacyLocalStorage(localStorageBackend);

    return {
      snapshot: preferredSnapshot,
      backend: PERSISTENCE_BACKENDS.INDEXED_DB,
      migrated: preferredSnapshot === localSnapshot
    };
  } catch {
    return {
      snapshot: localSnapshot,
      backend: PERSISTENCE_BACKENDS.LOCAL_STORAGE,
      migrated: false
    };
  }
}

export async function persistState(snapshot, options = {}) {
  const localStorageBackend = options.localStorageBackend ?? getSafeLocalStorage();
  const indexedDb = options.indexedDb ?? getSafeIndexedDb();

  if (indexedDb) {
    try {
      await savePersistedStateToIndexedDb(snapshot, indexedDb);
      removeLegacyLocalStorage(localStorageBackend);
      return {
        backend: PERSISTENCE_BACKENDS.INDEXED_DB
      };
    } catch (error) {
      if (!localStorageBackend) {
        throw formatPersistenceError(error);
      }
    }
  }

  try {
    savePersistedStateToLocalStorage(snapshot, localStorageBackend);
    return {
      backend: PERSISTENCE_BACKENDS.LOCAL_STORAGE
    };
  } catch (error) {
    throw formatPersistenceError(error);
  }
}

export function getPersistenceLabel(backend) {
  return backend === PERSISTENCE_BACKENDS.INDEXED_DB
    ? "拡張保存"
    : "簡易保存";
}
