import {
  LANGUAGE_LABELS,
  LIST_FILTER_LABELS,
  OUTPUT_FORMAT_LABELS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
  SORT_OPTION_LABELS,
  createVideoScene,
  formatDateTime,
  formatDurationSeconds,
  formatSaveStatus,
  getDisplayTitle,
  getTotalDuration
} from "../core/models.js";
import { generateMarkdown } from "../core/markdown.js";
import {
  buildQrCodeImageUrl,
  copyText,
  exportJson,
  exportMarkdown,
  isShareableHttpUrl,
  shareAppUrl,
  shareMarkdown
} from "../core/export.js";
import { prepareReferenceImage } from "../core/reference-images.js";
import { navigate, parseHash } from "./router.js";

const T = {
  home: "\u30db\u30fc\u30e0",
  projects: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
  editor: "\u7de8\u96c6",
  settings: "\u8a2d\u5b9a",
  newImage: "\u65b0\u3057\u3044\u753b\u50cf",
  newVideo: "\u65b0\u3057\u3044\u52d5\u753b",
  start: "\u3059\u3050\u4f5c\u308b",
  startNote: "\u753b\u50cf\u3082\u52d5\u753b\u3082\u3001\u69cb\u9020\u5316\u3057\u305f\u4e0b\u66f8\u304d\u304b\u3089\u305d\u306e\u307e\u307e Markdown \u306b\u843d\u3068\u305b\u307e\u3059\u3002",
  createImage: "\u753b\u50cf\u30d7\u30ed\u30f3\u30d7\u30c8\u3092\u4f5c\u6210",
  createVideo: "\u52d5\u753b\u30d7\u30ed\u30f3\u30d7\u30c8\u3092\u4f5c\u6210",
  recent: "\u6700\u8fd1\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8",
  favorite: "\u304a\u6c17\u306b\u5165\u308a",
  smartphone: "\u30b9\u30de\u30db\u3067\u306e\u4f7f\u3044\u65b9",
  smartphoneNote: "\u8a2d\u5b9a\u753b\u9762\u3067\u5171\u6709\u7528 URL \u3068 QR \u30b3\u30fc\u30c9\u3092\u8868\u793a\u3067\u304d\u307e\u3059\u3002iPhone \u306f Safari \u306e\u5171\u6709\u30e1\u30cb\u30e5\u30fc\u304b\u3089\u30db\u30fc\u30e0\u753b\u9762\u306b\u8ffd\u52a0\u3067\u304d\u307e\u3059\u3002",
  openQr: "QR\u5171\u6709\u3092\u958b\u304f",
  emptyProjects: "\u307e\u3060\u8868\u793a\u3067\u304d\u308b\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u3042\u308a\u307e\u305b\u3093\u3002",
  listTitle: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u4e00\u89a7",
  listNote: "\u30bf\u30a4\u30c8\u30eb\u3068\u30bf\u30b0\u3067\u691c\u7d22\u3057\u306a\u304c\u3089\u3001\u8907\u88fd\u3084\u66f8\u304d\u51fa\u3057\u524d\u306e\u6574\u7406\u304c\u3067\u304d\u307e\u3059\u3002",
  search: "\u691c\u7d22",
  searchPlaceholder: "\u30bf\u30a4\u30c8\u30eb\u307e\u305f\u306f\u30bf\u30b0\u3067\u691c\u7d22",
  sort: "\u4e26\u3073\u9806",
  noMatch: "\u4e00\u81f4\u3059\u308b\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u691c\u7d22\u8a9e\u3084\u30d5\u30a3\u30eb\u30bf\u30fc\u3092\u8abf\u6574\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
  open: "\u958b\u304f",
  duplicate: "\u8907\u88fd",
  delete: "\u524a\u9664",
  updated: "\u66f4\u65b0",
  duplicated: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u8907\u88fd\u3057\u307e\u3057\u305f",
  confirmDelete: "\u3053\u306e\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u524a\u9664\u3057\u307e\u3059\u304b\uff1f",
  toList: "\u4e00\u89a7\u3078",
  preview: "Markdown \u30d7\u30ec\u30d3\u30e5\u30fc",
  editorImageNote: "\u69cb\u56f3\u3084\u8cea\u611f\u3092\u7a4d\u307f\u4e0a\u3052\u306a\u304c\u3089\u3001\u753b\u50cf\u751f\u6210\u5411\u3051\u306e Markdown \u3092\u6574\u3048\u307e\u3059\u3002",
  editorVideoNote: "\u30b7\u30fc\u30f3\u5358\u4f4d\u3067\u6642\u9593\u3068\u5185\u5bb9\u3092\u7d44\u307f\u7acb\u3066\u3066\u3001\u52d5\u753b\u751f\u6210\u7528\u306e\u4e0b\u66f8\u304d\u3092\u6574\u3048\u307e\u3059\u3002",
  exportMarkdown: "Markdown \u3092\u66f8\u304d\u51fa\u3059",
  exportJson: "JSON \u3092\u66f8\u304d\u51fa\u3059",
  unfavorite: "\u304a\u6c17\u306b\u5165\u308a\u89e3\u9664",
  addFavorite: "\u304a\u6c17\u306b\u5165\u308a\u306b\u8ffd\u52a0",
  exportMarkdownDone: "Markdown \u3092\u66f8\u304d\u51fa\u3057\u307e\u3057\u305f",
  exportJsonDone: "JSON \u3092\u66f8\u304d\u51fa\u3057\u307e\u3057\u305f",
  basicInfo: "\u57fa\u672c\u60c5\u5831",
  title: "\u30bf\u30a4\u30c8\u30eb",
  titlePlaceholder: "\u30bf\u30a4\u30c8\u30eb\u306f\u7a7a\u3067\u3082\u5927\u4e08\u592b\u3067\u3059",
  summary: "\u6982\u8981",
  summaryPlaceholder: "\u7528\u9014\u3084\u72d9\u3044\u3092\u77ed\u304f\u307e\u3068\u3081\u307e\u3059",
  tags: "\u30bf\u30b0\uff08\u30ab\u30f3\u30de\u533a\u5207\u308a\uff09",
  language: "\u8a00\u8a9e",
  outputFormat: "\u51fa\u529b\u5f62\u5f0f",
  archived: "\u30a2\u30fc\u30ab\u30a4\u30d6",
  imagePrompt: "\u753b\u50cf\u30d7\u30ed\u30f3\u30d7\u30c8",
  referenceImage: "\u53c2\u7167\u753b\u50cf",
  referenceImageHint: "\u53c2\u7167\u753b\u50cf\u306f\u30d6\u30e9\u30a6\u30b6\u4fdd\u5b58\u5411\u3051\u306b\u8efd\u91cf\u5316\u3055\u308c\u3001\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3068\u4e00\u7dd2\u306b\u4fdd\u5b58\u3055\u308c\u307e\u3059\u3002",
  referenceImageEmpty: "\u5199\u771f\u30e9\u30a4\u30d6\u30e9\u30ea\u3084\u30d5\u30a1\u30a4\u30eb\u304b\u3089\u53c2\u7167\u753b\u50cf\u30921\u679a\u8ffd\u52a0\u3067\u304d\u307e\u3059\u3002",
  referenceImageChoose: "\u53c2\u7167\u753b\u50cf\u3092\u9078\u629e",
  referenceImageReplace: "\u53c2\u7167\u753b\u50cf\u3092\u5909\u66f4",
  referenceImageRemove: "\u53c2\u7167\u753b\u50cf\u3092\u524a\u9664",
  referenceImageAdded: "\u53c2\u7167\u753b\u50cf\u3092\u8ffd\u52a0\u3057\u307e\u3057\u305f",
  referenceImageRemoved: "\u53c2\u7167\u753b\u50cf\u3092\u524a\u9664\u3057\u307e\u3057\u305f",
  negativePrompt: "\u30cd\u30ac\u30c6\u30a3\u30d6\u30d7\u30ed\u30f3\u30d7\u30c8",
  notes: "\u30e1\u30e2"
};

