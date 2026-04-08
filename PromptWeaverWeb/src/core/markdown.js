import {
  FALLBACK_TITLES,
  PROJECT_TYPES,
  getDisplayTitle,
  normalizeProject
} from "./models.js";

function trimOrEmpty(value) {
  return `${value ?? ""}`.trim();
}

function appendSection(lines, title, content) {
  const text = trimOrEmpty(content);
  if (!text) {
    return;
  }

  lines.push(`## ${title}`, text, "");
}

function appendBullet(lines, label, content) {
  const text = trimOrEmpty(content);
  if (!text) {
    return;
  }

  lines.push(`- ${label}: ${text}`);
}

function finalize(lines) {
  const copied = [...lines];
  while (copied[copied.length - 1] === "") {
    copied.pop();
  }
  return copied.join("\n");
}

export function buildImageMarkdown(project) {
  const normalized = normalizeProject(project);
  const detail = normalized.imageDetail ?? {};
  const lines = [
    "# Image Prompt",
    "",
    "## Title",
    getDisplayTitle(normalized) || FALLBACK_TITLES[PROJECT_TYPES.IMAGE],
    ""
  ];

  appendSection(lines, "Summary", normalized.summary);
  appendSection(lines, "Subject", detail.subject);
  appendSection(lines, "Composition", detail.composition);
  appendSection(lines, "Style", detail.style);
  appendSection(lines, "Lighting", detail.lighting);
  appendSection(lines, "Camera", detail.camera);
  appendSection(lines, "Color Tone", detail.colorTone);
  appendSection(lines, "Mood", detail.mood);
  appendSection(lines, "Environment", detail.environment);
  appendSection(lines, "Negative Prompt", detail.negativePrompt);
  appendSection(lines, "Notes", detail.notes);

  return finalize(lines);
}

export function buildVideoMarkdown(project) {
  const normalized = normalizeProject(project);
  const detail = normalized.videoDetail ?? {};
  const scenes = [...(detail.scenes ?? [])].sort(
    (left, right) => left.orderIndex - right.orderIndex
  );
  const lines = [
    "# Video Prompt",
    "",
    "## Title",
    getDisplayTitle(normalized) || FALLBACK_TITLES[PROJECT_TYPES.VIDEO],
    ""
  ];

  appendSection(lines, "Summary", normalized.summary);
  appendSection(lines, "Overall Concept", detail.overallConcept);
  appendSection(lines, "Visual Style", detail.visualStyle);
  appendSection(lines, "Pacing", detail.pacing);
  appendSection(lines, "Aspect Ratio", detail.aspectRatio);

  if (scenes.length) {
    lines.push("## Scenes", "");
    scenes.forEach((scene, index) => {
      const sceneTitle = trimOrEmpty(scene.title) || `Scene ${index + 1}`;
      lines.push(`### Scene ${index + 1}: ${sceneTitle}`);
      lines.push(`- Duration: ${Math.max(1, Number(scene.durationSeconds) || 1)}s`);
      appendBullet(lines, "Content", scene.content);
      appendBullet(lines, "Camera Work", scene.cameraWork);
      appendBullet(lines, "Subject Motion", scene.subjectMotion);
      appendBullet(lines, "Background", scene.background);
      appendBullet(lines, "Mood", scene.mood);
      appendBullet(lines, "Sound Note", scene.soundNote);
      appendBullet(lines, "Transition", scene.transitionNote);
      appendBullet(lines, "Notes", scene.notes);
      lines.push("");
    });
  }

  appendSection(lines, "Negative Prompt", detail.negativePrompt);
  appendSection(lines, "Notes", detail.notes);

  return finalize(lines);
}

export function generateMarkdown(project) {
  if (project.projectType === PROJECT_TYPES.VIDEO) {
    return buildVideoMarkdown(project);
  }

  return buildImageMarkdown(project);
}
