export type PixelBounds = { left: number; top: number; right: number; bottom: number };

export function signatureInkBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
): PixelBounds | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const red = pixels[offset] || 0;
      const green = pixels[offset + 1] || 0;
      const blue = pixels[offset + 2] || 0;
      const alpha = pixels[offset + 3] || 0;
      const darkest = Math.min(red, green, blue);
      const colourRange = Math.max(red, green, blue) - darkest;
      if (alpha < 16 || (darkest > 238 && colourRange < 12)) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return right < left || bottom < top ? null : { left, top, right, bottom };
}

export async function cleanSignatureImage(url: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const source = document.createElement("canvas");
  source.width = width;
  source.height = height;
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return url;
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height);
  const bounds = signatureInkBounds(pixels.data, width, height);
  if (!bounds) return url;
  const inkWidth = bounds.right - bounds.left + 1;
  const inkHeight = bounds.bottom - bounds.top + 1;
  const padding = Math.max(4, Math.round(Math.max(inkWidth, inkHeight) * 0.04));
  const left = Math.max(0, bounds.left - padding);
  const top = Math.max(0, bounds.top - padding);
  const right = Math.min(width - 1, bounds.right + padding);
  const bottom = Math.min(height - 1, bounds.bottom + padding);
  const cropped = context.getImageData(left, top, right - left + 1, bottom - top + 1);
  for (let offset = 0; offset < cropped.data.length; offset += 4) {
    const red = cropped.data[offset] || 0;
    const green = cropped.data[offset + 1] || 0;
    const blue = cropped.data[offset + 2] || 0;
    const darkest = Math.min(red, green, blue);
    if (darkest > 242 && Math.max(red, green, blue) - darkest < 12) cropped.data[offset + 3] = 0;
  }
  const output = document.createElement("canvas");
  output.width = cropped.width;
  output.height = cropped.height;
  output.getContext("2d")?.putImageData(cropped, 0, 0);
  return output.toDataURL("image/png");
}

export function signaturePngBlob(dataUrl: string) {
  const encoded = dataUrl.match(/^data:image\/png;base64,(.+)$/)?.[1];
  if (!encoded) throw new Error("The cleaned signature image is invalid.");
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: "image/png" });
}
