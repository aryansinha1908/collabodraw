export type Tool =
  | "pen"
  | "eraser"
  | "rect"
  | "circle"
  | "line"
  | "hand"
  | "text";

export interface Point {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: Tool;
  points?: Point[]; // For pen and eraser
  x?: number; // For shapes
  y?: number;
  width?: number;
  height?: number;
  color: string;
  strokeWidth: number;
  createdBy?: string;
  text?: string;
  fontSize?: number;
}
