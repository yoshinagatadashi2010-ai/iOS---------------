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
import { buildQrCodeImageUrl, copyText, exportJson, exportMarkdown, isShareableHttpUrl, shareAppUrl, shareMarkdown } from "../core/export.js";
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
    const labels = { home: "�z�[��", projects: "�v���W�F�N�g", editor: "�ҏW", settings: "�ݒ�" };
    return element("header", { className: "topbar" }, [
      element("div", { className: "topbar__inner" }, [
        element("div", { className: "brand" }, [
          element("div", { className: "brand__title", text: "PromptWeaver" }),
          element("div", { className: "brand__subtitle", text: labels[route.name] })
        ]),
        element("div", { className: "topbar-actions" }, [
          element("button", {
            className: "button button--ghost",
            text: "�V�����摜",
            onClick: () => {
              const project = this.store.createProject(PROJECT_TYPES.IMAGE);
              navigate({ name: "editor", projectId: project.id });
            }
          }),
          element("button", {
            className: "button button--primary",
            text: "�V��������",
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
          element("h1", { className: "page-title", text: "�������" }),
          element("p", { className: "page-note", text: "�摜������A�\�����������������炻�̂܂� Markdown �ɗ��Ƃ��܂��B" })
        ])
      ]),
      element("div", { className: "quick-actions" }, [
        element("button", {
          className: "button button--primary button--block",
          text: "�摜�v�����v�g��쐬",
          onClick: () => {
            const project = this.store.createProject(PROJECT_TYPES.IMAGE);
            navigate({ name: "editor", projectId: project.id });
          }
        }),
        element("button", {
          className: "button button--block",
          text: "����v�����v�g��쐬",
          onClick: () => {
            const project = this.store.createProject(PROJECT_TYPES.VIDEO);
            navigate({ name: "editor", projectId: project.id });
          }
        })
      ]),
      this.renderProjectCollection("�ŋ߂̃v���W�F�N�g", recentProjects),
      this.renderProjectCollection("���C�ɓ���", favoriteProjects),
      element("section", { className: "panel settings-list" }, [
        element("h2", { className: "panel-title", text: "�X�}�z�ł̎g����" }),
        element("div", { className: "muted", text: "�ݒ��ʂŋ��L�p URL �� QR �R�[�h��\���ł��܂��BiPhone �� Safari �̋��L���j���[����z�[����ʂɒǉ��ł��܂��B" }),
        element("div", { className: "button-row" }, [
          element("button", {
            className: "button",
            text: "QR���L��J��",
            onClick: () => navigate({ name: "settings" })
          })
        ])
      ])
    ]);
  }

  renderProjectCollection(title, projects) {
    const panel = element("section", { className: "panel" }, [element("h2", { className: "panel-title", text: title })]);
    if (!projects.length) {
      panel.append(element("div", { className: "empty-state", text: "�܂��\���ł���v���W�F�N�g������܂���B" }));
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
        element("h1", { className: "page-title", text: "�v���W�F�N�g�ꗗ" }),
        element("p", { className: "page-note", text: "�^�C�g���ƃ^�O�Ō������Ȃ���A�����⏑���o���O�̐������ł��܂��B" })
      ])
    ]));

    const filterPanel = element("section", { className: "panel filters" });
    filterPanel.append(textField({
      label: "����",
      value: this.store.listState.searchText,
      placeholder: "�^�C�g���܂��̓^�O�Ō���",
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
      label: "���я�",
      value: this.store.listState.sort,
      options: Object.entries(SORT_OPTION_LABELS).map(([value, label]) => ({ value, label })),
      onChange: (event) => this.store.setListState({ sort: event.currentTarget.value })
    }));
    page.append(filterPanel);

    if (!visibleProjects.length) {
      page.append(element("div", { className: "empty-state", text: "��v����v���W�F�N�g������܂���B�������t�B���^�[�𒲐����Ă��������B" }));
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
          project.favorite ? element("span", { className: "badge badge--accent", text: "���C�ɓ���" }) : null
        ])
      ]),
      element("div", { className: "toolbar-inline" }, [
        element("button", { className: "button", text: "�J��", onClick: () => navigate({ name: "editor", projectId: project.id }) }),
        element("button", { className: "button", text: project.favorite ? "��" : "��", onClick: () => this.store.toggleFavorite(project.id) })
      ])
    ]));

    if (project.summary.trim()) card.append(element("div", { className: "muted", text: project.summary }));
    if (project.tags.length) {
      card.append(element("div", { className: "tags" }, project.tags.map((tag) => element("span", { className: "tag", text: `#${tag}` }))));
    }

    card.append(element("div", { className: "project-card__actions" }, [
      element("span", { className: "faint", text: `�X�V: ${formatDateTime(project.updatedAt)}` }),
      element("button", {
        className: "button button--ghost",
        text: "����",
        onClick: () => {
          const duplicated = this.store.duplicateProject(project.id);
          if (duplicated) this.showToast("�v���W�F�N�g�𕡐����܂���");
        }
      }),
      element("button", {
        className: "button button--danger",
        text: "�폜",
        onClick: () => {
          if (window.confirm("���̃v���W�F�N�g��폜���܂����H")) this.store.deleteProject(project.id);
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
        element("p", { className: "page-note", text: project.projectType === PROJECT_TYPES.IMAGE ? "�\�}�⎿����ςݏグ�Ȃ���A�摜���������� Markdown �𐮂��܂��B" : "�V�[���P�ʂŎ��ԂƓ�e��g�ݗ��ĂāA���搶���p�̉������𐮂��܂��B" })
      ]),
      element("div", { className: "button-row" }, [
        element("button", { className: "button", text: "�ꗗ��", onClick: () => navigate({ name: "projects" }) }),
        element("button", { className: "button button--primary", text: "Markdown �v���r���[", onClick: () => this.openPreview(project.id) })
      ])
    ]));

    const grid = element("div", { className: "editor-grid" });
    const formColumn = element("div", { className: "form-grid" });
    const toolbarColumn = element("div", { className: "toolbar" }, [
      element("div", { className: "toolbar__inner" }, [
        element("div", { className: "save-indicator", attrs: { "data-save-indicator": "true" }, text: formatSaveStatus(this.store.saveStatus) }),
        element("button", {
          className: "button button--primary button--block",
          text: "Markdown ������o��",
          onClick: () => {
            exportMarkdown(this.store.getExportableProject(project.id));
            this.showToast("Markdown ������o���܂���");
          }
        }),
        element("button", {
          className: "button button--block",
          text: "JSON ������o��",
          onClick: () => {
            exportJson(this.store.getExportableProject(project.id));
            this.showToast("JSON ������o���܂���");
          }
        }),
        element("button", {
          className: "button button--block",
          text: project.favorite ? "���C�ɓ�����" : "���C�ɓ���ɒǉ�",
          onClick: () => this.store.toggleFavorite(project.id)
        }),
        element("button", {
          className: "button button--danger button--block",
          text: "�폜",
          onClick: () => {
            if (window.confirm("���̃v���W�F�N�g��폜���܂����H")) {
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
      element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: "��{���" })])
    ]);
    const fieldGrid = element("div", { className: "field-grid" });

    fieldGrid.append(textField({
      label: "�^�C�g��",
      value: project.title,
      placeholder: "�^�C�g���͋�ł���v�ł�",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.title = event.currentTarget.value;
        });
        titleNode.textContent = event.currentTarget.value.trim() || getDisplayTitle(project);
      }
    }));

    fieldGrid.append(textAreaField({
      label: "�T�v",
      value: project.summary,
      placeholder: "�p�r��_����Z���܂Ƃ߂܂�",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.summary = event.currentTarget.value;
        });
      }
    }));

    fieldGrid.append(textField({
      label: "�^�O�i�J���}��؂�j",
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
        label: "����",
        value: project.language,
        options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.language = event.currentTarget.value;
          });
        }
      }),
      selectField({
        label: "�o�͌`��",
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
        label: "���C�ɓ���",
        checked: project.favorite,
        onChange: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.favorite = event.currentTarget.checked;
          }, { render: true });
        }
      }),
      toggleField({
        label: "�A�[�J�C�u",
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
      element("div", { className: "editor-section__header" }, [element("h2", { className: "panel-title", text: "�摜�v�����v�g" })])
    ]);
    const fields = [
      ["subject", "��ʑ�", "�N��A���𒆐S�ɕ`����"],
      ["composition", "�\�}", "��p��z�u�̈Ӑ}"],
      ["style", "�X�^�C��", "�앗�⎿��"],
      ["lighting", "���C�e�B���O", "���̕�������"],
      ["camera", "�J����", "�����Y�A��p�A��ʊE�[�x�Ȃ�"],
      ["colorTone", "�F��", "�S�̂̐F�̕�����"],
      ["mood", "���[�h", "����╵�͋C"],
      ["environment", "��", "�ꏊ��w�i���"]
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
        label: "�l�K�e�B�u�v�����v�g",
        value: detail.negativePrompt,
        placeholder: "��������v�f��j�]�|�C���g��܂Ƃ߂܂�",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.imageDetail.negativePrompt = event.currentTarget.value;
          });
        }
      }),
      textAreaField({
        label: "����",
        value: detail.notes,
        placeholder: "�Q�ƃC���[�W�␧�상���Ȃǂ���R�ɏ����܂�",
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
      element("h2", { className: "panel-title", text: "����v�����v�g" }),
      element("span", { className: "badge badge--accent", text: `���v ${getTotalDuration(project)}�b` })
    ]));

    const topFields = element("div", { className: "field-grid" });
    [
      ["overallConcept", "�S�̃R���Z�v�g", "����S�̂̑_��"],
      ["visualStyle", "�r�W���A���X�^�C��", "�f���̎����������"],
      ["pacing", "�e���|", "�������A�ɋ}����A�Ȃ�"],
      ["aspectRatio", "�A�X�y�N�g��", "9:16 / 16:9 �Ȃ�"]
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
        label: "�l�K�e�B�u�v�����v�g",
        value: detail.negativePrompt,
        placeholder: "�������j�]�Ȃǔ���������Ƃ�܂Ƃ߂܂�",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.negativePrompt = event.currentTarget.value;
          });
        }
      }),
      textAreaField({
        label: "�v���W�F�N�g����",
        value: detail.notes,
        placeholder: "���o���j�␧�상����c���܂�",
        onInput: (event) => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.notes = event.currentTarget.value;
          });
        }
      })
    );
    section.append(topFields);

    section.append(element("div", { className: "editor-section__header" }, [
      element("h3", { className: "panel-title", text: "�V�[��" }),
      element("button", {
        className: "button",
        text: "�V�[����ǉ�",
        onClick: () => {
          this.store.updateProject(project.id, (draft) => {
            draft.videoDetail.scenes.push(createVideoScene(draft.videoDetail.scenes.length));
          }, { render: true });
        }
      })
    ]));

    if (!detail.scenes.length) {
      section.append(element("div", { className: "empty-state", text: "�܂��V�[��������܂���B�܂���1�ǉ����ė������܂��傤�B" }));
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
          element("h4", { className: "scene-card__title", text: scene.title.trim() || `�V�[�� ${index + 1}` }),
          element("div", { className: "muted", text: formatDurationSeconds(scene.durationSeconds) })
        ]),
        element("div", { className: "scene-card__actions" }, [
          element("button", {
            className: "button button--ghost",
            text: "���",
            onClick: (event) => {
              event.preventDefault();
              if (index > 0) this.moveScene(project.id, index, index - 1);
            }
          }),
          element("button", {
            className: "button button--ghost",
            text: "����",
            onClick: (event) => {
              event.preventDefault();
              if (index < project.videoDetail.scenes.length - 1) this.moveScene(project.id, index, index + 1);
            }
          }),
          element("button", {
            className: "button button--ghost",
            text: "����",
            onClick: (event) => {
              event.preventDefault();
              this.store.updateProject(project.id, (draft) => {
                const copy = {
                  ...structuredClone(scene),
                  id: crypto.randomUUID(),
                  title: scene.title.trim() ? `${scene.title.trim()} �̃R�s�[` : "�V�[���̃R�s�["
                };
                draft.videoDetail.scenes.splice(index + 1, 0, copy);
              }, { render: true });
            }
          }),
          element("button", {
            className: "button button--danger",
            text: "�폜",
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
      label: "�V�[���^�C�g��",
      value: scene.title,
      placeholder: "�V�[����",
      onInput: (event) => {
        this.store.updateProject(project.id, (draft) => {
          draft.videoDetail.scenes[index].title = event.currentTarget.value;
        });
        summary.querySelector(".scene-card__title").textContent = event.currentTarget.value.trim() || `�V�[�� ${index + 1}`;
      }
    }));

    const durationField = textField({
      label: "�����i�b�j",
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
      ["content", "��e", "���̃V�[���ŋN���邱��"],
      ["cameraWork", "�J�������[�N", "�p���A�h���[�A�Œ�Ȃ�"],
      ["subjectMotion", "��ʑ̂̓���", "�l���╨�̓���"],
      ["background", "�w�i", "�����Ԃ̏��"],
      ["mood", "���[�h", "����╵�͋C"],
      ["soundNote", "���̃���", "BGM��SE�̃���"],
      ["transitionNote", "�g�����W�V����", "���V�[���Ƃ̂Ȃ���"],
      ["notes", "�⑫����", "���상���⒍�ӓ_"]
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
          element("h1", { className: "page-title", text: "�ݒ�" }),
          element("p", { className: "page-note", text: "����l�A���L URL�A�X�}�z�ւ̓�����܂Ƃ߂Ċm�F�ł��܂��B" })
        ])
      ]),
      element("section", { className: "panel settings-list" }, [
        selectField({
          label: "����̌���",
          value: this.store.settings.defaultLanguage,
          options: Object.entries(LANGUAGE_LABELS).map(([value, label]) => ({ value, label })),
          onChange: (event) => {
            this.store.updateSettings((settings) => {
              settings.defaultLanguage = event.currentTarget.value;
            });
          }
        }),
        toggleField({
          label: "Windows �A�g�����̏����o����O��ɂ���",
          checked: this.store.settings.reflectionExportEnabled,
          onChange: (event) => {
            this.store.updateSettings((settings) => {
              settings.reflectionExportEnabled = event.currentTarget.checked;
            });
          }
        }),
        element("div", { className: "muted", text: "���� Web �łł͎��������͂܂�����܂���B�K�v�ȂƂ��� Markdown / JSON ������o���āAiCloud Drive �� OneDrive �ɒu���^�p���ł��܂��B" }),
        element("div", { className: "muted", text: "iPhone �� Safari �̋��L���j���[����z�[����ʂɒǉ��AWindows �� Edge / Chrome �ŃC���X�g�[������ƃA�v���̂悤�Ɏg���܂��B" })
      ]),
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
      element("div", {}, [
        element("h2", { className: "panel-title", text: "QR���L" }),
        element("p", { className: "page-note", text: "���J URL �⓯�� Wi-Fi ��� URL �� QR �R�[�h�����āA�X�}�z����J���₷�����܂��B" })
      ]),
      textField({
        label: "���L�pURL",
        value: this.store.settings.shareUrl,
        placeholder: "https://example.com/promptweaver/",
        onInput: (event) => {
          this.store.updateSettings((settings) => {
            settings.shareUrl = event.currentTarget.value;
          });
        }
      }),
      element("div", { className: "button-row" }, [
        element("button", {
          className: "button",
          text: "���݂�URL��g��",
          onClick: () => {
            this.store.updateSettings((settings) => {
              settings.shareUrl = window.location.href.split("#")[0];
            });
            this.showToast("���݂�URL����L�p�ɃZ�b�g���܂���");
          }
        }),
        element("button", {
          className: "button",
          text: "URL��R�s�[",
          onClick: async () => {
            if (!isValidUrl) {
              this.showToast("��ɋ��L�ł���URL����͂��Ă�������");
              return;
            }
            await copyText(shareUrl);
            this.showToast("���L�pURL��R�s�[���܂���");
          }
        }),
        element("button", {
          className: "button button--primary",
          text: "URL����L",
          onClick: async () => {
            if (!isValidUrl) {
              this.showToast("http �܂��� https ��URL����͂��Ă�������");
              return;
            }
            const shared = await shareAppUrl(shareUrl, "PromptWeaver ��J��").catch(() => false);
            if (shared) this.showToast("���L�V�[�g��J���܂���");
            else {
              await copyText(shareUrl);
              this.showToast("���L�ɖ��Ή��̂���URL��R�s�[���܂���");
            }
          }
        })
      ]),
      element("div", { className: "qr-share__url", text: shareUrl || "���L�pURL����͂���Ƃ����ɕ\������܂�" }),
      isValidUrl
        ? element("div", { className: "qr-share" }, [
            element("div", { className: "qr-share__image-wrap" }, [
              element("img", {
                className: "qr-share__image",
                attrs: {
                  src: qrImageUrl,
                  alt: "���L�pURL��QR�R�[�h",
                  loading: "lazy",
                  referrerpolicy: "no-referrer"
                }
              })
            ]),
            element("div", { className: "muted", text: "���� QR �R�[�h��X�}�z�œǂݎ��ƁAPromptWeaver Web ������J���܂��B" }),
            usesLocalhost
              ? element("div", { className: "muted", text: "localhost �� 127.0.0.1 �͕ʒ[������J���܂���BPC �� LAN IP �� HTTPS ���J URL ��g���Ă��������B" })
              : null,
            !usesLocalhost && !prefersHttps
              ? element("div", { className: "muted", text: "HTTP �ł�J���܂����A�z�[����ʒǉ���I�t���C�����p����肳����Ȃ� HTTPS ���������߂ł��B" })
              : null,
            element("div", { className: "muted", text: "QR�摜�̕\���ɂ͊O���� QR �����T�[�r�X�𗘗p���Ă��܂��B�����̓A�v��������֍����ւ��ł��܂��B" })
          ])
        : element("div", { className: "empty-state", text: "http �܂��� https ����n�܂鋤�L�pURL����͂���ƁA������ QR �R�[�h��\�����܂��B" })
    ]);
  }

  renderBottomNav(route) {
    const items = [
      { name: "home", label: "�z�[��", icon: "?" },
      { name: "projects", label: "�ꗗ", icon: "?" },
      { name: "settings", label: "�ݒ�", icon: "?" }
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
          element("div", { className: "muted", text: "�󗓂͏Ȃ��� Markdown ��g�ݗ��ĂĂ��܂��B" })
        ]),
        element("button", { className: "button", text: "����", onClick: () => this.closePreview() })
      ]),
      element("div", { className: "preview-modal__actions" }, [
        element("div", { className: "button-row" }, [
          element("button", {
            className: "button",
            text: "�R�s�[",
            onClick: async () => {
              await copyText(markdown);
              this.showToast("Markdown ��R�s�[���܂���");
            }
          }),
          element("button", {
            className: "button",
            text: "���L",
            onClick: async () => {
              const shared = await shareMarkdown(project).catch(() => false);
              if (shared) this.showToast("���L�V�[�g��J���܂���");
              else {
                await copyText(markdown);
                this.showToast("���L�ɖ��Ή��̂��߃R�s�[���܂���");
              }
            }
          }),
          element("button", {
            className: "button button--primary",
            text: "Markdown ������o��",
            onClick: () => {
              exportMarkdown(project);
              this.showToast("Markdown ������o���܂���");
            }
          }),
          element("button", {
            className: "button",
            text: "JSON ������o��",
            onClick: () => {
              exportJson(project);
              this.showToast("JSON ������o���܂���");
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