function element(tagName, options = {}, children = []) {
  const node = document.createElement(tagName);
  const { className, text, html, attrs, onClick, onInput, onChange } = options;
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  if (html !== undefined) node.innerHTML = html;
  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === "class") node.className = value;
      else if (key === "open") node.open = true;
      else node.setAttribute(key, value);
    });
  }
  if (onClick) node.addEventListener("click", onClick);
  if (onInput) node.addEventListener("input", onInput);
  if (onChange) node.addEventListener("change", onChange);
  children.flat().filter(Boolean).forEach((child) => node.append(child));
  return node;
}

function labelText(text) {
  return element("span", { className: "field__label", text });
}

function textField({ label, value, placeholder, onInput, type = "text" }) {
  const input = element("input", {
    attrs: { class: "field__control", type, value, placeholder },
    onInput
  });
  return element("label", { className: "field" }, [labelText(label), input]);
}

function textAreaField({ label, value, placeholder, onInput }) {
  const textarea = element("textarea", { attrs: { placeholder }, onInput });
  textarea.value = value;
  return element("label", { className: "field" }, [labelText(label), textarea]);
}

function selectField({ label, value, options, onChange }) {
  const select = element("select", { onChange });
  options.forEach((option) => {
    const node = element("option", { text: option.label, attrs: { value: option.value } });
    if (option.value === value) node.selected = true;
    select.append(node);
  });
  return element("label", { className: "field" }, [labelText(label), select]);
}

function toggleField({ label, checked, onChange }) {
  const input = element("input", { attrs: { type: "checkbox" }, onChange });
  input.checked = checked;
  return element("label", { className: "toggle" }, [element("span", { text: label }), input]);
}

function projectTypeBadge(project) {
  return element("span", { className: "badge", text: PROJECT_TYPE_LABELS[project.projectType] });
}

function hasReferenceImage(project) {
  return Boolean(project?.imageDetail?.referenceImage?.dataUrl);
}

function formatFileSize(value) {
  return new Intl.NumberFormat("ja-JP", {
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0
  }).format(value >= 1_000_000 ? value / 1_000_000 : value / 1_000);
}

function describeReferenceImage(referenceImage) {
  if (!referenceImage?.dataUrl) {
    return "";
  }

  const parts = [];
  if (referenceImage.name) {
    parts.push(referenceImage.name);
  }
  if (referenceImage.byteSize > 0) {
    parts.push(
      referenceImage.byteSize >= 1_000_000
        ? `${formatFileSize(referenceImage.byteSize)} MB`
        : `${formatFileSize(referenceImage.byteSize)} KB`
    );
  }
  if (referenceImage.width > 0 && referenceImage.height > 0) {
    parts.push(`${referenceImage.width}×${referenceImage.height}`);
  }
  return parts.join(" ・ ");
}

export class AppRenderer {
  constructor(root, store) {
    this.root = root;
    this.store = store;
    this.toastTimer = null;
    this.previewProjectId = null;
    this.store.addEventListener("change", (event) => {
      if (event.detail.reason === "save-status") {
        this.refreshSaveIndicators();
        if (event.detail.saveStatus?.kind === "failed") {
          this.showToast(event.detail.saveStatus.message || "保存に失敗しました");
        }
        return;
      }
      this.render();
    });
    window.addEventListener("hashchange", () => this.render());
  }

  init() {
    if (!window.location.hash) {
      window.location.hash = "#home";
    }
    this.render();
  }

