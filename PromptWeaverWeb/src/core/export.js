import { qrcode } from "../vendor/qrcode-generator.mjs";
import {
  getDisplayTitle,
  getFilenameBase,
  normalizeProject
} from "./models.js";
import { generateMarkdown } from "./markdown.js";

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function normalizeShareUrl(value) {
  return `${value ?? ""}`.trim();
}

export function isShareableHttpUrl(value) {
  const normalized = normalizeShareUrl(value);
  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function buildQrCodeImageUrl(value) {
  const normalized = normalizeShareUrl(value);
  if (!isShareableHttpUrl(normalized)) {
    return "";
  }

  const code = qrcode(0, "M");
  code.addData(normalized);
  code.make();

  const svg = code.createSvgTag({
    cellSize: 8,
    margin: 16,
    scalable: true
  });

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function exportMarkdown(project) {
  const filename = `${getFilenameBase(project)}.md`;
  const markdown = generateMarkdown(project);
  downloadBlob(filename, new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
}

export function exportJson(project) {
  const normalized = normalizeProject(project);
  const filename = `${getFilenameBase(normalized)}.json`;
  const payload = JSON.stringify(normalized, null, 2);
  downloadBlob(filename, new Blob([payload], { type: "application/json;charset=utf-8" }));
}

export async function shareAppUrl(url, title = "PromptWeaver") {
  if (!navigator.share || !isShareableHttpUrl(url)) {
    return false;
  }

  await navigator.share({
    title,
    url: normalizeShareUrl(url)
  });
  return true;
}

export async function shareMarkdown(project) {
  const normalized = normalizeProject(project);
  const markdown = generateMarkdown(normalized);
  const filename = `${getFilenameBase(normalized)}.md`;

  if (!navigator.share) {
    return false;
  }

  const file = new File([markdown], filename, { type: "text/markdown" });
  const shareData = {
    title: getDisplayTitle(normalized),
    text: markdown
  };

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      ...shareData,
      files: [file]
    });
    return true;
  }

  await navigator.share(shareData);
  return true;
}
