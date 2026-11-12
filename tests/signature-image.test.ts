import test from "node:test";
import assert from "node:assert/strict";
import { signatureInkBounds } from "../src/lib/signature-image.ts";

test("signature bounds remove transparent and white margins", () => {
  const pixels = new Uint8ClampedArray(6 * 5 * 4);
  for (let offset = 0; offset < pixels.length; offset += 4) {
    pixels[offset] = 255;
    pixels[offset + 1] = 255;
    pixels[offset + 2] = 255;
    pixels[offset + 3] = 255;
  }
  for (const [x, y] of [
    [2, 1],
    [3, 2],
    [4, 3],
  ]) {
    const offset = (y * 6 + x) * 4;
    pixels[offset] = 12;
    pixels[offset + 1] = 20;
    pixels[offset + 2] = 35;
  }
  assert.deepEqual(signatureInkBounds(pixels, 6, 5), { left: 2, top: 1, right: 4, bottom: 3 });
});

test("signature bounds retain coloured ink on a white background", () => {
  const pixels = new Uint8ClampedArray([245, 245, 245, 255, 25, 95, 180, 255]);
  assert.deepEqual(signatureInkBounds(pixels, 2, 1), { left: 1, top: 0, right: 1, bottom: 0 });
});
