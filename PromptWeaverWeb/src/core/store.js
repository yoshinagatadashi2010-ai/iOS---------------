import {
  DEFAULT_SETTINGS,
  LIST_FILTERS,
  PROJECT_TYPES,
  SORT_OPTIONS,
  createEmptyProject,
  createSampleProjects,
  duplicateProject,
  filterProjects,
  normalizeProject,
  normalizeTags,
  sortProjects
} from "./models.js";
import {
  PERSISTENCE_BACKENDS,
  createPersistedSnapshot,
  getPersistenceLabel,
  loadPersistedState,
  persistState
} from "./persistence.js";

export class PromptWeaverStore extends EventTarget {
  static async create() {
    const persisted = await loadPersistedState();
    return new PromptWeaverStore(persisted);
  }

  constructor(persisted = null) {
    super();

    const snapshot = persisted?.snapshot ?? null;
    this.projects = snapshot?.projects?.map(normalizeProject) ?? createSampleProjects();
    this.settings = snapshot
      ? {
          ...DEFAULT_SETTINGS,
          ...(snapshot.settings ?? {})
        }
      : { ...DEFAULT_SETTINGS };
    this.listState = {
      searchText: "",
      filter: LIST_FILTERS.ALL,
      sort: SORT_OPTIONS.UPDATED_DESCENDING
    };
    this.saveStatus = { kind: "idle" };
    this.persistTimer = null;
    this.persistVersion = 0;
    this.storageBackend = persisted?.backend ?? PERSISTENCE_BACKENDS.LOCAL_STORAGE;
    this.storageLabel = getPersistenceLabel(this.storageBackend);
    this.storageMigrationApplied = Boolean(persisted?.migrated);

    if (!snapshot) {
      this.persistNow("save-status");
    }
  }

  notify(reason = "render") {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          reason,
          saveStatus: this.saveStatus,
          storageBackend: this.storageBackend,
          storageLabel: this.storageLabel,
          storageMigrationApplied: this.storageMigrationApplied
        }
      })
    );
  }

  setListState(partial) {
    this.listState = {
      ...this.listState,
      ...partial
    };
    this.notify("render");
  }

  getProject(projectId) {
    return this.projects.find((project) => project.id === projectId) ?? null;
  }

  getVisibleProjects() {
    const visible = filterProjects(this.projects, this.listState);
    return sortProjects(visible, this.listState.sort);
  }

  getRecentProjects(limit = 6) {
    return [...this.projects]
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, limit);
  }

  getFavoriteProjects(limit = 6) {
    return [...this.projects]
      .filter((project) => project.favorite)
      .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
      .slice(0, limit);
  }

  createProject(projectType) {
    const project = createEmptyProject(projectType, this.settings.defaultLanguage);
    this.projects.unshift(project);
    this.persistNow("render");
    return project;
  }

  deleteProject(projectId) {
    this.projects = this.projects.filter((project) => project.id !== projectId);
    this.persistNow("render");
  }

  duplicateProject(projectId) {
    const source = this.getProject(projectId);
    if (!source) {
      return null;
    }

    const duplicated = duplicateProject(source);
    this.projects.unshift(duplicated);
    this.persistNow("render");
    return duplicated;
  }

  toggleFavorite(projectId) {
    const project = this.getProject(projectId);
    if (!project) {
      return;
    }

    project.favorite = !project.favorite;
    project.updatedAt = new Date().toISOString();
    this.persistNow("render");
  }

  updateProject(projectId, mutator, options = {}) {
    const project = this.getProject(projectId);
    if (!project) {
      return null;
    }

    mutator(project);

    if (project.projectType === PROJECT_TYPES.IMAGE) {
      project.imageDetail = {
        subject: "",
        composition: "",
        style: "",
        lighting: "",
        camera: "",
        colorTone: "",
        mood: "",
        environment: "",
        negativePrompt: "",
        notes: "",
        referenceImages: [],
        ...(project.imageDetail ?? {})
      };
      project.videoDetail = null;
    }

    if (project.projectType === PROJECT_TYPES.VIDEO) {
      const orderedScenes = [...(project.videoDetail?.scenes ?? [])].map((scene, index) => ({
        ...scene,
        orderIndex: index
      }));

      project.videoDetail = normalizeProject({
        ...project,
        videoDetail: {
          ...(project.videoDetail ?? {}),
          referenceImages:
            project.videoDetail?.referenceImages ??
            project.videoDetail?.referenceImage ??
            [],
          scenes: orderedScenes
        }
      }).videoDetail;
      project.imageDetail = null;
    }

    project.tags = normalizeTags(project.tags);
    project.updatedAt = new Date().toISOString();

    if (options.render) {
      this.persistNow("render");
      return project;
    }

    this.persistSoon();
    return project;
  }

  updateSettings(mutator) {
    mutator(this.settings);
    this.persistNow("render");
  }

  persistSoon() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
    }

    this.saveStatus = { kind: "saving" };
    this.notify("save-status");

    this.persistTimer = window.setTimeout(() => {
      this.persistNow("save-status");
    }, 450);
  }

  persistNow(reason = "render") {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }

    this.projects = this.projects.map(normalizeProject);
    this.saveStatus = { kind: "saving" };

    if (reason !== "save-status") {
      this.notify(reason);
    } else {
      this.notify("save-status");
    }

    const persistVersion = ++this.persistVersion;
    const snapshot = createPersistedSnapshot(this.projects, this.settings);

    void persistState(snapshot)
      .then(({ backend }) => {
        if (persistVersion !== this.persistVersion) {
          return;
        }

        this.storageBackend = backend;
        this.storageLabel = getPersistenceLabel(backend);
        this.saveStatus = {
          kind: "saved",
          timestamp: snapshot.persistedAt
        };
        this.notify("save-status");
      })
      .catch((error) => {
        if (persistVersion !== this.persistVersion) {
          return;
        }

        this.saveStatus = {
          kind: "failed",
          message: error?.message || "ブラウザへの保存に失敗しました。"
        };
        this.notify("save-status");
      });
  }

  getExportableProject(projectId) {
    const project = this.getProject(projectId);
    return project ? normalizeProject(structuredClone(project)) : null;
  }
}
