import { useRef } from "react";


export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    ctxRef.current = ctx;
  };

  const reset = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
  };

  return { canvasRef, ctxRef, initCanvas, reset };
};
