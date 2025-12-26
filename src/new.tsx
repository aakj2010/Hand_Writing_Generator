// "use client";
// import { useEffect, useRef, useState } from "react";
// import jsPDF from "jspdf";

// /** ===== Types ===== */
// type Point = {
//   x: number;
//   y: number;
// };
// type Stroke = Point[];
// type BoundingBox = {
//   minX: number;
//   minY: number;
//   maxX: number;
//   maxY: number;
// };

// type Character = string;

// type HandwritingDataset = {
//   [char: Character]: Stroke[][];
// };

// const STORAGE_KEY = "handwriting-dataset-v1";

// const HandwritingPadNew = () => {
//   const [currentChar, setCurrentChar] = useState<string>("a");
//   const [text, setText] = useState<string>("hello");
//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
//   const strokesRef = useRef<Stroke[]>([]);
//   const currentStrokeRef = useRef<Stroke>([]);
//   const datasetRef = useRef<HandwritingDataset>({});

//   const isDrawing = useRef<boolean>(false);
//   const LINE_HEIGHT = 140;
//   const START_X = 20;
//   const START_Y = 100;
//   const MAX_WIDTH = 700; // adjust to canvas width

//   const lastPoint = useRef<Point | null>(null);

//   useEffect((): void => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     const ctx = canvas.getContext("2d");
//     if (!ctx) return;

//     ctxRef.current = ctx;

//     // Handle high DPI screens
//     const ratio = window.devicePixelRatio || 1;
//     const { width, height } = canvas.getBoundingClientRect();

//     canvas.width = width * ratio;
//     canvas.height = height * ratio;

//     ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

//     ctx.lineWidth = 2;
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "#000";
//   }, []);

//   const resetCanvasState = (): void => {
//     const ctx = ctxRef.current;
//     if (!ctx) return;

//     ctx.setTransform(1, 0, 0, 1, 0, 0);
//     ctx.lineWidth = 2;
//     ctx.lineCap = "round";
//     ctx.strokeStyle = "#000";
//   };

//   const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
//     const rect = canvasRef.current!.getBoundingClientRect();

//     return {
//       x: e.clientX - rect.left,
//       y: e.clientY - rect.top,
//     };
//   };

//   const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>): void => {
//     isDrawing.current = true;

//     const point = getPoint(e);
//     lastPoint.current = point;

//     currentStrokeRef.current = [point];
//   };

//   const draw = (e: React.PointerEvent<HTMLCanvasElement>): void => {
//     if (!isDrawing.current || !lastPoint.current || !ctxRef.current) return;

//     const point = getPoint(e);
//     const ctx = ctxRef.current;

//     // Smooth curve
//     const midX = (lastPoint.current.x + point.x) / 2;
//     const midY = (lastPoint.current.y + point.y) / 2;
//     ctx.lineWidth = getLineWidth();

//     ctx.beginPath();
//     ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
//     ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);
//     ctx.stroke();

//     lastPoint.current = point;
//     currentStrokeRef.current.push(point);
//   };

//   const stopDrawing = (): void => {
//     if (currentStrokeRef.current.length > 0) {
//       strokesRef.current.push(currentStrokeRef.current);
//     }

//     isDrawing.current = false;
//     lastPoint.current = null;
//     currentStrokeRef.current = [];
//   };
//   const redrawCanvas = (): void => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;

//     resetCanvasState(); // 🔥 ADD THIS

//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.beginPath();

//     strokesRef.current.forEach((stroke) => {
//       if (stroke.length < 2) return;

//       ctx.moveTo(stroke[0].x, stroke[0].y);

//       for (let i = 1; i < stroke.length; i++) {
//         const prev = stroke[i - 1];
//         const curr = stroke[i];

//         const midX = (prev.x + curr.x) / 2;
//         const midY = (prev.y + curr.y) / 2;

//         ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
//       }
//     });

//     ctx.stroke();
//   };

//   const clearCanvas = (): void => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     strokesRef.current = [];
//   };
//   const undoLastStroke = (): void => {
//     strokesRef.current.pop();
//     redrawCanvas();
//   };

//   const getBoundingBox = (strokes: Stroke[]): BoundingBox => {
//     let minX = Infinity;
//     let minY = Infinity;
//     let maxX = -Infinity;
//     let maxY = -Infinity;

