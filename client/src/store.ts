import { create } from "zustand";
import type { CanvasElement, Tool } from "./types";

interface BoardState {
  elements: CanvasElement[];
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];
  currentTool: Tool;
  strokeColor: string;
  strokeWidth: number;
  isZenMode: boolean;

  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  username: string | null;
  setAuth: (isAuthenticated: boolean, username: string | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;

  // Local Actions
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setWidth: (width: number) => void;
  setElements: (elements: CanvasElement[], saveHistory?: boolean) => void;
  undo: (userId: string) => void;
  redo: () => void;
  clearBoard: () => void;
  addRemoteElement: (element: CanvasElement) => void;
  remoteUndo: (userId: string) => void;
  remoteRedo: () => void;
  remoteClear: () => void;
  toggleZenMode: () => void;

  zoom: number;
  setZoom: (zoom: number) => void;
  roomUsers: {
    id: string;
    username: string;
    isOwner: boolean;
    canEdit: boolean;
  }[];
  setRoomUsers: (
    users: {
      id: string;
      username: string;
      isOwner: boolean;
      canEdit: boolean;
    }[],
  ) => void;

  offsetX: number;
  offsetY: number;
  setOffset: (x: number, y: number) => void;

  typingState: { x: number; y: number; text: string } | null;
  setTypingState: (
    state: { x: number; y: number; text: string } | null,
  ) => void;

  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  isChatOpen: boolean;
  toggleChat: () => void;
  setHasUnread: (status: boolean) => void;
  hasUnread: boolean;
  setMessages: (messages: ChatMessage[]) => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  elements: [],
  undoStack: [],
  redoStack: [],
  currentTool: "pen",
  strokeColor: "#ffffff",
  strokeWidth: 3,
  isZenMode: false,

  isAuthenticated: false,
  isCheckingAuth: true,
  username: null,

  setAuth: (isAuthenticated, username) => set({ isAuthenticated, username }),
  checkAuth: async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}/auth/me`,
        {
          credentials: "include",
        },
      );
      if (res.ok) {
        const data = await res.json();
        set({
          isAuthenticated: true,
          username: data.username,
          isCheckingAuth: false,
        });
      } else {
        set({ isAuthenticated: false, isCheckingAuth: false });
      }
    } catch (error) {
      set({ isAuthenticated: false, isCheckingAuth: false });
    }
  },

  logout: () => set({ isAuthenticated: false, username: null }),

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

  // Find your undo function in useBoardStore and replace it with this:
  undo: (userId: string) =>
    set((state) => {
      const lastUserElementIndex = state.elements
        .map((e) => e.createdBy)
        .lastIndexOf(userId);

      if (lastUserElementIndex === -1) return state; // Nothing to undo

      const newElements = [...state.elements];
      newElements.splice(lastUserElementIndex, 1);

      return {
        elements: newElements,
        redoStack: [...state.redoStack, state.elements],
      };
    }),

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
  remoteUndo: (userId) => get().undo(userId),
  remoteRedo: () => get().redo(),
  remoteClear: () => get().clearBoard(),
  toggleZenMode: () => set((state) => ({ isZenMode: !state.isZenMode })),

  zoom: 1,
  setZoom: (zoom) => set({ zoom }),
  roomUsers: [],
  setRoomUsers: (roomUsers) => set({ roomUsers }),

  offsetX: 0,
  offsetY: 0,
  setOffset: (offsetX, offsetY) => set({ offsetX, offsetY }),

  typingState: null,
  setTypingState: (typingState) => set({ typingState }),

  messages: [],
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  isChatOpen: false,
  toggleChat: () =>
    set((state) => ({ isChatOpen: !state.isChatOpen, hasUnread: false })),
  hasUnread: false,
  setHasUnread: (status) => set({ hasUnread: status }),
  setMessages: (messages) => set({ messages }),
}));

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}
