import test from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_TITLES,
  LANGUAGES,
  PROJECT_TYPES,
  createEmptyProject,
  normalizeProject
} from "../src/core/models.js";
import { buildImageMarkdown, buildVideoMarkdown } from "../src/core/markdown.js";

test("image markdown renders structured sections", () => {
  const project = createEmptyProject(PROJECT_TYPES.IMAGE, LANGUAGES.JAPANESE);
  project.title = "商品イメージ";
  project.summary = "新作コスメのキービジュアル";
  project.imageDetail.subject = "ガラス台の上の香水ボトル";
  project.imageDetail.composition = "中央配置のクローズアップ";
  project.imageDetail.negativePrompt = "ノイズ、歪み、余計な小物";

  const markdown = buildImageMarkdown(project);

  assert.match(markdown, /# Image Prompt/);
  assert.match(markdown, /## Subject\nガラス台の上の香水ボトル/);
  assert.match(markdown, /## Negative Prompt\nノイズ、歪み、余計な小物/);
});

test("video markdown omits empty fields", () => {
  const project = createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE);
  project.videoDetail.scenes.push({
    id: "scene-1",
    orderIndex: 0,
    title: "",
    durationSeconds: 5,
    content: "最初のシーン",
    cameraWork: "",
    subjectMotion: "",
    background: "",
    mood: "",
    soundNote: "",
    transitionNote: "",
    notes: ""
  });

  const markdown = buildVideoMarkdown(project);

  assert.equal(markdown.includes("## Overall Concept"), false);
  assert.equal(markdown.includes("- Camera Work:"), false);
  assert.match(markdown, /- Duration: 5s/);
});

test("video markdown includes reference image when attached", () => {
  const project = createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE);
  project.videoDetail.referenceImages = [
    {
      name: "storyboard.jpg",
      dataUrl: "data:image/jpeg;base64,ZmFrZQ==",
      mimeType: "image/jpeg",
      byteSize: 4321,
      width: 1024,
      height: 576
    },
    {
      name: "camera-plan.jpg",
      dataUrl: "data:image/jpeg;base64,ZmFrZTI=",
      mimeType: "image/jpeg",
      byteSize: 3321,
      width: 900,
      height: 900
    }
  ];

  const markdown = buildVideoMarkdown(project);

  assert.match(markdown, /## Reference Images\n- Attached to project: storyboard\.jpg\n- Attached to project: camera-plan\.jpg/);
});

test("video scenes render in orderIndex order", () => {
  const project = createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE);
  project.videoDetail.scenes = [
    { id: "scene-c", orderIndex: 2, title: "C", durationSeconds: 3, content: "3番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: "" },
    { id: "scene-a", orderIndex: 0, title: "A", durationSeconds: 1, content: "1番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: "" },
    { id: "scene-b", orderIndex: 1, title: "B", durationSeconds: 2, content: "2番目", cameraWork: "", subjectMotion: "", background: "", mood: "", soundNote: "", transitionNote: "", notes: "" }
  ];

  const markdown = buildVideoMarkdown(project);
  const indexA = markdown.indexOf("### Scene 1: A");
  const indexB = markdown.indexOf("### Scene 2: B");
  const indexC = markdown.indexOf("### Scene 3: C");

  assert.ok(indexA >= 0);
  assert.ok(indexB > indexA);
  assert.ok(indexC > indexB);
});

test("duration formatting uses seconds suffix", () => {
  const project = createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE);
  project.videoDetail.scenes.push({
    id: "scene-1",
    orderIndex: 0,
    title: "Shot",
    durationSeconds: 9,
    content: "内容",
    cameraWork: "",
    subjectMotion: "",
    background: "",
    mood: "",
    soundNote: "",
    transitionNote: "",
    notes: ""
  });

  const markdown = buildVideoMarkdown(project);
  assert.match(markdown, /- Duration: 9s/);
});

test("empty image title falls back to default title", () => {
  const project = createEmptyProject(PROJECT_TYPES.IMAGE, LANGUAGES.JAPANESE);
  const markdown = buildImageMarkdown(project);
  const expected = `## Title\n${FALLBACK_TITLES[PROJECT_TYPES.IMAGE]}`;

  assert.equal(markdown.includes(expected), true);
});

test("image markdown includes reference image when attached", () => {
  const project = createEmptyProject(PROJECT_TYPES.IMAGE, LANGUAGES.JAPANESE);
  project.imageDetail.referenceImages = [
    {
      name: "mood-board.jpg",
      dataUrl: "data:image/jpeg;base64,ZmFrZQ==",
      mimeType: "image/jpeg",
      byteSize: 1234,
      width: 1280,
      height: 720
    },
    {
      name: "detail-shot.jpg",
      dataUrl: "data:image/jpeg;base64,ZmFrZTM=",
      mimeType: "image/jpeg",
      byteSize: 2234,
      width: 1024,
      height: 768
    }
  ];

  const markdown = buildImageMarkdown(project);

  assert.match(markdown, /## Reference Images\n- Attached to project: mood-board\.jpg\n- Attached to project: detail-shot\.jpg/);
});

test("normalizeProject preserves valid reference image and drops invalid data", () => {
  const project = createEmptyProject(PROJECT_TYPES.IMAGE, LANGUAGES.JAPANESE);
  project.imageDetail.referenceImages = [
    {
      name: "reference.png",
      dataUrl: "data:image/png;base64,ZmFrZQ==",
      mimeType: "image/png",
      byteSize: 2345,
      width: 800,
      height: 600
    }
  ];

  const normalized = normalizeProject(project);
  assert.equal(normalized.imageDetail.referenceImages[0].name, "reference.png");
  assert.equal(normalized.imageDetail.referenceImages[0].width, 800);

  const broken = normalizeProject({
    ...project,
    imageDetail: {
      ...project.imageDetail,
      referenceImages: [{ name: "broken", dataUrl: "not-a-data-url" }]
    }
  });

  assert.deepEqual(broken.imageDetail.referenceImages, []);

  const videoProject = createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE);
  videoProject.videoDetail.referenceImages = [
    {
      name: "video-reference.png",
      dataUrl: "data:image/png;base64,ZmFrZQ==",
      mimeType: "image/png",
      byteSize: 1111,
      width: 640,
      height: 360
    }
  ];

  const normalizedVideo = normalizeProject(videoProject);
  assert.equal(normalizedVideo.videoDetail.referenceImages[0].name, "video-reference.png");
});

test("normalizeProject migrates legacy single reference image fields", () => {
  const migratedImageProject = normalizeProject({
    ...createEmptyProject(PROJECT_TYPES.IMAGE, LANGUAGES.JAPANESE),
    imageDetail: {
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
      referenceImage: {
        name: "legacy-image.png",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        mimeType: "image/png",
        byteSize: 1000,
        width: 400,
        height: 400
      }
    }
  });

  assert.equal(migratedImageProject.imageDetail.referenceImages[0].name, "legacy-image.png");

  const migratedVideoProject = normalizeProject({
    ...createEmptyProject(PROJECT_TYPES.VIDEO, LANGUAGES.JAPANESE),
    videoDetail: {
      overallConcept: "",
      visualStyle: "",
      pacing: "",
      aspectRatio: "",
      negativePrompt: "",
      notes: "",
      scenes: [],
      referenceImage: {
        name: "legacy-video.png",
        dataUrl: "data:image/png;base64,ZmFrZQ==",
        mimeType: "image/png",
        byteSize: 1200,
        width: 500,
        height: 500
      }
    }
  });

  assert.equal(migratedVideoProject.videoDetail.referenceImages[0].name, "legacy-video.png");
});
