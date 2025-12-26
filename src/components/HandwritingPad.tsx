import type { RefObject } from "react";
import { useRef } from "react";
import type { Point, Stroke } from "../types/handwriting";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ctxRef: RefObject<CanvasRenderingContext2D | null>;
  strokesRef: React.MutableRefObject<Stroke[]>;
};

export const HandwritingPad = ({ canvasRef, ctxRef, strokesRef }: Props) => {
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);
  const last = useRef<Point | null>(null);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[250px] border rounded"
      onPointerDown={(e) => {
        drawing.current = true;
        const p = getPoint(e);
        last.current = p;
        currentStroke.current = [p];
      }}
      onPointerMove={(e) => {
        if (!drawing.current || !last.current || !ctxRef.current) return;
        const p = getPoint(e);
        const ctx = ctxRef.current;

        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        last.current = p;
        currentStroke.current.push(p);
      }}
      onPointerUp={() => {
        drawing.current = false;
        strokesRef.current.push(currentStroke.current);
        currentStroke.current = [];
      }}
    />
  );
};
