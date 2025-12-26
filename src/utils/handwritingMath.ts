// utils/handwritingMath.ts

import type { Stroke } from "../types/handwriting";

export const getBoundingBox = (strokes: Stroke[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  strokes.forEach((stroke) => {
    stroke.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
  });

  return { minX, minY, maxX, maxY };
};

export const normalizeStrokes = (
  strokes: Stroke[],
  targetHeight = 100
): Stroke[] => {
  const box = getBoundingBox(strokes);
  const scale = targetHeight / (box.maxY - box.minY);

  return strokes.map((stroke) =>
    stroke.map((p) => ({
      x: (p.x - box.minX) * scale,
      y: (p.y - box.minY) * scale,
    }))
  );
};
