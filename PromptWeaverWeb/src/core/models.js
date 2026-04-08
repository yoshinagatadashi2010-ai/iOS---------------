export const PROJECT_TYPES = Object.freeze({
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  STORYBOARD: "storyboard",
  MULTIMODAL: "multimodal"
});

export const PROJECT_TYPE_LABELS = Object.freeze({
  [PROJECT_TYPES.IMAGE]: "画像",
  [PROJECT_TYPES.VIDEO]: "動画",
  [PROJECT_TYPES.AUDIO]: "音声",
  [PROJECT_TYPES.STORYBOARD]: "絵コンテ",
  [PROJECT_TYPES.MULTIMODAL]: "マルチモーダル"
});

export const FALLBACK_TITLES = Object.freeze({
  [PROJECT_TYPES.IMAGE]: "無題の画像プロンプト",
  [PROJECT_TYPES.VIDEO]: "無題の動画プロンプト",
  [PROJECT_TYPES.AUDIO]: "無題の音声プロンプト",
  [PROJECT_TYPES.STORYBOARD]: "無題の絵コンテ",
  [PROJECT_TYPES.MULTIMODAL]: "無題のマルチモーダルプロンプト"
});

export const LANGUAGES = Object.freeze({
  JAPANESE: "japanese",
  ENGLISH: "english"
});

export const LANGUAGE_LABELS = Object.freeze({
  [LANGUAGES.JAPANESE]: "日本語",
  [LANGUAGES.ENGLISH]: "英語"
});

export const OUTPUT_FORMATS = Object.freeze({
  MARKDOWN: "markdown",
  PLAIN_TEXT: "plainText",
  STRUCTURED_BLOCKS: "structuredBlocks"
});

export const OUTPUT_FORMAT_LABELS = Object.freeze({
  [OUTPUT_FORMATS.MARKDOWN]: "Markdown",
  [OUTPUT_FORMATS.PLAIN_TEXT]: "プレーンテキスト",
  [OUTPUT_FORMATS.STRUCTURED_BLOCKS]: "構造化ブロック"
});

export const LIST_FILTERS = Object.freeze({
  ALL: "all",
  IMAGE: "image",
  VIDEO: "video"
});

export const LIST_FILTER_LABELS = Object.freeze({
  [LIST_FILTERS.ALL]: "すべて",
  [LIST_FILTERS.IMAGE]: "画像",
  [LIST_FILTERS.VIDEO]: "動画"
});

export const SORT_OPTIONS = Object.freeze({
  UPDATED_DESCENDING: "updatedDescending",
  TITLE_ASCENDING: "titleAscending",
  FAVORITE_FIRST: "favoriteFirst"
});

export const SORT_OPTION_LABELS = Object.freeze({
  [SORT_OPTIONS.UPDATED_DESCENDING]: "更新日時",
  [SORT_OPTIONS.TITLE_ASCENDING]: "タイトル",
  [SORT_OPTIONS.FAVORITE_FIRST]: "お気に入り優先"
});

export const DEFAULT_SETTINGS = Object.freeze({
  defaultLanguage: LANGUAGES.JAPANESE,
  reflectionExportEnabled: false
});

function nowIsoString() {
  return new Date().toISOString();
}

function createEmptyImageDetail() {
  return {
    subject: "",
    composition: "",
    style: "",
    lighting: "",
    camera: "",
    colorTone: "",
    mood: "",
    environment: "",
    negativePrompt: "",
    notes: ""
  };
}

function createEmptyVideoScene(orderIndex) {
  return {
    id: crypto.randomUUID(),
    orderIndex,
    title: "",
    durationSeconds: 5,
    content: "",
    cameraWork: "",
    subjectMotion: "",
    background: "",
    mood: "",
    soundNote: "",
    transitionNote: "",
    notes: ""
  };
}

function createEmptyVideoDetail() {
  return {
    overallConcept: "",
    visualStyle: "",
    pacing: "",
    aspectRatio: "",
    negativePrompt: "",
    notes: "",
    scenes: []
  };
}

export function createEmptyProject(
  projectType,
  language = DEFAULT_SETTINGS.defaultLanguage
) {
  const timestamp = nowIsoString();

  return {
    id: crypto.randomUUID(),
    projectType,
    title: "",
    summary: "",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    favorite: false,
    archived: false,
    language,
    outputFormat: OUTPUT_FORMATS.MARKDOWN,
    imageDetail:
      projectType === PROJECT_TYPES.IMAGE ? createEmptyImageDetail() : null,
    videoDetail:
      projectType === PROJECT_TYPES.VIDEO ? createEmptyVideoDetail() : null
  };
}