  render() {
    const route = parseHash(window.location.hash);
    if (route.name === "editor" && !this.store.getProject(route.projectId)) {
      navigate({ name: "home" });
      return;
    }
    const shell = element("div", { className: "app-shell" }, [
      this.renderTopbar(route),
      this.renderMain(route),
      this.renderBottomNav(route),
      this.renderToast()
    ]);
    this.root.replaceChildren(shell);
    this.refreshSaveIndicators();
    if (this.previewProjectId) this.openPreview(this.previewProjectId);
  }
  renderTopbar(route) {
    const labels = {
      home: T.home,
      projects: T.projects,
      editor: T.editor,
      settings: T.settings
    };
    return element("header", { className: "topbar" }, [
      element("div", { className: "topbar__inner" }, [
        element("div", { className: "brand" }, [
          element("div", { className: "brand__title", text: "PromptWeaver" }),
          element("div", { className: "brand__subtitle", text: labels[route.name] })
        ]),
        element("div", { className: "topbar-actions" }, [
          element("button", { className: "button button--ghost", text: T.newImage, onClick: () => { const project = this.store.createProject(PROJECT_TYPES.IMAGE); navigate({ name: "editor", projectId: project.id }); } }),
          element("button", { className: "button button--primary", text: T.newVideo, onClick: () => { const project = this.store.createProject(PROJECT_TYPES.VIDEO); navigate({ name: "editor", projectId: project.id }); } })
        ])
      ])
    ]);
  }

  renderMain(route) {
    const main = element("main", { className: "app-main" });
    if (route.name === "projects") main.append(this.renderProjectsPage());
    else if (route.name === "settings") main.append(this.renderSettingsPage());
    else if (route.name === "editor") main.append(this.renderEditorPage(this.store.getProject(route.projectId)));
    else main.append(this.renderHomePage());
    return main;
  }

  renderHomePage() {
    return element("section", { className: "page" }, [
      element("div", { className: "page-header" }, [element("div", {}, [element("h1", { className: "page-title", text: T.start }), element("p", { className: "page-note", text: T.startNote })])]),
      element("div", { className: "quick-actions" }, [
        element("button", { className: "button button--primary button--block", text: T.createImage, onClick: () => { const project = this.store.createProject(PROJECT_TYPES.IMAGE); navigate({ name: "editor", projectId: project.id }); } }),
        element("button", { className: "button button--block", text: T.createVideo, onClick: () => { const project = this.store.createProject(PROJECT_TYPES.VIDEO); navigate({ name: "editor", projectId: project.id }); } })
      ]),
      this.renderProjectCollection(T.recent, this.store.getRecentProjects(6)),
      this.renderProjectCollection(T.favorite, this.store.getFavoriteProjects(6)),
      element("section", { className: "panel settings-list" }, [
        element("h2", { className: "panel-title", text: T.smartphone }),
        element("div", { className: "muted", text: T.smartphoneNote }),
        element("div", { className: "button-row" }, [element("button", { className: "button", text: T.openQr, onClick: () => navigate({ name: "settings" }) })])
      ])
    ]);
  }

  renderProjectCollection(title, projects) {
    const panel = element("section", { className: "panel" }, [element("h2", { className: "panel-title", text: title })]);
    if (!projects.length) {
      panel.append(element("div", { className: "empty-state", text: T.emptyProjects }));
      return panel;
    }
    const list = element("div", { className: "project-list" });
    projects.forEach((project) => list.append(this.renderProjectCard(project)));
    panel.append(list);
    return panel;
  }

  renderProjectsPage() {
    const page = element("section", { className: "page" });
    const visibleProjects = this.store.getVisibleProjects();
    page.append(element("div", { className: "page-header" }, [element("div", {}, [element("h1", { className: "page-title", text: T.listTitle }), element("p", { className: "page-note", text: T.listNote })]) ]));
    const filterPanel = element("section", { className: "panel filters" });
    filterPanel.append(textField({ label: T.search, value: this.store.listState.searchText, placeholder: T.searchPlaceholder, onInput: (event) => this.store.setListState({ searchText: event.currentTarget.value }) }));
    const segmented = element("div", { className: "segmented" });
    Object.entries(LIST_FILTER_LABELS).forEach(([value, label]) => {
      segmented.append(element("button", { className: "segmented-button", text: label, attrs: { "aria-pressed": `${this.store.listState.filter === value}` }, onClick: () => this.store.setListState({ filter: value }) }));
    });
    filterPanel.append(segmented);
    filterPanel.append(selectField({ label: T.sort, value: this.store.listState.sort, options: Object.entries(SORT_OPTION_LABELS).map(([value, label]) => ({ value, label })), onChange: (event) => this.store.setListState({ sort: event.currentTarget.value }) }));
    page.append(filterPanel);
    if (!visibleProjects.length) {
      page.append(element("div", { className: "empty-state", text: T.noMatch }));
      return page;
    }
    const list = element("div", { className: "project-list" });
    visibleProjects.forEach((project) => list.append(this.renderProjectCard(project)));
    page.append(list);
    return page;
  }

  renderProjectCard(project) {
    const card = element("article", { className: "project-card" });
    card.append(element("div", { className: "project-card__head" }, [
      element("div", {}, [element("h3", { className: "project-card__title", text: getDisplayTitle(project) }), element("div", { className: "project-card__meta" }, [projectTypeBadge(project), hasReferenceImage(project) ? element("span", { className: "badge", text: T.referenceImage }) : null, project.favorite ? element("span", { className: "badge badge--accent", text: T.favorite }) : null])]),
      element("div", { className: "toolbar-inline" }, [element("button", { className: "button", text: T.open, onClick: () => navigate({ name: "editor", projectId: project.id }) }), element("button", { className: "button", text: project.favorite ? "★" : "☆", onClick: () => this.store.toggleFavorite(project.id) })])
    ]));
    if (project.summary.trim()) card.append(element("div", { className: "muted", text: project.summary }));
    if (project.tags.length) card.append(element("div", { className: "tags" }, project.tags.map((tag) => element("span", { className: "tag", text: `#${tag}` }))));
    card.append(element("div", { className: "project-card__actions" }, [element("span", { className: "faint", text: `${T.updated}: ${formatDateTime(project.updatedAt)}` }), element("button", { className: "button button--ghost", text: T.duplicate, onClick: () => { if (this.store.duplicateProject(project.id)) this.showToast(T.duplicated); } }), element("button", { className: "button button--danger", text: T.delete, onClick: () => { if (window.confirm(T.confirmDelete)) this.store.deleteProject(project.id); } })]));
    return card;
  }

