// import type { HandwritingDataset, Stroke } from "../types/handwriting";
// import { normalizeStrokes } from "../utils/handwritingMath";

// type Props = {
//   strokesRef: React.MutableRefObject<Stroke[]>;
//   datasetRef: React.MutableRefObject<HandwritingDataset>;
//   save: () => void;
//   currentChar: string;
// };

// export const HandwritingTrainer = ({
//   strokesRef,
//   datasetRef,
//   save,
//   currentChar,
// }: Props) => (
//   <button
//     onClick={() => {
//       if (strokesRef.current.length === 0) return;

//       const normalized = normalizeStrokes(strokesRef.current);

//       datasetRef.current[currentChar] ??= [];
//       datasetRef.current[currentChar].push(normalized);

//       strokesRef.current = [];
//       save();
//     }}
//     className="px-4 py-2 bg-green-200 text-green-800 font-semibold rounded"
//   >
//     Save "{currentChar}"
//   </button>
// );
type Props = {
  currentChar: string;
  onSave: () => void;
};

export const HandwritingTrainer = ({ currentChar, onSave }: Props) => (
  <button
    onClick={onSave}
    className="px-4 py-2 bg-green-200 text-green-800 font-semibold rounded"
  >
    Save "{currentChar}"
  </button>
);