export function cloneProject(project) {
  return structuredClone(project);
}

export function normalizeTags(value) {
  const source = Array.isArray(value) ? value.join(",") : `${value ?? ""}`;
  const parts = source
    .split(/[,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return parts.filter(
    (tag, index) =>
      parts.findIndex(
        (candidate) => candidate.toLowerCase() === tag.toLowerCase()
      ) === index
  );
}

export function slugify(value, fallback = "project") {
  const normalized = `${value ?? ""}`
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

export function getDisplayTitle(project) {
  const title = project?.title?.trim();
  return title || FALLBACK_TITLES[project.projectType] || "無題のプロジェクト";
}

export function getFilenameBase(project) {
  return `${slugify(getDisplayTitle(project))}-${project.id}`;
}

export function normalizeVideoScene(scene, orderIndex) {
  return {
    ...scene,
    id: scene.id || crypto.randomUUID(),
    orderIndex,
    durationSeconds: Math.max(1, Number(scene.durationSeconds) || 1),
    title: `${scene.title ?? ""}`,
    content: `${scene.content ?? ""}`,
    cameraWork: `${scene.cameraWork ?? ""}`,
    subjectMotion: `${scene.subjectMotion ?? ""}`,
    background: `${scene.background ?? ""}`,
    mood: `${scene.mood ?? ""}`,
    soundNote: `${scene.soundNote ?? ""}`,
    transitionNote: `${scene.transitionNote ?? ""}`,
    notes: `${scene.notes ?? ""}`
  };
}

export function normalizeProject(project) {
  const normalized = cloneProject(project);
  const updatedAt = normalized.updatedAt || nowIsoString();

  normalized.title = `${normalized.title ?? ""}`;
  normalized.summary = `${normalized.summary ?? ""}`;
  normalized.tags = normalizeTags(normalized.tags);
  normalized.createdAt = normalized.createdAt || updatedAt;
  normalized.updatedAt = updatedAt;
  normalized.favorite = Boolean(normalized.favorite);
  normalized.archived = Boolean(normalized.archived);
  normalized.language =
    normalized.language in LANGUAGE_LABELS
      ? normalized.language
      : DEFAULT_SETTINGS.defaultLanguage;
  normalized.outputFormat =
    normalized.outputFormat in OUTPUT_FORMAT_LABELS
      ? normalized.outputFormat
      : OUTPUT_FORMATS.MARKDOWN;

  if (normalized.projectType === PROJECT_TYPES.IMAGE) {
    normalized.imageDetail = {
      ...createEmptyImageDetail(),
      ...(normalized.imageDetail ?? {})
    };
    normalized.videoDetail = null;
  }

  if (normalized.projectType === PROJECT_TYPES.VIDEO) {
    const scenes = [...(normalized.videoDetail?.scenes ?? [])]
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((scene, index) => normalizeVideoScene(scene, index));

    normalized.videoDetail = {
      ...createEmptyVideoDetail(),
      ...(normalized.videoDetail ?? {}),
      scenes
    };
    normalized.imageDetail = null;
  }

  return normalized;
}

export function duplicateProject(sourceProject) {
  const duplicated = normalizeProject(sourceProject);
  const timestamp = nowIsoString();

  duplicated.id = crypto.randomUUID();
  duplicated.createdAt = timestamp;
  duplicated.updatedAt = timestamp;
  duplicated.favorite = false;
  duplicated.title = getDisplayTitle(sourceProject).endsWith("のコピー")
    ? getDisplayTitle(sourceProject)
    : `${getDisplayTitle(sourceProject)} のコピー`;

  if (duplicated.videoDetail?.scenes?.length) {
    duplicated.videoDetail.scenes = duplicated.videoDetail.scenes.map(
      (scene, index) =>
        normalizeVideoScene(
          {
            ...scene,
            id: crypto.randomUUID()
          },
          index
        )
    );
  }

  return duplicated;
}

export function getTotalDuration(project) {
  if (!project?.videoDetail?.scenes?.length) {
    return 0;
  }

  return project.videoDetail.scenes.reduce(
    (total, scene) => total + Math.max(1, Number(scene.durationSeconds) || 1),
    0
  );
}

export function filterProjects(projects, { searchText, filter }) {
  const search = `${searchText ?? ""}`.trim().toLowerCase();

  return projects.filter((project) => {
    if (filter === LIST_FILTERS.IMAGE && project.projectType !== PROJECT_TYPES.IMAGE) {
      return false;
    }

    if (filter === LIST_FILTERS.VIDEO && project.projectType !== PROJECT_TYPES.VIDEO) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = `${project.title} ${project.tags.join(" ")}`.toLowerCase();
    return haystack.includes(search);
  });
}

export function sortProjects(projects, sortOption) {
  const copied = [...projects];

  copied.sort((left, right) => {
    if (sortOption === SORT_OPTIONS.TITLE_ASCENDING) {
      return getDisplayTitle(left).localeCompare(getDisplayTitle(right), "ja");
    }

    if (sortOption === SORT_OPTIONS.FAVORITE_FIRST) {
      if (left.favorite !== right.favorite) {
        return left.favorite ? -1 : 1;
      }
    }

    return new Date(right.updatedAt) - new Date(left.updatedAt);
  });

  return copied;
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatDurationSeconds(value) {
  return `${Math.max(1, Number(value) || 1)}秒`;
}

export function formatSaveStatus(saveStatus) {
  if (!saveStatus || saveStatus.kind === "idle") {
    return "ブラウザ内に保存されます";
  }

  if (saveStatus.kind === "saving") {
    return "保存中...";
  }

  if (saveStatus.kind === "saved") {
    return `保存済み ${formatDateTime(saveStatus.timestamp)}`;
  }

  return "保存状態を確認できません";
}

export function createSampleProjects() {
  const imageProject = createEmptyProject(PROJECT_TYPES.IMAGE);
  imageProject.title = "夕景ポートレート";
  imageProject.summary =
    "駅前の夕景で自然光と街灯を混ぜた、シネマティックな人物ポートレート用の下書きです。";
  imageProject.tags = ["portrait", "sunset", "cinematic"];
  imageProject.favorite = true;
  imageProject.imageDetail = {
    subject: "駅前に立つ女性モデル",
    composition: "バストアップ、ややローアングル",
    style: "シネマティックで繊細",
    lighting: "夕方の逆光と街灯の補助光",
    camera: "85mm lens, shallow depth of field",
    colorTone: "オレンジとティール",
    mood: "静かで感傷的",
    environment: "都市の夕景、濡れた歩道",
    negativePrompt: "低解像度、破綻した手、不自然な肌",
    notes: "広告ビジュアルにも使える上品さを保つ"
  };

  const videoProject = createEmptyProject(PROJECT_TYPES.VIDEO);
  videoProject.title = "未来都市の朝";
  videoProject.summary =
    "縦型の短尺動画で、静かな街が少しずつ目覚めていく流れを描きます。";
  videoProject.tags = ["future", "city", "shortfilm"];
  videoProject.videoDetail = {
    overallConcept: "近未来都市の朝を3シーンで描く",
    visualStyle: "クリーンなSF、フォトリアル",
    pacing: "ゆっくり始まり後半でややテンポアップ",
    aspectRatio: "9:16",
    negativePrompt: "ちらつき、過剰なモーションブラー、破綻した背景",
    notes: "SNS向けの世界観紹介動画を想定",
    scenes: [
      normalizeVideoScene(
        {
          ...createEmptyVideoScene(0),
          title: "夜明け前の街",
          durationSeconds: 4,
          content: "静かな高層ビル群を遠景で見せる",
          cameraWork: "ゆっくり前進するドローンショット",
          subjectMotion: "小型ビークルがわずかに横切る",
          background: "ガラス張りのビルと薄い霧",
          mood: "静謐",
          soundNote: "低い環境音のみ",
          transitionNote: "フェードで次へ",
          notes: "空のグラデーションを丁寧に"
        },
        0
      ),
      normalizeVideoScene(
        {
          ...createEmptyVideoScene(1),
          title: "通りに光が差す",
          durationSeconds: 5,
          content: "メインストリートに朝日が差し込む",
          cameraWork: "水平移動",
          subjectMotion: "通勤者の流れが増えていく",
          background: "ホログラム看板と反射する路面",
          mood: "希望",
          soundNote: "軽いシンセパッド",
          transitionNote: "光のフレアでつなぐ",
          notes: "人の密度は控えめ"
        },
        1
      )
    ]
  };

  return [normalizeProject(videoProject), normalizeProject(imageProject)];
}

export function createVideoScene(orderIndex) {
  return createEmptyVideoScene(orderIndex);
}
