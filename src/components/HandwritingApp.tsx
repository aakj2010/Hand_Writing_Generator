"use client";
import { useEffect, useState } from "react";
import { useCanvas } from "../hooks/useCanvas";
import { useHandwriting } from "../hooks/useHandwriting";
import { normalizeStrokes } from "../utils/handwritingMath";
import { HandwritingPad } from "./HandwritingPad";
import { HandwritingTrainer } from "./HandwritingTrainer";
import { HandwritingRenderer } from "./HandwritingRenderer";
import { ExportControls } from "./ExportControls";

export default function HandwritingApp() {
  const { canvasRef, ctxRef, initCanvas } = useCanvas();
  const { strokesRef, datasetRef, save } = useHandwriting();

  const [currentChar, setCurrentChar] = useState("a");
  const [text, setText] = useState("");

  useEffect(initCanvas, []);

  // SAVE CHARACTER HANDWRITING
  const saveCharacter = () => {
    if (strokesRef.current.length === 0) return;

    const normalized = normalizeStrokes(strokesRef.current);

    datasetRef.current[currentChar] ??= [];
    datasetRef.current[currentChar].push(normalized);

    strokesRef.current = [];
    save();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/plain") {
      alert("Please upload a .txt file");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const content = reader.result as string;
      setText(content);
    };

    reader.readAsText(file);
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokesRef.current = [];
  };

  return (
    <div className="max-w-[800px] mx-auto mt-8 space-y-6">
      {/* CANVAS */}
      <HandwritingPad
        canvasRef={canvasRef}
        ctxRef={ctxRef}
        strokesRef={strokesRef}
      />

      {/* TRAINING CONTROLS */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="train-char" className="font-semibold">
            Train:
          </label>
          <input
            id="train-char"
            value={currentChar}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length > 0) {
                setCurrentChar(val.slice(-1));
              }
            }}
            className="border rounded w-10 h-10 text-center text-lg font-bold"
          />
        </div>

        {/* <button
          onClick={saveCharacter}
          className="px-4 py-2 bg-green-200 text-green-800 font-semibold rounded"
        >
          Save
        </button> */}

        <button
          onClick={() =>
            setCurrentChar((c) => String.fromCharCode(c.charCodeAt(0) + 1))
          }
          className="px-4 py-2 bg-blue-200 text-blue-800 font-semibold rounded"
        >
          Next
        </button>
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded"
        >
          Clear
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <label htmlFor="file-upload">Upload Text File</label>
        <input
          type="file"
          accept=".txt"
          className="border p-2 rounded"
          onChange={(e) => handleFileUpload(e)}
        />
      </div>

      {/* TEXT INPUT */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or upload text to render in handwriting"
        className="w-full border px-3 py-2 rounded"
      />

      <div className="flex gap-2">
        <HandwritingTrainer onSave={saveCharacter} currentChar={currentChar} />

        {/* RENDER */}
        <HandwritingRenderer
          text={text}
          canvasRef={canvasRef}
          ctxRef={ctxRef}
          datasetRef={datasetRef}
        />
      </div>

      {/* EXPORT */}
      <ExportControls canvasRef={canvasRef} />
    </div>
  );
}
