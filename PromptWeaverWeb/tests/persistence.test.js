import test from "node:test";
import assert from "node:assert/strict";

import {
  choosePreferredSnapshot,
  createPersistedSnapshot,
  parsePersistedSnapshot
} from "../src/core/persistence.js";

test("parsePersistedSnapshot accepts legacy data without persistedAt", () => {
  const legacyRaw = JSON.stringify({
    version: 1,
    projects: [
      {
        id: "project-1",
        updatedAt: "2026-04-11T01:02:03.000Z"
      }
    ],
    settings: {
      shareUrl: "https://example.com"
    }
  });

  const snapshot = parsePersistedSnapshot(legacyRaw);

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.persistedAt, "2026-04-11T01:02:03.000Z");
  assert.equal(snapshot.settings.shareUrl, "https://example.com");
});

test("createPersistedSnapshot stamps version 2 and persistedAt", () => {
  const snapshot = createPersistedSnapshot([], {}, "2026-04-11T12:34:56.000Z");

  assert.deepEqual(snapshot, {
    version: 2,
    persistedAt: "2026-04-11T12:34:56.000Z",
    projects: [],
    settings: {}
  });
});

test("choosePreferredSnapshot keeps the newer snapshot", () => {
  const olderSnapshot = createPersistedSnapshot([], {}, "2026-04-11T09:00:00.000Z");
  const newerSnapshot = createPersistedSnapshot([], {}, "2026-04-11T10:00:00.000Z");

  assert.equal(choosePreferredSnapshot(olderSnapshot, newerSnapshot), newerSnapshot);
  assert.equal(choosePreferredSnapshot(newerSnapshot, olderSnapshot), newerSnapshot);
});
