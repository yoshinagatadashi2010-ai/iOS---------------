import {
  DEFAULT_SETTINGS,
  LIST_FILTERS,
  SORT_OPTIONS,
  PROJECT_TYPES,
  createEmptyProject,
  createSampleProjects,
  duplicateProject,
  filterProjects,
  normalizeProject,
  normalizeTags,
  sortProjects
} from "./models.js";

const STORAGE_KEY = "promptweaver.web.v1";

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.projects)) {
      return null;
    }

    return {
      projects: parsed.projects.map(normalizeProject),
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {})
      }
    };
  } catch {
    return null;
  }
}

export class PromptWeaverStore extends EventTarget {
  constructor() {
    super();

    const persisted = loadPersistedState();
    this.projects = persisted?.projects ?? createSampleProjects();
    this.settings = persisted?.settings ?? { ...DEFAULT_SETTINGS };
    this.listState = {
      searchText: "",
      filter: LIST_FILTERS.ALL,
      sort: SORT_OPTIONS.UPDATED_DESCENDING
    };
    this.saveStatus = { kind: "idle" };
    this.persistTimer = null;

    if (!persisted) {
      this.persistNow("save-status");
    }
  }

  notify(reason = "render") {
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: {
          reason,
          saveStatus: this.saveStatus
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
        referenceImage: null,
        ...(project.imageDetail ?? {})
      };
      project.videoDetail = null;
    }

    if (project.projectType === PROJECT_TYPES.VIDEO) {
      const orderedScenes = [...(project.videoDetail?.scenes ?? [])].map(
        (scene, index) => ({
          ...scene,
          orderIndex: index
        })
      );

      project.videoDetail = normalizeProject({
        ...project,
        videoDetail: {
          ...(project.videoDetail ?? {}),
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

    try {
      this.projects = this.projects.map(normalizeProject);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          {
            version: 1,
            projects: this.projects,
            settings: this.settings
          },
          null,
          2
        )
      );
      this.saveStatus = {
        kind: "saved",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.saveStatus = {
        kind: "failed",
        message: error?.message || "保存に失敗しました"
      };
      this.notify("save-status");
      if (reason !== "save-status") {
        this.notify(reason);
      }
      return;
    }
    this.notify(reason);
  }

  getExportableProject(projectId) {
    const project = this.getProject(projectId);
    return project ? normalizeProject(structuredClone(project)) : null;
  }
}