//     strokes.forEach((stroke) => {
//       stroke.forEach((point) => {
//         minX = Math.min(minX, point.x);
//         minY = Math.min(minY, point.y);
//         maxX = Math.max(maxX, point.x);
//         maxY = Math.max(maxY, point.y);
//       });
//     });

//     return { minX, minY, maxX, maxY };
//   };

//   const normalizeStrokes = (
//     strokes: Stroke[],
//     targetHeight = 100
//   ): Stroke[] => {
//     const box = getBoundingBox(strokes);

//     const height = box.maxY - box.minY;
//     const scale = targetHeight / height;

//     return strokes.map((stroke) =>
//       stroke.map((point) => ({
//         x: (point.x - box.minX) * scale,
//         y: (point.y - box.minY) * scale,
//       }))
//     );
//   };
//   const saveCharacterSample = (): void => {
//     console.log("SAVE clicked");

//     console.log("Strokes before save:", strokesRef.current);

//     if (strokesRef.current.length === 0) {
//       console.warn("No strokes to save");
//       return;
//     }

//     const normalized = normalizeStrokes(strokesRef.current);

//     if (!datasetRef.current[currentChar]) {
//       datasetRef.current[currentChar] = [];
//     }

//     datasetRef.current[currentChar].push(normalized.flat());

//     console.log("Dataset before persist:", datasetRef.current);

//     saveDatasetToStorage();

//     strokesRef.current = [];
//     redrawCanvas();
//   };

//   const drawCharacter = (
//     stroke: Stroke,
//     offsetX: number,
//     offsetY: number
//   ): number => {
//     const ctx = ctxRef.current!;
//     let maxX = 0;

//     ctx.beginPath();

//     stroke.forEach((point, index) => {
//       const x = jitter(point.x + offsetX);
//       const y = jitter(point.y + offsetY);

//       if (index === 0) ctx.moveTo(x, y);
//       else ctx.lineTo(x, y);

//       maxX = Math.max(maxX, point.x);
//     });

//     ctx.stroke();
//     return maxX; // width of character
//   };

//   const renderText = (): void => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;

//     resetCanvasState();

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     ctx.fillStyle = "#ffffff";
//     ctx.fillRect(0, 0, canvas.width, canvas.height);

//     let cursorX = START_X;
//     let cursorY = START_Y + (Math.random() - 0.5) * 4;

//     for (const char of text) {
//       if (char === "\n") {
//         cursorX = START_X;
//         cursorY += LINE_HEIGHT + (Math.random() - 0.5) * 6;
//         continue;
//       }

//       if (char === " ") {
//         cursorX += 30;
//         continue;
//       }

//       const samples = datasetRef.current[char];
//       if (!samples || samples.length === 0) continue;

//       const sample = samples[Math.floor(Math.random() * samples.length)];

//       const width = drawCharacter(sample, cursorX, cursorY);

//       if (cursorX + width > MAX_WIDTH) {
//         cursorX = START_X;
//         cursorY += LINE_HEIGHT;
//       } else {
//         cursorX += width + 8 + Math.random() * 6;
//       }
//     }
//   };

//   const exportAsImage = (): void => {
//     const canvas = canvasRef.current;
//     const ctx = ctxRef.current;
//     if (!canvas || !ctx) return;

//     resetCanvasState();

//     const dataUrl = canvas.toDataURL("image/png");

//     const link = document.createElement("a");
//     link.href = dataUrl;
//     link.download = "handwritten-text.png";
//     link.click();
//   };

//   const saveDatasetToStorage = (): void => {
//     try {
//       const serialized = JSON.stringify(datasetRef.current);
//       console.log("Saving to localStorage:", serialized);
//       localStorage.setItem(STORAGE_KEY, serialized);
//       console.log("Saved successfully");
//     } catch (err) {
//       console.error("Failed to save handwriting dataset", err);
//     }
//   };

//   useEffect(() => {
//     try {
//       const stored = localStorage.getItem(STORAGE_KEY);
//       if (stored) {
//         datasetRef.current = JSON.parse(stored);
//         console.log("Dataset loaded:", datasetRef.current);
//       }
//     } catch (err) {
//       console.error("Failed to load handwriting dataset", err);
//     }
//   }, []);

