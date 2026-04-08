import test from "node:test";
import assert from "node:assert/strict";

import {
  FALLBACK_TITLES,
  LANGUAGES,
  PROJECT_TYPES,
  createEmptyProject
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