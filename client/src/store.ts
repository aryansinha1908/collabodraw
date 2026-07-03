import { create } from "zustand";
import type { CanvasElement, Tool } from "./types";

interface BoardState {
  elements: CanvasElement[];
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];
  currentTool: Tool;
  strokeColor: string;
  strokeWidth: number;

  token: string | null;
  username: string | null;
  setAuth: (token: string | null, username: string | null) => void;
  logout: () => void;

  // Local Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setElements: (elements: CanvasElement[], saveHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  clearBoard: () => void;
  addRemoteElement: (element: CanvasElement) => void;
  remoteUndo: () => void;
  remoteRedo: () => void;
  remoteClear: () => void;

  zoom: number;
  setZoom: (zoom: number) => void;
  roomUsers: { id: string; username: string }[];
  setRoomUsers: (users: { id: string; username: string }[]) => void;

  offsetX: number;
  offsetY: number;
  setOffset: (x: number, y: number) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: [],
  undoStack: [],
  redoStack: [],
  currentTool: "pen",
  strokeColor: "#ffffff",
  strokeWidth: 3,

  token: localStorage.getItem("draw_token"),
  username: localStorage.getItem("draw_username"),

  setAuth: (token, username) => {
    if (token && username) {
      localStorage.setItem("draw_token", token);
      localStorage.setItem("draw_username", username);
    }
    set({ token, username });
  },

  logout: () => {
    localStorage.removeItem("draw_token");
    localStorage.removeItem("draw_username");
    set({
      token: null,
      username: null,
      elements: [],
      undoStack: [],
      redoStack: [],
    });
  },

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ strokeColor: color }),
  setWidth: (width) => set({ strokeWidth: width }),

  setElements: (newElements, saveHistory = true) => {
    set((state) => {
      if (saveHistory) {
        return {
          elements: newElements,
          undoStack: [...state.undoStack, state.elements],
          redoStack: [],
        };
      }
      return { elements: newElements };
    });
  },

  undo: () => {
    const { undoStack, elements, redoStack } = get();
    if (undoStack.length === 0) return;
    const previousElements = undoStack[undoStack.length - 1];
    set({
      elements: previousElements,
      undoStack: undoStack.slice(0, -1),
      redoStack: [...redoStack, elements],
    });
  },

  redo: () => {
    const { undoStack, elements, redoStack } = get();
    if (redoStack.length === 0) return;
    const nextElements = redoStack[redoStack.length - 1];
    set({
      elements: nextElements,
      undoStack: [...undoStack, elements],
      redoStack: redoStack.slice(0, -1),
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

  // --- NEW: REMOTE ACTIONS ---
  addRemoteElement: (element) => {
    set((state) => ({
      elements: [...state.elements, element],
      undoStack: [...state.undoStack, state.elements],
      redoStack: [],
    }));
  },
  remoteUndo: () => get().undo(),
  remoteRedo: () => get().redo(),
  remoteClear: () => get().clearBoard(),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  roomUsers: [],
  setRoomUsers: (roomUsers) => set({ roomUsers }),

  offsetX: 0,
  offsetY: 0,
  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),
}));
