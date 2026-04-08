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
import { copyText, exportJson, exportMarkdown, shareMarkdown } from "../core/export.js";
import { navigate, parseHash } from "./router.js";

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

export class AppRenderer {
  constructor(root, store) {
    this.root = root;
    this.store = store;
    this.toastTimer = null;
    this.previewProjectId = null;

    this.store.addEventListener("change", (event) => {
      if (event.detail.reason === "save-status") {
        this.refreshSaveIndicators();
        return;
      }
      this.render();
    });

    window.addEventListener("hashchange", () => this.render());
  }

  init() {
    if (!window.location.hash) {
      navigate({ name: "home" });
      return;
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
    const labels = { home: "ホーム", projects: "プロジェクト", editor: "編集", settings: "設定" };
    return element("header", { className: "topbar" }, [
      element("div", { className: "topbar__inner" }, [
        element("div", { className: "brand" }, [
          element("div", { className: "brand__title", text: "PromptWeaver" }),
          element("div", { className: "brand__subtitle", text: labels[route.name] })
        ]),
        element("div", { className: "topbar-actions" }, [
          element("button", {
            className: "button button--ghost",
            text: "新しい画像",
            onClick: () => {
              const project = this.store.createProject(PROJECT_TYPES.IMAGE);
              navigate({ name: "editor", projectId: project.id });
            }
          }),
          element("button", {
            className: "button button--primary",
            text: "新しい動画",
            onClick: () => {
              const project = this.store.createProject(PROJECT_TYPES.VIDEO);
              navigate({ name: "editor", projectId: project.id });
            }
          })
        ])
      ])
    ]);
  }

  renderMain(route) {
    const main = element("main", { className: "app-main" });
    switch (route.name) {
      case "projects":
        main.append(this.renderProjectsPage());
        break;
      case "settings":
        main.append(this.renderSettingsPage());
        break;
      case "editor":
        main.append(this.renderEditorPage(this.store.getProject(route.projectId)));
        break;
      case "home":
      default:
        main.append(this.renderHomePage());
        break;
    }
    return main;
  }

  renderHomePage() {
    const recentProjects = this.store.getRecentProjects(6);
    const favoriteProjects = this.store.getFavoriteProjects(6);
    return element("section", { className: "page" }, [
      element("div", { className: "page-header" }, [
        element("div", {}, [
          element("h1", { className: "page-title", text: "すぐ作る" }),
          element("p", { className: "page-note", text: "画像も動画も、構造化した下書きからそのまま Markdown に落とせます。" })
        ])
      ]),
      element("div", { className: "quick-actions" }, [
        element("button", {
          className: "button button--primary button--block",
          text: "画像プロンプトを作成",
          onClick: () => {
            const project = this.store.createProject(PROJECT_TYPES.IMAGE);
            navigate({ name: "editor", projectId: project.id });
          }
        }),
        element("button", {
          className: "button button--block",
          text: "動画プロンプトを作成",
          onClick: () => {
            const project = this.store.createProject(PROJECT_TYPES.VIDEO);
            navigate({ name: "editor", projectId: project.id });
          }
        })
      ]),
      this.renderProjectCollection("最近のプロジェクト", recentProjects),
      this.renderProjectCollection("お気に入り", favoriteProjects),
      element("section", { className: "panel settings-list" }, [
        element("h2", { className: "panel-title", text: "スマホでの使い方" }),
        element("div", { className: "muted", text: "iPhone は Safari の共有メニューからホーム画面に追加できます。Windows は Edge / Chrome からアプリとしてインストールできます。" })
      ])
    ]);
  }

  renderProjectCollection(title, projects) {
    const panel = element("section", { className: "panel" }, [element("h2", { className: "panel-title", text: title })]);
    if (!projects.length) {
      panel.append(element("div", { className: "empty-state", text: "まだ表示できるプロジェクトがありません。" }));
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

    page.append(element("div", { className: "page-header" }, [
      element("div", {}, [
        element("h1", { className: "page-title", text: "プロジェクト一覧" }),
        element("p", { className: "page-note", text: "タイトルとタグで検索しながら、複製や書き出し前の整理ができます。" })
      ])
    ]));

    const filterPanel = element("section", { className: "panel filters" });
    filterPanel.append(textField({
      label: "検索",
      value: this.store.listState.searchText,
      placeholder: "タイトルまたはタグで検索",
      onInput: (event) => this.store.setListState({ searchText: event.currentTarget.value })
    }));

    const segmented = element("div", { className: "segmented" });
    Object.entries(LIST_FILTER_LABELS).forEach(([value, label]) => {
      segmented.append(element("button", {
        className: "segmented-button",
        text: label,
        attrs: { "aria-pressed": `${this.store.listState.filter === value}` },
        onClick: () => this.store.setListState({ filter: value })
      }));
    });
    filterPanel.append(segmented);
    filterPanel.append(selectField({
      label: "並び順",
      value: this.store.listState.sort,
      options: Object.entries(SORT_OPTION_LABELS).map(([value, label]) => ({ value, label })),
      onChange: (event) => this.store.setListState({ sort: event.currentTarget.value })
    }));
    page.append(filterPanel);

    if (!visibleProjects.length) {
      page.append(element("div", { className: "empty-state", text: "一致するプロジェクトがありません。検索語やフィルターを調整してください。" }));
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
      element("div", {}, [
        element("h3", { className: "project-card__title", text: getDisplayTitle(project) }),
        element("div", { className: "project-card__meta" }, [
          projectTypeBadge(project),
          project.favorite ? element("span", { className: "badge badge--accent", text: "お気に入り" }) : null
        ])
      ]),
      element("div", { className: "toolbar-inline" }, [
        element("button", { className: "button", text: "開く", onClick: () => navigate({ name: "editor", projectId: project.id }) }),
        element("button", { className: "button", text: project.favorite ? "★" : "☆", onClick: () => this.store.toggleFavorite(project.id) })
      ])
    ]));

    if (project.summary.trim()) card.append(element("div", { className: "muted", text: project.summary }));
    if (project.tags.length) {
      card.append(element("div", { className: "tags" }, project.tags.map((tag) => element("span", { className: "tag", text: `#${tag}` }))));
    }

    card.append(element("div", { className: "project-card__actions" }, [
      element("span", { className: "faint", text: `更新: ${formatDateTime(project.updatedAt)}` }),
      element("button", {
        className: "button button--ghost",
        text: "複製",
        onClick: () => {
          const duplicated = this.store.duplicateProject(project.id);
          if (duplicated) this.showToast("プロジェクトを複製しました");
        }
      }),
      element("button", {
        className: "button button--danger",
        text: "削除",
        onClick: () => {
          if (window.confirm("このプロジェクトを削除しますか？")) this.store.deleteProject(project.id);
        }
      })
    ]));
    return card;
  }
  renderEditorPage(project) {
    const page = element("section", { className: "page" });
    const titleNode = element("h1", { className: "page-title", text: getDisplayTitle(project) });

    page.append(element("div", { className: "page-header" }, [
      element("div", {}, [
        titleNode,
        element("p", { className: "page-note", text: project.projectType === PROJECT_TYPES.IMAGE ? "構図や質感を積み上げながら、画像生成向けの Markdown を整えます。" : "シーン単位で時間と内容を組み立てて、動画生成用の下書きを整えます。" })
      ]),
      element("div", { className: "button-row" }, [
        element("button", { className: "button", text: "一覧へ", onClick: () => navigate({ name: "projects" }) }),
        element("button", { className: "button button--primary", text: "Markdown プレビュー", onClick: () => this.openPreview(project.id) })
      ])
    ]));

    const grid = element("div", { className: "editor-grid" });
    const formColumn = element("div", { className: "form-grid" });
    const toolbarColumn = element("div", { className: "toolbar" }, [
      element("div", { className: "toolbar__inner" }, [
        element("div", { className: "save-indicator", attrs: { "data-save-indicator": "true" }, text: formatSaveStatus(this.store.saveStatus) }),
        element("button", {
          className: "button button--primary button--block",
          text: "Markdown を書き出す",
          onClick: () => {
            exportMarkdown(this.store.getExportableProject(project.id));
            this.showToast("Markdown を書き出しました");
          }
        }),
        element("button", {
          className: "button button--block",
          text: "JSON を書き出す",
          onClick: () => {
            exportJson(this.store.getExportableProject(project.id));
            this.showToast("JSON を書き出しました");
          }
        }),
        element("button", {
          className: "button button--block",
          text: project.favorite ? "お気に入り解除" : "お気に入りに追加",
          onClick: () => this.store.toggleFavorite(project.id)
        }),
        element("button", {
          className: "button button--danger button--block",
          text: "削除",
          onClick: () => {
            if (window.confirm("このプロジェクトを削除しますか？")) {
              this.store.deleteProject(project.id);
              navigate({ name: "projects" });
            }
          }
        })
      ])
    ]);

    formColumn.append(this.renderSharedEditorSection(project, titleNode));
    if (project.projectType === PROJECT_TYPES.IMAGE) formColumn.append(this.renderImageEditorSection(project));
    else formColumn.append(this.renderVideoEditorSection(project));

    grid.append(formColumn, toolbarColumn);
    page.append(grid);
    return page;
  }

