/**
 * Compress an image File to a JPEG dataURL.
 * Long edge ≤ maxEdge px, quality 0.85 by default.
 */
export async function compressImageToDataUrl(
  file: File,
  maxEdge = 1920,
  quality = 0.85,
): Promise<string> {
  const bitmap = await loadBitmap(file);
  const { width: w0, height: h0 } = bitmap;
  const ratio = Math.min(1, maxEdge / Math.max(w0, h0));
  const w = Math.round(w0 * ratio);
  const h = Math.round(h0 * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  // White background fills PNG transparency when re-encoded as JPEG
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ('close' in bitmap && typeof bitmap.close === 'function') {
    (bitmap as ImageBitmap).close();
  }
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Generate a thumbnail dataURL suitable for storing in LocalStorage.
 * Long edge ≤ 400 px, JPEG q 0.7 — typically 30-60 KB.
 */
export async function compressThumbnail(file: File): Promise<string> {
  return compressImageToDataUrl(file, 400, 0.7);
}

/**
 * Re-encode an existing data URL to a smaller JPEG data URL so it fits in
 * LocalStorage. Used for AI-generated images (often large PNGs) before storing.
 */
export async function compressDataUrl(
  dataUrl: string,
  maxEdge = 720,
  quality = 0.8,
): Promise<string> {
  const img = new Image();
  img.decoding = 'async';
  img.src = dataUrl;
  await img.decode();

  const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      // fallthrough
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // url is revoked when image is no longer referenced; revoking immediately is fine
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

export const ACCEPTED_MIME = ['image/jpeg', 'image/png'];

export function isAcceptedFormat(file: File): boolean {
  return ACCEPTED_MIME.includes(file.type);
}