  renderEditorPage(project) {
    const page = element("section", { className: "page" });
    const titleNode = element("h1", { className: "page-title", text: getDisplayTitle(project) });
    const note = project.projectType === PROJECT_TYPES.IMAGE ? T.editorImageNote : T.editorVideoNote;
    page.append(element("div", { className: "page-header" }, [element("div", {}, [titleNode, element("p", { className: "page-note", text: note })]), element("div", { className: "button-row" }, [element("button", { className: "button", text: T.toList, onClick: () => navigate({ name: "projects" }) }), element("button", { className: "button button--primary", text: T.preview, onClick: () => this.openPreview(project.id) })]) ]));
    const grid = element("div", { className: "editor-grid" });
    const formColumn = element("div", { className: "form-grid" });
    const toolbarColumn = element("div", { className: "toolbar" }, [element("div", { className: "toolbar__inner" }, [element("div", { className: "save-indicator", attrs: { "data-save-indicator": "true" }, text: formatSaveStatus(this.store.saveStatus) }), element("button", { className: "button button--primary button--block", text: T.exportMarkdown, onClick: () => { exportMarkdown(this.store.getExportableProject(project.id)); this.showToast(T.exportMarkdownDone); } }), element("button", { className: "button button--block", text: T.exportJson, onClick: () => { exportJson(this.store.getExportableProject(project.id)); this.showToast(T.exportJsonDone); } }), element("button", { className: "button button--block", text: project.favorite ? T.unfavorite : T.addFavorite, onClick: () => this.store.toggleFavorite(project.id) }), element("button", { className: "button button--danger button--block", text: T.delete, onClick: () => { if (window.confirm(T.confirmDelete)) { this.store.deleteProject(project.id); navigate({ name: "projects" }); } } })])]);
    formColumn.append(this.renderSharedEditorSection(project, titleNode));
    if (project.projectType === PROJECT_TYPES.IMAGE) {
      formColumn.append(this.renderReferenceImageSection(project), this.renderImageEditorSection(project));
    } else {
      formColumn.append(this.renderVideoEditorSection(project));
    }
    grid.append(formColumn, toolbarColumn);
    page.append(grid);
    return page;
  }