  renderSharedEditorSection(project, titleNode) {
    const section = element("section", { className: "editor-section" }, [
      element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: "基本情報" })])
    ]);
    const fieldGrid = element("div", { className: "field-grid" });

    fieldGrid.append(textField({
      label: "タイトル",
      value: project.title,
      placeholder: "タイトルは空でも大丈夫です",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.title = event.currentTarget.value;
        });
        titleNode.textContent = event.currentTarget.value.trim() || getDisplayTitle(project);
      }
    }));

    fieldGrid.append(textAreaField({
      label: "概要",
      value: project.summary,
      placeholder: "用途や狙いを短くまとめます",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.summary = event.currentTarget.value;
        });
      }
    }));

    fieldGrid.append(textField({
      label: "タグ（カンマ区切り）",
      value: project.tags.join(", "),
      placeholder: "portrait, cinematic",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.tags = event.currentTarget.value;
        });
      }
    }));

    const dual = element("div", { className: "field--two" });
    dual.append(
      selectField({
        label: "言語",
        value: project.language,
        options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.language = event.currentTarget.value;
          });
        }
      }),
      selectField({
        label: "出力形式",
        value: project.outputFormat,
        options: Object.entries(OUTPUT_FORMAT_LABELS).map(([value, label]) => ({ value, label })),
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.outputFormat = event.currentTarget.value;
          });
        }
      })
    );
    fieldGrid.append(dual);

    fieldGrid.append(
      toggleField({
        label: "お気に入り",
        checked: project.favorite,
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.favorite = event.currentTarget.checked;
          }, { render: true });
        }
      }),
      toggleField({
        label: "アーカイブ",
        checked: project.archived,
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.archived = event.currentTarget.checked;
          });
        }
      })
    );

    section.append(fieldGrid);
    return section;
  }

  renderImageEditorSection(project) {
    const detail = project.imageDetail;
    const section = element("section", { className: "editor-section" }, [
      element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: "画像プロンプト" })])
    ]);
    const fields = [
      ["subject", "被写体", "誰を、何を中心に描くか"],
      ["composition", "構図", "画角や配置の意図"],
      ["style", "スタイル", "作風や質感"],
      ["lighting", "ライティング", "光の方向や種類"],
      ["camera", "カメラ", "レンズ、画角、被写界深度など"],
      ["colorTone", "色調", "全体の色の方向性"],
      ["mood", "ムード", "感情や雰囲気"],
      ["environment", "環境", "場所や背景情報"]
    ];

    const grid = element("div", { className: "field-grid" });
    fields.forEach(([key, label, placeholder]) => {
      grid.append(textField({
        label,
        value: detail[key],
        placeholder,
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.imageDetail[key] = event.currentTarget.value;
          });
        }
      }));
    });

    grid.append(
      textAreaField({
        label: "ネガティブプロンプト",
        value: detail.negativePrompt,
        placeholder: "避けたい要素や破綻ポイントをまとめます",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.imageDetail.negativePrompt = event.currentTarget.value;
          });
        }
      }),
      textAreaField({
        label: "メモ",
        value: detail.notes,
        placeholder: "参照イメージや制作メモなどを自由に書けます",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.imageDetail.notes = event.currentTarget.value;
          });
        }
      })
    );

    section.append(grid);
    return section;
  }

  renderVideoEditorSection(project) {
    const detail = project.videoDetail;
    const section = element("section", { className: "editor-section" });
    section.append(element("div", { className: "editor-section__header" }, [
      element("h2", { className: "panel-title", text: "動画プロンプト" }),
      element("span", { className: "badge badge--accent", text: `合計 ${getTotalDuration(project)}秒` })
    ]));

    const topFields = element("div", { className: "field-grid" });
    [
      ["overallConcept", "全体コンセプト", "動画全体の狙い"],
      ["visualStyle", "ビジュアルスタイル", "映像の質感や方向性"],
      ["pacing", "テンポ", "ゆっくり、緩急あり、など"],
      ["aspectRatio", "アスペクト比", "9:16 / 16:9 など"]
    ].forEach(([key, label, placeholder]) => {
      topFields.append(textField({
        label,
        value: detail[key],
        placeholder,
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail[key] = event.currentTarget.value;
          });
        }
      }));
    });

    topFields.append(
      textAreaField({
        label: "ネガティブプロンプト",
        value: detail.negativePrompt,
        placeholder: "ちらつきや破綻など避けたいことをまとめます",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.negativePrompt = event.currentTarget.value;
          });
        }
      }),
      textAreaField({
        label: "プロジェクトメモ",
        value: detail.notes,
        placeholder: "演出方針や制作メモを残します",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.notes = event.currentTarget.value;
          });
        }
      })
    );
    section.append(topFields);

    section.append(element("div", { className: "editor-section__header" }, [
      element("h3", { className: "panel-title", text: "シーン" }),
      element("button", {
        className: "button",
        text: "シーンを追加",
        onClick: () => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.scenes.push(createVideoScene(draft.videoDetail.scenes.length));
          }, { render: true });
        }
      })
    ]));

    if (!detail.scenes.length) {
      section.append(element("div", { className: "empty-state", text: "まだシーンがありません。まずは1つ追加して流れを作りましょう。" }));
      return section;
    }

    const sceneList = element("div", { className: "scene-list" });
    detail.scenes.forEach((scene, index) => sceneList.append(this.renderSceneCard(project, scene, index)));
    section.append(sceneList);
    return section;
  }
  renderSceneCard(project, scene, index) {
    const wrapper = element("details", { className: "scene-card", attrs: { open: "true" } });
    const summary = element("summary", { className: "scene-card__summary" }, [
      element("div", { className: "project-card__head" }, [
        element("div", {}, [
          element("h4", { className: "scene-card__title", text: scene.title.trim() || `シーン ${index + 1}` }),
          element("div", { className: "muted", text: formatDurationSeconds(scene.durationSeconds) })
        ]),
        element("div", { className: "scene-card__actions" }, [
          element("button", {
            className: "button button--ghost",
            text: "上へ",
            onClick: (event) => {
              event.preventDefault();
              if (index > 0) this.moveScene(project.id, index, index - 1);
            }
          }),
          element("button", {
            className: "button button--ghost",
            text: "下へ",
            onClick: (event) => {
              event.preventDefault();
              if (index < project.videoDetail.scenes.length - 1) this.moveScene(project.id, index, index + 1);
            }
          }),
          element("button", {
            className: "button button--ghost",
            text: "複製",
            onClick: (event) => {
              event.preventDefault();
              this.store.updateProject(project.id, (draft) => {
                const copy = {
                  ...structuredClone(scene),
                  id: crypto.randomUUID(),
                  title: scene.title.trim() ? `${scene.title.trim()} のコピー` : "シーンのコピー"
                };
                draft.videoDetail.scenes.splice(index + 1, 0, copy);
              }, { render: true });
            }
          }),
          element("button", {
            className: "button button--danger",
            text: "削除",
            onClick: (event) => {
              event.preventDefault();
              this.store.updateProject(project.id, (draft) => {
                draft.videoDetail.scenes.splice(index, 1);
              }, { render: true });
            }
          })
        ])
      ])
    ]);

    wrapper.append(summary);
    const grid = element("div", { className: "field-grid" });
    grid.append(textField({
      label: "シーンタイトル",
      value: scene.title,
      placeholder: "シーン名",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.videoDetail.scenes[index].title = event.currentTarget.value;
        });
        summary.querySelector(".scene-card__title").textContent = event.currentTarget.value.trim() || `シーン ${index + 1}`;
      }
    }));

    const durationField = textField({
      label: "長さ（秒）",
      value: String(scene.durationSeconds),
      placeholder: "5",
      type: "number",
      onInput: (event) => {
        const numeric = Math.max(1, Number(event.currentTarget.value) || 1);
        this.store.updateProject(project.id, (draft) => {
          draft.videoDetail.scenes[index].durationSeconds = numeric;
        });
        summary.querySelector(".muted").textContent = formatDurationSeconds(numeric);
      }
    });
    durationField.querySelector("input").setAttribute("min", "1");
    grid.append(durationField);

    [
      ["content", "内容", "このシーンで起こること"],
      ["cameraWork", "カメラワーク", "パン、ドリー、固定など"],
      ["subjectMotion", "被写体の動き", "人物や物の動き"],
      ["background", "背景", "環境や空間の情報"],
      ["mood", "ムード", "感情や雰囲気"],
      ["soundNote", "音のメモ", "BGMやSEのメモ"],
      ["transitionNote", "トランジション", "次シーンとのつながり"],
      ["notes", "補足メモ", "制作メモや注意点"]
    ].forEach(([key, label, placeholder]) => {
      grid.append(textAreaField({
        label,
        value: scene[key],
        placeholder,
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.scenes[index][key] = event.currentTarget.value;
          });
        }
      }));
    });

    wrapper.append(grid);
    return wrapper;
  }

  renderSettingsPage() {
    return element("section", { className: "page" }, [
      element("div", { className: "page-header" }, [
        element("div", {}, [
          element("h1", { className: "page-title", text: "設定" }),
          element("p", { className: "page-note", text: "既定値やインストール時の使い方を確認できます。" })
        ])
      ]),
      element("section", { className: "panel settings-list" }, [
        selectField({
          label: "既定の言語",
          value: this.store.settings.defaultLanguage,
          options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
          onChange: (event) => {
            this.store.updateSettings((settings) => {
              settings.defaultLanguage = event.currentTarget.value;
            });
          }
        }),
        toggleField({
          label: "Windows 連携向けの書き出しを前提にする",
          checked: this.store.settings.reflectionExportEnabled,
          onChange: (event) => {
            this.store.updateSettings((settings) => {
              settings.reflectionExportEnabled = event.currentTarget.checked;
            });
          }
        }),
        element("div", { className: "muted", text: "この Web 版では自動同期はまだありません。必要なときに Markdown / JSON を書き出して、iCloud Drive や OneDrive に置く運用ができます。" }),
        element("div", { className: "muted", text: "iPhone は Safari の共有メニューからホーム画面に追加、Windows は Edge / Chrome でインストールするとアプリのように使えます。" })
      ])
    ]);
  }

  renderBottomNav(route) {
    const items = [
      { name: "home", label: "ホーム", icon: "⌂" },
      { name: "projects", label: "一覧", icon: "▦" },
      { name: "settings", label: "設定", icon: "⚙" }
    ];

    return element("nav", { className: "bottom-nav" }, [
      element("div", { className: "bottom-nav__inner" }, items.map((item) =>
        element("button", {
          className: "bottom-nav__item",
          attrs: { "aria-current": route.name === item.name ? "page" : "false" },
          onClick: () => navigate({ name: item.name }),
          html: `<span>${item.icon}</span><span>${item.label}</span>`
        })
      ))
    ]);
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
    const overlay = element("div", {
      className: "preview-overlay",
      onClick: (event) => {
        if (event.target === overlay) this.closePreview();
      }
    });

    overlay.append(element("div", { className: "preview-modal" }, [
      element("div", { className: "preview-modal__header" }, [
        element("div", {}, [
          element("strong", { text: getDisplayTitle(project) }),
          element("div", { className: "muted", text: "空欄は省いて Markdown を組み立てています。" })
        ]),
        element("button", { className: "button", text: "閉じる", onClick: () => this.closePreview() })
      ]),
      element("div", { className: "preview-modal__actions" }, [
        element("div", { className: "button-row" }, [
          element("button", {
            className: "button",
            text: "コピー",
            onClick: async () => {
              await copyText(markdown);
              this.showToast("Markdown をコピーしました");
            }
          }),
          element("button", {
            className: "button",
            text: "共有",
            onClick: async () => {
              const shared = await shareMarkdown(project).catch(() => false);
              if (shared) this.showToast("共有シートを開きました");
              else {
                await copyText(markdown);
                this.showToast("共有に未対応のためコピーしました");
              }
            }
          }),
          element("button", {
            className: "button button--primary",
            text: "Markdown を書き出す",
            onClick: () => {
              exportMarkdown(project);
              this.showToast("Markdown を書き出しました");
            }
          }),
          element("button", {
            className: "button",
            text: "JSON を書き出す",
            onClick: () => {
              exportJson(project);
              this.showToast("JSON を書き出しました");
            }
          })
        ])
      ]),
      element("div", { className: "preview-modal__body" }, [
        element("pre", { className: "preview-text", text: markdown })
      ])
    ]));

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
    this.toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2200);
  }
}
