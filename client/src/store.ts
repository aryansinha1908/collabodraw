import { create } from "zustand";
import type { CanvasElement, Tool } from "./types";

interface BoardState {
  elements: CanvasElement[];
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];
  currentTool: Tool;
  strokeColor: string;
  strokeWidth: number;

  // Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setElements: (elements: CanvasElement[], saveHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: [],
  undoStack: [],
  redoStack: [],
  currentTool: "pen",
  strokeColor: "#ffffff",
  strokeWidth: 3,

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ strokeColor: color }),
  setWidth: (width) => set({ strokeWidth: width }),

  setElements: (newElements, saveHistory = true) => {
    set((state) => {
      if (saveHistory) {
        return {
          elements: newElements,
          undoStack: [...state.undoStack, state.elements],
          redoStack: [], // Clear redo stack on new action
        };
      }
      return { elements: newElements };
    });
  },

  undo: () => {
    const { undoStack, elements, redoStack } = get();
    if (undoStack.length === 0) return;

    const previousElements = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    set({
      elements: previousElements,
      undoStack: newUndoStack,
      redoStack: [...redoStack, elements],
    });
  },

  redo: () => {
    const { undoStack, elements, redoStack } = get();
    if (redoStack.length === 0) return;

    const nextElements = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    set({
      elements: nextElements,
      undoStack: [...undoStack, elements],
      redoStack: newRedoStack,
    });
  },

  clearBoard: () => {
    const { elements } = get();
    set((state) => ({
      elements: [],
      undoStack: [...state.undoStack, elements],
      redoStack: [],
    }));
  },
}));
