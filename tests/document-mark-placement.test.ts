import assert from "node:assert/strict";
import test from "node:test";
import { centeredPdfPlacement } from "../src/lib/document-mark-placement.ts";

test("document marks keep the same centre with no rotation", () => {
  assert.deepEqual(
    centeredPdfPlacement({
      pageWidth: 600,
      pageHeight: 800,
      imageWidth: 120,
      imageHeight: 40,
      xRatio: 0.5,
      yRatio: 0.5,
      rotation: 0,
    }),
    { x: 240, y: 380 },
  );
});

test("document marks compensate for pdf-lib rotating around the lower-left corner", () => {
  const placement = centeredPdfPlacement({
    pageWidth: 600,
    pageHeight: 800,
    imageWidth: 120,
    imageHeight: 40,
    xRatio: 0.5,
    yRatio: 0.5,
    rotation: 90,
  });
  assert.ok(Math.abs(placement.x - 320) < 0.000001);
  assert.ok(Math.abs(placement.y - 340) < 0.000001);
});
