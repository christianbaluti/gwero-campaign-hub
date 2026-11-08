export function centeredPdfPlacement({
  pageWidth,
  pageHeight,
  imageWidth,
  imageHeight,
  xRatio,
  yRatio,
  rotation,
}: {
  pageWidth: number;
  pageHeight: number;
  imageWidth: number;
  imageHeight: number;
  xRatio: number;
  yRatio: number;
  rotation: number;
}) {
  const centerX = pageWidth * xRatio;
  const centerY = pageHeight * (1 - yRatio);
  const radians = (rotation * Math.PI) / 180;
  return {
    x: centerX - (imageWidth / 2) * Math.cos(radians) + (imageHeight / 2) * Math.sin(radians),
    y: centerY - (imageWidth / 2) * Math.sin(radians) - (imageHeight / 2) * Math.cos(radians),
  };
}
