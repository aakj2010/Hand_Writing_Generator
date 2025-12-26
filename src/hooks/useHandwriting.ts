import { useRef, useEffect } from "react";
import type { Stroke, HandwritingDataset } from "../types/handwriting";

const KEY = "handwriting-dataset-v1";

export const useHandwriting = () => {
  const strokesRef = useRef<Stroke[]>([]);
  const datasetRef = useRef<HandwritingDataset>({});

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(datasetRef.current));
  };

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      datasetRef.current = JSON.parse(saved);
    }
  }, []);

  return { strokesRef, datasetRef, save };
};
