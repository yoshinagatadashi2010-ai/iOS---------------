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
  [PROJECT_TYPES.STORYBOARD]: "ストーリーボード",
  [PROJECT_TYPES.MULTIMODAL]: "マルチモーダル"
});

export const FALLBACK_TITLES = Object.freeze({
  [PROJECT_TYPES.IMAGE]: "無題の画像プロンプト",
  [PROJECT_TYPES.VIDEO]: "無題の動画プロンプト",
  [PROJECT_TYPES.AUDIO]: "無題の音声プロンプト",
  [PROJECT_TYPES.STORYBOARD]: "無題のストーリーボード",
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
  [SORT_OPTIONS.UPDATED_DESCENDING]: "更新日順",
  [SORT_OPTIONS.TITLE_ASCENDING]: "タイトル順",
  [SORT_OPTIONS.FAVORITE_FIRST]: "お気に入り優先"
});

export const DEFAULT_SETTINGS = Object.freeze({
  defaultLanguage: LANGUAGES.JAPANESE,
  reflectionExportEnabled: false,
  shareUrl: ""
});

function nowIsoString() {
  return new Date().toISOString();
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
  }

  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function normalizeReferenceImage(referenceImage) {
  const dataUrl = `${referenceImage?.dataUrl ?? ""}`.trim();
  if (!dataUrl.startsWith("data:image/")) {
    return null;
  }

  return {
    name: `${referenceImage?.name ?? ""}`.trim(),
    dataUrl,
    mimeType: `${referenceImage?.mimeType ?? ""}`.trim() || "image/jpeg",
    byteSize: Math.max(0, Number(referenceImage?.byteSize) || 0),
    width: Math.max(1, Number(referenceImage?.width) || 1),
    height: Math.max(1, Number(referenceImage?.height) || 1)
  };
}

function normalizeReferenceImages(referenceImages) {
  const source = Array.isArray(referenceImages)
    ? referenceImages
    : referenceImages
      ? [referenceImages]
      : [];

  return source
    .map(normalizeReferenceImage)
    .filter(Boolean);
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
    notes: "",
    referenceImages: []
  };
}

function createEmptyVideoScene(orderIndex) {
  return {
    id: createId(),
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
    referenceImages: [],
    scenes: []
  };
}

export function createEmptyProject(projectType, language = DEFAULT_SETTINGS.defaultLanguage) {
  const timestamp = nowIsoString();

  return {
    id: createId(),
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
    imageDetail: projectType === PROJECT_TYPES.IMAGE ? createEmptyImageDetail() : null,
    videoDetail: projectType === PROJECT_TYPES.VIDEO ? createEmptyVideoDetail() : null
  };
}

export function cloneProject(project) {
  return cloneValue(project);
}

export function normalizeTags(value) {
  const source = Array.isArray(value) ? value.join(",") : `${value ?? ""}`;
  const parts = source
    .split(/[、,\n]/)
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
  const title = `${project?.title ?? ""}`.trim();
  return title || FALLBACK_TITLES[project?.projectType] || "無題のプロジェクト";
}

export function getFilenameBase(project) {
  return `${slugify(getDisplayTitle(project))}-${project.id}`;
}

