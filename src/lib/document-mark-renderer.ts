import type { StampDesign } from "./document-marks.types";

function dateLabel(value: string) {
  if (!value) return "";
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.valueOf())
    ? value
    : parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function seeded(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 16_807) % 2_147_483_647;
    return (value - 1) / 2_147_483_646;
  };
}

export function renderStampDataUrl(design: StampDesign, appliedDate: string, scale = 1) {
  const width = Math.round(760 * scale);
  const height = Math.round((design.shape === "circle" ? 600 : 360) * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare a stamp preview.");
  context.scale(scale, scale);
  const w = width / scale;
  const h = height / scale;
  const inset = 25;
  context.translate(w / 2, h / 2);
  context.rotate((design.rotation * Math.PI) / 180);
  context.translate(-w / 2, -h / 2);
  context.strokeStyle = design.color;
  context.fillStyle = design.color;
  context.globalAlpha = 0.88;
  context.lineCap = "round";
  context.lineJoin = "round";

  const outline = (offset: number, lineWidth: number) => {
    context.lineWidth = lineWidth;
    context.beginPath();
    if (design.shape === "rectangle") {
      context.roundRect(
        inset + offset,
        inset + offset,
        w - (inset + offset) * 2,
        h - (inset + offset) * 2,
        18,
      );
    } else {
      context.ellipse(
        w / 2,
        h / 2,
        w / 2 - inset - offset,
        h / 2 - inset - offset,
        0,
        0,
        Math.PI * 2,
      );
    }
    context.stroke();
  };
  outline(0, 11);
  outline(18, 4);

  context.textAlign = "center";
  context.textBaseline = "middle";
  const mainSize = design.shape === "circle" ? 72 : 78;
  context.font = `900 ${mainSize}px Arial, sans-serif`;
  context.fillText(
    design.primaryText.toUpperCase(),
    w / 2,
    h * (design.shape === "circle" ? 0.38 : 0.35),
    w - 120,
  );
  if (design.secondaryText) {
    context.font = "700 34px Arial, sans-serif";
    context.fillText(design.secondaryText.toUpperCase(), w / 2, h * 0.55, w - 150);
  }
  if (design.includeDate && appliedDate) {
    context.font = "700 31px 'Courier New', monospace";
    const value = `${design.datePrefix ? `${design.datePrefix}: ` : ""}${dateLabel(appliedDate)}`;
    context.fillText(
      value.toUpperCase(),
      w / 2,
      h * (design.shape === "circle" ? 0.7 : 0.72),
      w - 160,
    );
  }

  const distress = Math.max(0, Math.min(100, design.distressed));
  if (distress) {
    const random = seeded(
      Array.from(`${design.primaryText}${appliedDate}`).reduce(
        (total, character) => total + character.charCodeAt(0),
        0,
      ),
    );
    context.globalCompositeOperation = "destination-out";
    context.globalAlpha = 0.25 + distress / 180;
    const marks = Math.round(80 + distress * 5);
    for (let index = 0; index < marks; index++) {
      const x = inset + random() * (w - inset * 2);
      const y = inset + random() * (h - inset * 2);
      const radiusX = 1 + random() * (2 + distress / 13);
      const radiusY = 0.5 + random() * (1.5 + distress / 25);
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }
  }
  return canvas.toDataURL("image/png");
}
