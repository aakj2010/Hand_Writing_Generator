export type Point = {
  x: number;
  y: number;
};

export type Stroke = Point[];

export type HandwritingDataset = Record<string, Stroke[][]>;