  renderSharedEditorSection(project, titleNode) {
    const section = element("section", { className: "editor-section" }, [element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: T.basicInfo })])]);
    const fieldGrid = element("div", { className: "field-grid" });
    fieldGrid.append(textField({ label: T.title, value: project.title, placeholder: T.titlePlaceholder, onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.title = event.currentTarget.value; }); titleNode.textContent = event.currentTarget.value.trim() || getDisplayTitle(project); } }));
    fieldGrid.append(textAreaField({ label: T.summary, value: project.summary, placeholder: T.summaryPlaceholder, onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.summary = event.currentTarget.value; }); } }));
    fieldGrid.append(textField({ label: T.tags, value: project.tags.join(", "), placeholder: "portrait, cinematic", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.tags = event.currentTarget.value; }); } }));
    const dual = element("div", { className: "field--two" });
    dual.append(selectField({ label: T.language, value: project.language, options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })), onChange: (event) => { this.store.updateProject(project.id, (draft) => { draft.language = event.currentTarget.value; }); } }), selectField({ label: T.outputFormat, value: project.outputFormat, options: Object.entries(OUTPUT_FORMAT_LABELS).map(([value, label]) => ({ value, label })), onChange: (event) => { this.store.updateProject(project.id, (draft) => { draft.outputFormat = event.currentTarget.value; }); } }));
    fieldGrid.append(dual);
    fieldGrid.append(toggleField({ label: T.favorite, checked: project.favorite, onChange: (event) => { this.store.updateProject(project.id, (draft) => { draft.favorite = event.currentTarget.checked; }, { render: true }); } }), toggleField({ label: T.archived, checked: project.archived, onChange: (event) => { this.store.updateProject(project.id, (draft) => { draft.archived = event.currentTarget.checked; }); } }));
    section.append(fieldGrid);
    return section;
  }

  renderReferenceImageSection(project) {
    const referenceImage = project.imageDetail.referenceImage;
    const section = element("section", { className: "editor-section" }, [
      element("div", { className: "editor-section__header" }, [
        element("h2", { className: "panel-title", text: T.referenceImage })
      ])
    ]);

    const content = element("div", { className: "reference-image-section" });
    const pickerInput = element("input", {
      attrs: {
        type: "file",
        accept: "image/*",
        hidden: "true"
      },
      onChange: async (event) => {
        const [file] = event.currentTarget.files ?? [];
        event.currentTarget.value = "";
        if (!file) {
          return;
        }

        await this.handleReferenceImageSelected(project.id, file);
      }
    });

    if (referenceImage?.dataUrl) {
      content.append(
        element("div", { className: "reference-image-card" }, [
          element("img", {
            className: "reference-image-card__preview",
            attrs: {
              src: referenceImage.dataUrl,
              alt: referenceImage.name || T.referenceImage,
              loading: "lazy"
            }
          }),
          element("div", { className: "reference-image-card__meta" }, [
            element("strong", {
              text: referenceImage.name || T.referenceImage
            }),
            element("div", {
              className: "muted",
              text: describeReferenceImage(referenceImage)
            })
          ])
        ])
      );
    } else {
      content.append(element("div", { className: "empty-state", text: T.referenceImageEmpty }));
    }

    content.append(
      element("div", { className: "button-row" }, [
        element("button", {
          className: "button",
          text: referenceImage?.dataUrl ? T.referenceImageReplace : T.referenceImageChoose,
          onClick: () => pickerInput.click()
        }),
        referenceImage?.dataUrl
          ? element("button", {
            className: "button button--danger",
            text: T.referenceImageRemove,
            onClick: () => this.removeReferenceImage(project.id)
          })
          : null
      ]),
      element("div", { className: "muted", text: T.referenceImageHint }),
      pickerInput
    );

    section.append(content);
    return section;
  }

  renderImageEditorSection(project) {
    const detail = project.imageDetail;
    const section = element("section", { className: "editor-section" }, [element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: T.imagePrompt })])]);
    const fields = [
      ["subject", "\u88ab\u5199\u4f53", "\u8ab0\u3092\u3001\u4f55\u3092\u4e2d\u5fc3\u306b\u63cf\u304f\u304b"],
      ["composition", "\u69cb\u56f3", "\u753b\u89d2\u3084\u914d\u7f6e\u306e\u610f\u56f3"],
      ["style", "\u30b9\u30bf\u30a4\u30eb", "\u4f5c\u98a8\u3084\u8cea\u611f"],
      ["lighting", "\u30e9\u30a4\u30c6\u30a3\u30f3\u30b0", "\u5149\u306e\u65b9\u5411\u3084\u7a2e\u985e"],
      ["camera", "\u30ab\u30e1\u30e9", "\u30ec\u30f3\u30ba\u3001\u753b\u89d2\u3001\u88ab\u5199\u754c\u6df1\u5ea6\u306a\u3069"],
      ["colorTone", "\u8272\u8abf", "\u5168\u4f53\u306e\u8272\u306e\u65b9\u5411\u6027"],
      ["mood", "\u30e0\u30fc\u30c9", "\u611f\u60c5\u3084\u96f0\u56f2\u6c17"],
      ["environment", "\u74b0\u5883", "\u5834\u6240\u3084\u80cc\u666f\u60c5\u5831"]
    ];
    const grid = element("div", { className: "field-grid" });
    fields.forEach(([key, label, placeholder]) => {
      grid.append(textField({ label, value: detail[key], placeholder, onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.imageDetail[key] = event.currentTarget.value; }); } }));
    });
    grid.append(textAreaField({ label: T.negativePrompt, value: detail.negativePrompt, placeholder: "\u907f\u3051\u305f\u3044\u8981\u7d20\u3084\u7834\u7dbb\u30dd\u30a4\u30f3\u30c8\u3092\u307e\u3068\u3081\u307e\u3059", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.imageDetail.negativePrompt = event.currentTarget.value; }); } }), textAreaField({ label: T.notes, value: detail.notes, placeholder: "\u53c2\u7167\u30a4\u30e1\u30fc\u30b8\u3084\u5236\u4f5c\u30e1\u30e2\u306a\u3069\u3092\u81ea\u7531\u306b\u66f8\u3051\u307e\u3059", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.imageDetail.notes = event.currentTarget.value; }); } }));
    section.append(grid);
    return section;
  }

  async handleReferenceImageSelected(projectId, file) {
    try {
      const preparedImage = await prepareReferenceImage(file);
      this.store.updateProject(projectId, (draft) => {
        draft.imageDetail.referenceImage = preparedImage;
      }, { render: true });
      this.showToast(T.referenceImageAdded);
    } catch (error) {
      this.showToast(error?.message || "参照画像を追加できませんでした");
    }
  }

  removeReferenceImage(projectId) {
    this.store.updateProject(projectId, (draft) => {
      draft.imageDetail.referenceImage = null;
    }, { render: true });
    this.showToast(T.referenceImageRemoved);
  }

  renderVideoEditorSection(project) {
    const detail = project.videoDetail;
    const section = element("section", { className: "editor-section" });
    section.append(element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: "\u52d5\u753b\u30d7\u30ed\u30f3\u30d7\u30c8" }), element("span", { className: "badge badge--accent", text: `\u5408\u8a08 ${getTotalDuration(project)}\u79d2` })]));
    const topFields = element("div", { className: "field-grid" });
    [["overallConcept", "\u5168\u4f53\u30b3\u30f3\u30bb\u30d7\u30c8", "\u52d5\u753b\u5168\u4f53\u306e\u72d9\u3044"],["visualStyle", "\u30d3\u30b8\u30e5\u30a2\u30eb\u30b9\u30bf\u30a4\u30eb", "\u6620\u50cf\u306e\u8cea\u611f\u3084\u65b9\u5411\u6027"],["pacing", "\u30c6\u30f3\u30dd", "\u3086\u3063\u304f\u308a\u3001\u7de9\u6025\u3042\u308a\u3001\u306a\u3069"],["aspectRatio", "\u30a2\u30b9\u30da\u30af\u30c8\u6bd4", "9:16 / 16:9 \u306a\u3069"]].forEach(([key, label, placeholder]) => {
      topFields.append(textField({ label, value: detail[key], placeholder, onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.videoDetail[key] = event.currentTarget.value; }); } }));
    });
    topFields.append(textAreaField({ label: T.negativePrompt, value: detail.negativePrompt, placeholder: "\u3061\u3089\u3064\u304d\u3084\u7834\u7dbb\u306a\u3069\u907f\u3051\u305f\u3044\u3053\u3068\u3092\u307e\u3068\u3081\u307e\u3059", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.videoDetail.negativePrompt = event.currentTarget.value; }); } }), textAreaField({ label: "\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u30e1\u30e2", value: detail.notes, placeholder: "\u6f14\u51fa\u65b9\u91dd\u3084\u5236\u4f5c\u30e1\u30e2\u3092\u6b8b\u3057\u307e\u3059", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.videoDetail.notes = event.currentTarget.value; }); } }));
    section.append(topFields);
    section.append(element("div", { className: "editor-section__header" }, [element("h3", { className: "panel-title", text: "\u30b7\u30fc\u30f3" }), element("button", { className: "button", text: "\u30b7\u30fc\u30f3\u3092\u8ffd\u52a0", onClick: () => { this.store.updateProject(project.id, (draft) => { draft.videoDetail.scenes.push(createVideoScene(draft.videoDetail.scenes.length)); }, { render: true }); } })]));
    if (!detail.scenes.length) {
      section.append(element("div", { className: "empty-state", text: "\u307e\u3060\u30b7\u30fc\u30f3\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u307e\u305a\u306f1\u3064\u8ffd\u52a0\u3057\u3066\u6d41\u308c\u3092\u4f5c\u308a\u307e\u3057\u3087\u3046\u3002" }));
      return section;
    }
    const sceneList = element("div", { className: "scene-list" });
    detail.scenes.forEach((scene, index) => sceneList.append(this.renderSceneCard(project, scene, index)));
    section.append(sceneList);
    return section;
  }

  renderSceneCard(project, scene, index) {
    const wrapper = element("details", { className: "scene-card", attrs: { open: "true" } });
    const summary = element("summary", { className: "scene-card__summary" }, [element("div", { className: "project-card__head" }, [element("div", {}, [element("h4", { className: "scene-card__title", text: scene.title.trim() || `\u30b7\u30fc\u30f3 ${index + 1}` }), element("div", { className: "muted", text: formatDurationSeconds(scene.durationSeconds) })]), element("div", { className: "scene-card__actions" }, [element("button", { className: "button button--ghost", text: "\u4e0a\u3078", onClick: (event) => { event.preventDefault(); if (index > 0) this.moveScene(project.id, index, index - 1); } }), element("button", { className: "button button--ghost", text: "\u4e0b\u3078", onClick: (event) => { event.preventDefault(); if (index < project.videoDetail.scenes.length - 1) this.moveScene(project.id, index, index + 1); } }), element("button", { className: "button button--ghost", text: T.duplicate, onClick: (event) => { event.preventDefault(); this.store.updateProject(project.id, (draft) => { const copy = { ...structuredClone(scene), id: createVideoScene(index + 1).id, title: scene.title.trim() ? `${scene.title.trim()} \u306e\u30b3\u30d4\u30fc` : "\u30b7\u30fc\u30f3\u306e\u30b3\u30d4\u30fc" }; draft.videoDetail.scenes.splice(index + 1, 0, copy); }, { render: true }); } }), element("button", { className: "button button--danger", text: T.delete, onClick: (event) => { event.preventDefault(); this.store.updateProject(project.id, (draft) => { draft.videoDetail.scenes.splice(index, 1); }, { render: true }); } })])])]);
    wrapper.append(summary);
    const grid = element("div", { className: "field-grid" });
    grid.append(textField({ label: "\u30b7\u30fc\u30f3\u30bf\u30a4\u30c8\u30eb", value: scene.title, placeholder: "\u30b7\u30fc\u30f3\u540d", onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.videoDetail.scenes[index].title = event.currentTarget.value; }); summary.querySelector(".scene-card__title").textContent = event.currentTarget.value.trim() || `\u30b7\u30fc\u30f3 ${index + 1}`; } }));
    const durationField = textField({ label: "\u9577\u3055\uff08\u79d2\uff09", value: String(scene.durationSeconds), placeholder: "5", type: "number", onInput: (event) => { const numeric = Math.max(1, Number(event.currentTarget.value) || 1); this.store.updateProject(project.id, (draft) => { draft.videoDetail.scenes[index].durationSeconds = numeric; }); summary.querySelector(".muted").textContent = formatDurationSeconds(numeric); } });
    durationField.querySelector("input").setAttribute("min", "1");
    grid.append(durationField);
    [["content", "\u5185\u5bb9", "\u3053\u306e\u30b7\u30fc\u30f3\u3067\u8d77\u3053\u308b\u3053\u3068"],["cameraWork", "\u30ab\u30e1\u30e9\u30ef\u30fc\u30af", "\u30d1\u30f3\u3001\u30c9\u30ea\u30fc\u3001\u56fa\u5b9a\u306a\u3069"],["subjectMotion", "\u88ab\u5199\u4f53\u306e\u52d5\u304d", "\u4eba\u7269\u3084\u7269\u306e\u52d5\u304d"],["background", "\u80cc\u666f", "\u74b0\u5883\u3084\u7a7a\u9593\u306e\u60c5\u5831"],["mood", "\u30e0\u30fc\u30c9", "\u611f\u60c5\u3084\u96f0\u56f2\u6c17"],["soundNote", "\u97f3\u306e\u30e1\u30e2", "BGM\u3084SE\u306e\u30e1\u30e2"],["transitionNote", "\u30c8\u30e9\u30f3\u30b8\u30b7\u30e7\u30f3", "\u6b21\u30b7\u30fc\u30f3\u3068\u306e\u3064\u306a\u304c\u308a"],["notes", "\u88dc\u8db3\u30e1\u30e2", "\u5236\u4f5c\u30e1\u30e2\u3084\u6ce8\u610f\u70b9"]].forEach(([key, label, placeholder]) => {
      grid.append(textAreaField({ label, value: scene[key], placeholder, onInput: (event) => { this.store.updateProject(project.id, (draft) => { draft.videoDetail.scenes[index][key] = event.currentTarget.value; }); } }));
    });
    wrapper.append(grid);
    return wrapper;
  }

  renderSettingsPage() {
    return element("section", { className: "page" }, [
      element("div", { className: "page-header" }, [element("div", {}, [element("h1", { className: "page-title", text: T.settings }), element("p", { className: "page-note", text: "\u65e2\u5b9a\u5024\u3001\u5171\u6709 URL\u3001\u30b9\u30de\u30db\u3078\u306e\u5c0e\u7dda\u3092\u307e\u3068\u3081\u3066\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002" })]) ]),
      element("section", { className: "panel settings-list" }, [selectField({ label: "\u65e2\u5b9a\u306e\u8a00\u8a9e", value: this.store.settings.defaultLanguage, options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })), onChange: (event) => { this.store.updateSettings((settings) => { settings.defaultLanguage = event.currentTarget.value; }); } }), toggleField({ label: "Windows \u9023\u643a\u5411\u3051\u306e\u66f8\u304d\u51fa\u3057\u3092\u524d\u63d0\u306b\u3059\u308b", checked: this.store.settings.reflectionExportEnabled, onChange: (event) => { this.store.updateSettings((settings) => { settings.reflectionExportEnabled = event.currentTarget.checked; }); } }), element("div", { className: "muted", text: "\u3053\u306e Web \u7248\u3067\u306f\u81ea\u52d5\u540c\u671f\u306f\u307e\u3060\u3042\u308a\u307e\u305b\u3093\u3002\u5fc5\u8981\u306a\u3068\u304d\u306b Markdown / JSON \u3092\u66f8\u304d\u51fa\u3057\u3066\u3001iCloud Drive \u3084 OneDrive \u306b\u7f6e\u304f\u904b\u7528\u304c\u3067\u304d\u307e\u3059\u3002" }), element("div", { className: "muted", text: "iPhone \u306f Safari \u306e\u5171\u6709\u30e1\u30cb\u30e5\u30fc\u304b\u3089\u30db\u30fc\u30e0\u753b\u9762\u306b\u8ffd\u52a0\u3001Windows \u306f Edge / Chrome \u3067\u30a4\u30f3\u30b9\u30c8\u30fc\u30eb\u3059\u308b\u3068\u30a2\u30d7\u30ea\u306e\u3088\u3046\u306b\u4f7f\u3048\u307e\u3059\u3002" })]),
      this.renderQrShareSection()
    ]);
  }

  getShareUrl() {
    const configuredUrl = `${this.store.settings.shareUrl ?? ""}`.trim();
    const currentUrl = window.location.href.split("#")[0];
    return configuredUrl || currentUrl;
  }
  renderQrShareSection() {
    const shareUrl = this.getShareUrl();
    const isValidUrl = isShareableHttpUrl(shareUrl);
    const usesLocalhost = /localhost|127\.0\.0\.1/.test(shareUrl);
    const prefersHttps = shareUrl.startsWith("https://");
    const qrImageUrl = buildQrCodeImageUrl(shareUrl);
    return element("section", { className: "panel settings-list" }, [
      element("div", {}, [element("h2", { className: "panel-title", text: "QR\u5171\u6709" }), element("p", { className: "page-note", text: "\u516c\u958b URL \u3084\u540c\u3058 Wi-Fi \u4e0a\u306e URL \u3092 QR \u30b3\u30fc\u30c9\u5316\u3057\u3066\u3001\u30b9\u30de\u30db\u304b\u3089\u958b\u304d\u3084\u3059\u304f\u3057\u307e\u3059\u3002" })]),
      textField({ label: "\u5171\u6709\u7528URL", value: this.store.settings.shareUrl, placeholder: "https://example.com/promptweaver/", onInput: (event) => { this.store.updateSettings((settings) => { settings.shareUrl = event.currentTarget.value; }); } }),
      element("div", { className: "button-row" }, [element("button", { className: "button", text: "\u73fe\u5728\u306eURL\u3092\u4f7f\u3046", onClick: () => { this.store.updateSettings((settings) => { settings.shareUrl = window.location.href.split("#")[0]; }); this.showToast("\u73fe\u5728\u306eURL\u3092\u5171\u6709\u7528\u306b\u30bb\u30c3\u30c8\u3057\u307e\u3057\u305f"); } }), element("button", { className: "button", text: "URL\u3092\u30b3\u30d4\u30fc", onClick: async () => { if (!isValidUrl) { this.showToast("\u5148\u306b\u5171\u6709\u3067\u304d\u308bURL\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"); return; } await copyText(shareUrl); this.showToast("\u5171\u6709\u7528URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f"); } }), element("button", { className: "button button--primary", text: "URL\u3092\u5171\u6709", onClick: async () => { if (!isValidUrl) { this.showToast("http \u307e\u305f\u306f https \u306eURL\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044"); return; } const shared = await shareAppUrl(shareUrl, "PromptWeaver \u3092\u958b\u304f").catch(() => false); if (shared) this.showToast("\u5171\u6709\u30b7\u30fc\u30c8\u3092\u958b\u304d\u307e\u3057\u305f"); else { await copyText(shareUrl); this.showToast("\u5171\u6709\u306b\u672a\u5bfe\u5fdc\u306e\u305f\u3081URL\u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f"); } } })]),
      element("div", { className: "qr-share__url", text: shareUrl || "\u5171\u6709\u7528URL\u3092\u5165\u529b\u3059\u308b\u3068\u3053\u3053\u306b\u8868\u793a\u3055\u308c\u307e\u3059" }),
      isValidUrl ? element("div", { className: "qr-share" }, [element("div", { className: "qr-share__image-wrap" }, [element("img", { className: "qr-share__image", attrs: { src: qrImageUrl, alt: "\u5171\u6709\u7528URL\u306eQR\u30b3\u30fc\u30c9", loading: "lazy", referrerpolicy: "no-referrer" } })]), element("div", { className: "muted", text: "\u3053\u306e QR \u30b3\u30fc\u30c9\u3092\u30b9\u30de\u30db\u3067\u8aad\u307f\u53d6\u308b\u3068\u3001PromptWeaver Web \u3092\u3059\u3050\u958b\u3051\u307e\u3059\u3002" }), usesLocalhost ? element("div", { className: "muted", text: "localhost \u3084 127.0.0.1 \u306f\u5225\u7aef\u672b\u304b\u3089\u958b\u3051\u307e\u305b\u3093\u3002PC \u306e LAN IP \u304b HTTPS \u516c\u958b URL \u3092\u4f7f\u3063\u3066\u304f\u3060\u3055\u3044\u3002" }) : null, !usesLocalhost && !prefersHttps ? element("div", { className: "muted", text: "HTTP \u3067\u3082\u958b\u3051\u307e\u3059\u304c\u3001\u30db\u30fc\u30e0\u753b\u9762\u8ffd\u52a0\u3084\u30aa\u30d5\u30e9\u30a4\u30f3\u5229\u7528\u3092\u5b89\u5b9a\u3055\u305b\u308b\u306a\u3089 HTTPS \u304c\u304a\u3059\u3059\u3081\u3067\u3059\u3002" }) : null, element("div", { className: "muted", text: "QR\u30b3\u30fc\u30c9\u306f\u30a2\u30d7\u30ea\u5185\u3067\u751f\u6210\u3057\u3066\u3044\u307e\u3059\u3002\u5171\u6709\u7528 URL \u3092\u5916\u90e8\u306e QR \u751f\u6210\u30b5\u30fc\u30d3\u30b9\u3078\u9001\u3063\u3066\u3044\u307e\u305b\u3093\u3002" })]) : element("div", { className: "empty-state", text: "http \u307e\u305f\u306f https \u304b\u3089\u59cb\u307e\u308b\u5171\u6709\u7528URL\u3092\u5165\u529b\u3059\u308b\u3068\u3001\u3053\u3053\u306b QR \u30b3\u30fc\u30c9\u3092\u8868\u793a\u3057\u307e\u3059\u3002" })
    ]);
  }

  renderBottomNav(route) {
    const items = [
      { name: "home", label: T.home },
      { name: "projects", label: "\u4e00\u89a7" },
      { name: "settings", label: T.settings }
    ];
    return element("nav", { className: "bottom-nav" }, [element("div", { className: "bottom-nav__inner" }, items.map((item) => element("button", { className: "bottom-nav__item", attrs: { "aria-current": route.name === item.name ? "page" : "false" }, onClick: () => navigate({ name: item.name }), html: `<span>${item.label}</span>` })))]);
  }

  renderToast() {
    return element("div", { className: "toast", attrs: { id: "toast", hidden: "true" } });
  }

  refreshSaveIndicators() {
    this.root.querySelectorAll("[data-save-indicator]").forEach((node) => {
      node.textContent = formatSaveStatus(this.store.saveStatus);
    });
  }

  moveScene(projectId, fromIndex, toIndex) {
    this.store.updateProject(projectId, (draft) => {
      const [scene] = draft.videoDetail.scenes.splice(fromIndex, 1);
      draft.videoDetail.scenes.splice(toIndex, 0, scene);
    }, { render: true });
  }

  async openPreview(projectId) {
    const project = this.store.getExportableProject(projectId);
    if (!project) return;
    this.previewProjectId = projectId;
    this.root.querySelector(".preview-overlay")?.remove();
    const markdown = generateMarkdown(project);
    const overlay = element("div", { className: "preview-overlay", onClick: (event) => { if (event.target === overlay) this.closePreview(); } });
    overlay.append(element("div", { className: "preview-modal" }, [element("div", { className: "preview-modal__header" }, [element("div", {}, [element("strong", { text: getDisplayTitle(project) }), element("div", { className: "muted", text: "\u7a7a\u6b04\u306f\u7701\u3044\u3066 Markdown \u3092\u7d44\u307f\u7acb\u3066\u3066\u3044\u307e\u3059\u3002" })]), element("button", { className: "button", text: "\u9589\u3058\u308b", onClick: () => this.closePreview() })]), element("div", { className: "preview-modal__actions" }, [element("div", { className: "button-row" }, [element("button", { className: "button", text: "\u30b3\u30d4\u30fc", onClick: async () => { await copyText(markdown); this.showToast("Markdown \u3092\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f"); } }), element("button", { className: "button", text: "\u5171\u6709", onClick: async () => { const shared = await shareMarkdown(project).catch(() => false); if (shared) this.showToast("\u5171\u6709\u30b7\u30fc\u30c8\u3092\u958b\u304d\u307e\u3057\u305f"); else { await copyText(markdown); this.showToast("\u5171\u6709\u306b\u672a\u5bfe\u5fdc\u306e\u305f\u3081\u30b3\u30d4\u30fc\u3057\u307e\u3057\u305f"); } } }), element("button", { className: "button button--primary", text: T.exportMarkdown, onClick: () => { exportMarkdown(project); this.showToast(T.exportMarkdownDone); } }), element("button", { className: "button", text: T.exportJson, onClick: () => { exportJson(project); this.showToast(T.exportJsonDone); } })])]), element("div", { className: "preview-modal__body" }, [element("pre", { className: "preview-text", text: markdown })]) ]));
    this.root.append(overlay);
  }

  closePreview() {
    this.previewProjectId = null;
    this.root.querySelector(".preview-overlay")?.remove();
  }

  showToast(message) {
    const toast = this.root.querySelector("#toast");
    if (!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2200);
  }
}