export function normalizeVideoScene(scene, orderIndex) {
  return {
    ...createEmptyVideoScene(orderIndex),
    ...scene,
    id: scene?.id || createId(),
    orderIndex,
    durationSeconds: Math.max(1, Number(scene?.durationSeconds) || 1),
    title: `${scene?.title ?? ""}`,
    content: `${scene?.content ?? ""}`,
    cameraWork: `${scene?.cameraWork ?? ""}`,
    subjectMotion: `${scene?.subjectMotion ?? ""}`,
    background: `${scene?.background ?? ""}`,
    mood: `${scene?.mood ?? ""}`,
    soundNote: `${scene?.soundNote ?? ""}`,
    transitionNote: `${scene?.transitionNote ?? ""}`,
    notes: `${scene?.notes ?? ""}`
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
  normalized.language = normalized.language in LANGUAGE_LABELS
    ? normalized.language
    : DEFAULT_SETTINGS.defaultLanguage;
  normalized.outputFormat = normalized.outputFormat in OUTPUT_FORMAT_LABELS
    ? normalized.outputFormat
    : OUTPUT_FORMATS.MARKDOWN;

  if (normalized.projectType === PROJECT_TYPES.IMAGE) {
    const imageDetail = normalized.imageDetail ?? {};
    normalized.imageDetail = {
      ...createEmptyImageDetail(),
      ...imageDetail,
      referenceImages: normalizeReferenceImages(
        imageDetail.referenceImages ?? imageDetail.referenceImage
      )
    };
    delete normalized.imageDetail.referenceImage;
    normalized.videoDetail = null;
    return normalized;
  }

  if (normalized.projectType === PROJECT_TYPES.VIDEO) {
    const videoDetail = normalized.videoDetail ?? {};
    const scenes = [...(normalized.videoDetail?.scenes ?? [])]
      .sort((left, right) => left.orderIndex - right.orderIndex)
      .map((scene, index) => normalizeVideoScene(scene, index));

    normalized.videoDetail = {
      ...createEmptyVideoDetail(),
      ...videoDetail,
      referenceImages: normalizeReferenceImages(
        videoDetail.referenceImages ?? videoDetail.referenceImage
      ),
      scenes,
      overallConcept: `${videoDetail.overallConcept ?? ""}`,
      visualStyle: `${videoDetail.visualStyle ?? ""}`,
      pacing: `${videoDetail.pacing ?? ""}`,
      aspectRatio: `${videoDetail.aspectRatio ?? ""}`,
      negativePrompt: `${videoDetail.negativePrompt ?? ""}`,
      notes: `${videoDetail.notes ?? ""}`
    };
    delete normalized.videoDetail.referenceImage;
    normalized.imageDetail = null;
    return normalized;
  }

  normalized.imageDetail = null;
  normalized.videoDetail = null;
  return normalized;
}

export function duplicateProject(sourceProject) {
  const duplicated = normalizeProject(sourceProject);
  const timestamp = nowIsoString();

  duplicated.id = createId();
  duplicated.createdAt = timestamp;
  duplicated.updatedAt = timestamp;
  duplicated.favorite = false;
  duplicated.title = `${getDisplayTitle(sourceProject)} のコピー`;

  if (duplicated.videoDetail?.scenes?.length) {
    duplicated.videoDetail.scenes = duplicated.videoDetail.scenes.map((scene, index) =>
      normalizeVideoScene(
        {
          ...scene,
          id: createId()
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

    if (sortOption === SORT_OPTIONS.FAVORITE_FIRST && left.favorite !== right.favorite) {
      return left.favorite ? -1 : 1;
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

  if (saveStatus.kind === "failed") {
    return "保存に失敗しました";
  }

  return "保存状態を確認できません";
}

export function createSampleProjects() {
  const imageProject = createEmptyProject(PROJECT_TYPES.IMAGE);
  imageProject.title = "夕景ポートレート";
  imageProject.summary = "駅前の夕景で自然光と街灯を混ぜた、シネマティックな人物ポートレート用の下書きです。";
  imageProject.tags = ["portrait", "sunset", "cinematic"];
  imageProject.favorite = true;
  imageProject.imageDetail = {
    subject: "夕景の街に立つ人物ポートレート",
    composition: "バストアップ、ややローアングル",
    style: "シネマティックで自然な質感",
    lighting: "夕暮れの残光と街灯のミックス光",
    camera: "85mm lens, shallow depth of field",
    colorTone: "オレンジとティール",
    mood: "静かで印象的",
    environment: "駅前の歩道と遠景のネオン",
    negativePrompt: "過度なノイズ、崩れた手、極端な歪み",
    notes: "表情は落ち着いて、視線は少し外す"
  };

  const videoProject = createEmptyProject(PROJECT_TYPES.VIDEO);
  videoProject.title = "未来都市の朝";
  videoProject.summary = "縦型の短尺動画で、静かな街が少しずつ目覚めていく流れを描きます。";
  videoProject.tags = ["future", "city", "shortfilm"];
  videoProject.videoDetail = {
    overallConcept: "未来都市の朝を3シーンで描く",
    visualStyle: "クリーンなSF、柔らかい光",
    pacing: "ゆっくり始まり後半で少しテンポアップ",
    aspectRatio: "9:16",
    negativePrompt: "ちらつき、不自然なモーションブラー、崩れた建物",
    notes: "SNS向けの縦動画を想定",
    scenes: [
      normalizeVideoScene(
        {
          ...createEmptyVideoScene(0),
          title: "未明の街",
          durationSeconds: 4,
          content: "青みの残る街並みを広く見せる",
          cameraWork: "ゆっくり前進するドローンショット",
          subjectMotion: "看板の光が穏やかに点滅する",
          background: "高層ビルと薄い霧",
          mood: "静寂",
          soundNote: "遠くの環境音のみ",
          transitionNote: "フェードで次へ",
          notes: "最初は暗めに"
        },
        0
      ),
      normalizeVideoScene(
        {
          ...createEmptyVideoScene(1),
          title: "駅前が動き出す",
          durationSeconds: 5,
          content: "人の流れと車両の光が少しずつ増える",
          cameraWork: "横移動",
          subjectMotion: "通行人が自然に行き交う",
          background: "駅前ロータリーと朝の広告",
          mood: "始動",
          soundNote: "小さな街のざわめき",
          transitionNote: "カット",
          notes: "中盤で色温度を少し上げる"
        },
        1
      )
    ]
  };

  return [videoProject, imageProject].map(normalizeProject);
}

export function createVideoScene(orderIndex) {
  return normalizeVideoScene(createEmptyVideoScene(orderIndex), orderIndex);
}