//   const clearDataset = (): void => {
//     datasetRef.current = {};
//     localStorage.removeItem(STORAGE_KEY);
//     console.log("Handwriting dataset cleared");
//   };
//   console.log(localStorage.getItem("handwriting-dataset-v1"));
//   const jitter = (value: number, amount = 1.2): number => {
//     return value + (Math.random() - 0.5) * amount;
//   };
//   const getLineWidth = (): number => {
//     return 1.5 + Math.random() * 1.2; // 1.5px – 2.7px
//   };
//   const exportAsPDF = (): void => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;

//     // Ensure canvas is in correct state
//     resetCanvasState();

//     const imgData = canvas.toDataURL("image/png");

//     // A4 size in mm
//     const pdf = new jsPDF({
//       orientation: "portrait",
//       unit: "mm",
//       format: "a4",
//     });

//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     // Canvas size ratio
//     const imgWidth = pageWidth;
//     const imgHeight = (canvas.height * imgWidth) / canvas.width;

//     pdf.addImage(imgData, "PNG", 10, 10, imgWidth - 20, imgHeight);

//     pdf.save("handwritten-text.pdf");
//   };

//   return (
//     <div className="mt-8 max-w-[800px] mx-auto">
//       <canvas
//         ref={canvasRef}
//         className="w-full h-[250px] border border-gray-300 rounded"
//         style={{ touchAction: "none" }}
//         onPointerDown={startDrawing}
//         onPointerMove={draw}
//         onPointerUp={stopDrawing}
//         onPointerLeave={stopDrawing}
//       />
//       <textarea
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         className="mt-6 w-full border px-3 py-2 rounded"
//         placeholder="Type text to render in handwriting"
//       />
//       <div className="mt-3 flex gap-4">
//         <button
//           onClick={renderText}
//           className="px-4 py-2 bg-indigo-200 text-indigo-800 font-semibold rounded"
//         >
//           Render Handwriting
//         </button>
//         <button
//           onClick={exportAsImage}
//           className="px-4 py-2 bg-emerald-200 text-emerald-800 font-semibold rounded"
//         >
//           Download as PNG
//         </button>
//         <button
//           onClick={exportAsPDF}
//           className="px-4 py-2 bg-rose-200 text-rose-800 font-semibold rounded"
//         >
//           Download as PDF
//         </button>

//         <button
//           onClick={clearDataset}
//           className="px-4 py-2 bg-orange-200 text-orange-800 font-semibold rounded"
//         >
//           Clear Dataset
//         </button>
//       </div>

//       <div className="flex gap-4 mt-6">
//         <button
//           onClick={() => console.log(strokesRef.current)}
//           className="px-4 py-2 bg-blue-200 text-blue-800 font-semibold rounded"
//         >
//           Log Strokes
//         </button>
//         <button
//           onClick={redrawCanvas}
//           className="px-4 py-2 bg-green-200 text-green-800 font-semibold rounded"
//         >
//           Replay
//         </button>
//         <button
//           onClick={undoLastStroke}
//           className="px-4 py-2 bg-red-200 text-red-800 font-semibold rounded"
//         >
//           Undo
//         </button>
//         <button
//           onClick={() => {
//             const normalized = normalizeStrokes(strokesRef.current);
//             console.log("Normalized:", normalized);
//           }}
//           className="px-4 py-2 bg-purple-200 text-purple-800 font-semibold rounded"
//         >
//           Normalize (log)
//         </button>

//         <button
//           onClick={clearCanvas}
//           className="px-4 py-2 bg-gray-200 rounded text-gray-800 font-semibold"
//         >
//           Clear
//         </button>
//       </div>
//       <div className="mt-6 flex items-center gap-4">
//         <span className="text-lg font-semibold">
//           Write character: <span className="text-blue-600">{currentChar}</span>
//         </span>

//         <button
//           onClick={saveCharacterSample}
//           className="px-4 py-2 bg-green-200 text-green-800 font-semibold rounded"
//         >
//           Save
//         </button>

//         <button
//           onClick={() =>
//             setCurrentChar((c) => String.fromCharCode(c.charCodeAt(0) + 1))
//           }
//           className="px-4 py-2 bg-blue-200 text-blue-800 font-semibold rounded"
//         >
//           Next
//         </button>
//         <button
//           onClick={() => console.log(datasetRef.current)}
//           className="px-4 py-2 bg-purple-200 text-purple-800 font-semibold rounded"
//         >
//           Log Dataset
//         </button>
//       </div>
//     </div>
//   );
// };

// export default HandwritingPadNew;
