import type { RefObject } from "react";
import jsPDF from "jspdf";

type Props = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
};

export const ExportControls = ({ canvasRef }: Props) => (
  <div className="flex gap-4">
    <button
      onClick={() => {
        if (!canvasRef.current) return;
        const pdf = new jsPDF();
        pdf.addImage(
          canvasRef.current.toDataURL("image/png"),
          "PNG",
          10,
          10,
          210,
          297
        );
        pdf.save("handwriting.pdf");
      }}
      className="px-4 py-2 bg-rose-200 text-rose-800 font-semibold rounded"
    >
      Download PDF
    </button>
  </div>
);
