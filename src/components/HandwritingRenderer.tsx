import type { RefObject } from "react";
import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import type { HandwritingDataset, Stroke } from "../types/handwriting";
import { jitter } from "../utils/handwritingHumanize";

type Props = {
  text: string;
  datasetRef: React.MutableRefObject<HandwritingDataset>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ctxRef: RefObject<CanvasRenderingContext2D | null>;
};

const A4_WIDTH = 794; // approx A4 width at 96 DPI
const A4_HEIGHT = 1123; // approx A4 height at 96 DPI
// const SCALE = 0.35; // REMOVED CONSTANT

const MARGIN = {
  top: 60,
  left: 50,
  right: 50,
  bottom: 60,
};

// Original line height for the raw strokes
const RAW_LINE_HEIGHT = 160;

export const HandwritingRenderer = ({
  text,
  datasetRef,
  canvasRef,
  ctxRef,
}: Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pages, setPages] = useState<string[][]>([]);

  // Font Size State (Scale factor)
  const [scale, setScale] = useState(0.45);

  // Letter Spacing State
  const [letterSpacing, setLetterSpacing] = useState(2);

  const validateCharacters = (): boolean => {
    const missing = new Set<string>();

    for (const char of text.toLowerCase()) {
      if (char === " " || char === "\n") continue;
      if (!datasetRef.current[char]) {
        missing.add(char);
      }
    }

    if (missing.size > 0) {
      alert(`Please train these characters first:\n${[...missing].join(", ")}`);
      return false;
    }

    return true;
  };

  /**
   * Helper to estimate width using sample[0]
   */
  /**
   * Helper to estimate width using sample[0]
   */
  const getWordWidth = (
    word: string,
    currentScale: number,
    currentSpacing: number
  ): number => {
    let width = 0;
    for (const char of word) {
      if (char === " ") {
        width += 30 * currentScale;
        continue;
      }
      const samples = datasetRef.current[char];
      if (!samples || samples.length === 0) continue;

      // Use first sample as reference for layout
      const sample = samples[0];

      let maxX = 0;
      sample.forEach((stroke) => {
        stroke.forEach((p) => {
          maxX = Math.max(maxX, p.x);
        });
      });

      width += maxX * currentScale + currentSpacing * currentScale;
    }
    return width;
  };

  /**
   * Helper for rendering Width (Unscaled coordinate system)
   */
  const getCharacterWidthRaw = (sample: Stroke[]): number => {
    let maxX = 0;
    sample.forEach((s) => s.forEach((p) => (maxX = Math.max(maxX, p.x))));
    return maxX;
  };

  const getWordWidthRender = (word: string): number => {
    let w = 0;
    for (const char of word) {
      if (char === " ") {
        w += 30;
        continue;
      }
      const s = datasetRef.current[char];
      if (!s) continue;

      w += getCharacterWidthRaw(s[0]) + letterSpacing;
    }
    return w;
  };

  // Calculate pages whenever text OR scale changes
  useEffect(() => {
    if (!text || !datasetRef.current) return;

    // Warn about missing characters (once per text change ideally, but this works)
    validateCharacters();

    const scaledLineHeight = RAW_LINE_HEIGHT * scale;

    // --- LAYOUT PASS ---
    const words = text.toLowerCase().split(/(\s+)/);
    const newPages: string[][] = [];
    let currentWords: string[] = [];

    // Track cursor in "logical A4 pixels"
    let cursorX = MARGIN.left;
    let cursorY = MARGIN.top;

    const maxWidth = A4_WIDTH - MARGIN.right;
    const maxHeight = A4_HEIGHT - MARGIN.bottom;

    for (const word of words) {
      // Handle explicit newlines
      if (word.includes("\n")) {
        currentWords.push(word);
        cursorX = MARGIN.left;
        cursorY += scaledLineHeight;

        // Check if newline pushed us over
        if (cursorY + scaledLineHeight > maxHeight) {
          newPages.push(currentWords);
          currentWords = [];
          cursorX = MARGIN.left;
          cursorY = MARGIN.top;
        }
        continue;
      }

      // Handle space
      const trimmed = word.trim();
      if (trimmed === "") {
        if (cursorX > MARGIN.left) {
          cursorX += 30 * scale;
        }
        currentWords.push(word);
        continue;
      }

      const wWidth = getWordWidth(word, scale, letterSpacing);

      // Wrap?
      if (cursorX + wWidth > maxWidth) {
        cursorX = MARGIN.left;
        cursorY += scaledLineHeight;

        // New Page?
        if (cursorY + scaledLineHeight > maxHeight) {
          newPages.push(currentWords);
          currentWords = [];
          cursorX = MARGIN.left;
          cursorY = MARGIN.top;
        }
      }

      currentWords.push(word);

      // Advance cursor
      cursorX += wWidth;
    }

    if (currentWords.length > 0) {
      newPages.push(currentWords);
    }

    // Safety check
    if (newPages.length === 0) newPages.push([]);

    setPages(newPages);
    setTotalPages(newPages.length);
    // Reset to page 1 if pages change, unless we are just resizing and it fits?
    // Let's safe reset to 1 to avoid being on page 5 of 3.
    setCurrentPage(1);
  }, [text, datasetRef, scale, letterSpacing]);

  // Shared Drawing Logic
  const drawPageOnCanvas = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    wordsToRender: string[],
    ratio: number = 1
  ) => {
    // SET PHYSICAL DIMENSIONS
    canvas.width = A4_WIDTH * ratio;
    canvas.height = A4_HEIGHT * ratio;

    // RESET & CLEAR
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BACKGROUND
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // SETUP BRUSH
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;

    // TRANSFORM
    // Scale by DPR then by SCALE
    const effectiveScale = ratio * scale;
    ctx.setTransform(effectiveScale, 0, 0, effectiveScale, 0, 0);

    // DRAW LOOP
    let cursorX = MARGIN.left / scale;
    let cursorY = MARGIN.top / scale;

    const maxWidthScaled = (A4_WIDTH - MARGIN.right) / scale;

    for (const word of wordsToRender) {
      if (word.includes("\n")) {
        cursorX = MARGIN.left / scale;
        cursorY += RAW_LINE_HEIGHT;
        continue;
      }
      const trimmed = word.trim();
      if (trimmed === "") {
        if (cursorX > MARGIN.left / scale) cursorX += 30;
        continue;
      }
      const wWidth = getWordWidthRender(word);
      if (cursorX + wWidth > maxWidthScaled) {
        cursorX = MARGIN.left / scale;
        cursorY += RAW_LINE_HEIGHT;
      }
      for (const char of word) {
        const samples = datasetRef.current[char];
        if (!samples || samples.length === 0) continue;
        const sample = samples[Math.floor(Math.random() * samples.length)];
        sample.forEach((stroke) => {
          ctx.beginPath();
          stroke.forEach((p, index) => {
            const x = jitter(p.x + cursorX);
            const y = jitter(p.y + cursorY);
            index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          });
          ctx.stroke();
        });
        cursorX += getCharacterWidthRaw(sample) + letterSpacing;
      }
    }
  };

  // Render Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Render Page
    const pageIndex = currentPage - 1;
    const wordsToRender = pages[pageIndex] || [];
    const ratio = window.devicePixelRatio || 1;

    drawPageOnCanvas(canvas, ctx, wordsToRender, ratio);

    // Style override to limit view size
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.maxWidth = `${A4_WIDTH}px`;
  }, [currentPage, pages, datasetRef, scale, letterSpacing]);

  const downloadPDF = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [A4_WIDTH, A4_HEIGHT],
    });

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    pages.forEach((pageWords, index) => {
      if (index > 0) pdf.addPage();

      // Draw page to canvas at 1.0 ratio (1px = 1 unit)
      drawPageOnCanvas(tempCanvas, tempCtx, pageWords, 1);

      const imgData = tempCanvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, A4_WIDTH, A4_HEIGHT);
    });

    pdf.save("handwriting.pdf");
  };

  return (
    <div className="flex flex-col gap-4 items-start w-full">
      {/* CONTROLS BAR */}
      <div className="flex flex-wrap items-center gap-6 p-3 bg-gray-50 rounded-lg w-full border border-gray-200">
        {/* FONT SIZE SLIDER */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="font-size"
            className="text-sm font-semibold text-gray-700 whitespace-nowrap"
          >
            Font Size:
          </label>
          <input
            id="font-size"
            type="range"
            min="0.2"
            max="0.8"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-32 cursor-pointer"
          />
          <span className="text-xs text-gray-500 w-8">
            {(scale * 100).toFixed(0)}%
          </span>
        </div>

        {/* LETTER SPACING SLIDER */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="letter-spacing"
            className="text-sm font-semibold text-gray-700 whitespace-nowrap"
          >
            Spacing:
          </label>
          <input
            id="letter-spacing"
            type="range"
            min="-15"
            max="20"
            step="1"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(parseFloat(e.target.value))}
            className="w-24 cursor-pointer"
          />
        </div>

        {/* PAGINATION */}
        <div className="flex items-center gap-2 border-l pl-6 border-gray-300">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Prev
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[80px] text-center">
            {currentPage} / {Math.max(1, totalPages)}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        {/* PDF EXPORT */}
        <div className="ml-auto">
          <button
            onClick={downloadPDF}
            className="px-4 py-1.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-sm text-sm"
          >
            Download PDF ({totalPages} pages)
          </button>
        </div>
      </div>
    </div>
  );
};
