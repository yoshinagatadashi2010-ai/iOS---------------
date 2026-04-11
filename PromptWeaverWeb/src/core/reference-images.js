const MAX_REFERENCE_IMAGE_EDGE = 1600;
const MAX_REFERENCE_IMAGE_DATA_URL_LENGTH = 1_600_000;
const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66];
const SCALE_STEPS = [1, 0.85, 0.72, 0.6];

function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("画像を読み込めませんでした。"));
    image.src = url;
  });
}

function renderImageToJpegDataUrl(image, width, height, quality) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("ブラウザで画像変換を利用できませんでした。");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

function estimateDataUrlBytes(dataUrl) {
  const base64 = `${dataUrl}`.split(",")[1] ?? "";
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export async function prepareReferenceImage(file) {
  if (!(file instanceof File)) {
    throw new Error("参照画像ファイルを取得できませんでした。");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("画像ファイルを選択してください。");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(objectUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;

    if (!naturalWidth || !naturalHeight) {
      throw new Error("画像サイズを取得できませんでした。");
    }

    const baseScale = Math.min(
      1,
      MAX_REFERENCE_IMAGE_EDGE / Math.max(naturalWidth, naturalHeight)
    );

    for (const scaleStep of SCALE_STEPS) {
      const width = Math.max(1, Math.round(naturalWidth * baseScale * scaleStep));
      const height = Math.max(1, Math.round(naturalHeight * baseScale * scaleStep));

      for (const quality of QUALITY_STEPS) {
        const dataUrl = renderImageToJpegDataUrl(image, width, height, quality);
        if (dataUrl.length <= MAX_REFERENCE_IMAGE_DATA_URL_LENGTH) {
          return {
            name: file.name,
            dataUrl,
            mimeType: "image/jpeg",
            byteSize: estimateDataUrlBytes(dataUrl),
            width,
            height
          };
        }
      }
    }

    throw new Error("参照画像が大きすぎるため保存できませんでした。別の画像をお試しください。");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
