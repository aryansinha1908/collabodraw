# CollaboDraw: Frontend Architecture (Phase 1 Context)

## System Overview

CollaboDraw is a collaborative whiteboard application. Phase 1 established the local drawing engine using a state-driven rendering loop via the HTML5 Canvas API.

### Tech Stack

- **Framework:** React + TypeScript + Vite
- **Styling:** Tailwind CSS (v4 via `@tailwindcss/vite`)
- **State Management:** Zustand
- **Icons:** Lucide-React
- **ID Generation:** `uuid` (v4)

---

## Core Data Structures (`client/src/types.ts`)

The application relies on explicitly typed structures to manage canvas elements.

- `Tool`: Union type `'pen' | 'eraser' | 'rect' | 'circle' | 'line'`.
- `Point`: Interface `{ x: number, y: number }`.
- `CanvasElement`: The core interface for all drawn shapes.
  - Pen/Line/Eraser use the `points` array.
  - Rect/Circle use `x`, `y`, `width`, and `height`.
  - Styling is handled via `color` and `strokeWidth`.

---

## State Management (`client/src/store.ts`)

Global state is managed by Zustand (`useBoardStore`).

### State Variables

- `elements`: Array of committed `CanvasElement` objects.
- `undoStack` / `redoStack`: Arrays of element states (arrays of arrays) for history traversal.
- `currentTool`: The active drawing tool.
- `strokeColor` / `strokeWidth`: Current styling parameters.

### History Architecture

- **Push:** Drawing a new element pushes the _previous_ `elements` array into the `undoStack` and clears the `redoStack`.
- **Undo:** Pops the top state from `undoStack`, replaces `elements` with it, and pushes the current state to `redoStack`.
- **Redo:** Pops the top state from `redoStack`, replaces `elements` with it, and pushes the current state to `undoStack`.

---

## The Canvas Engine (`client/src/components/Canvas.tsx`)

The canvas operates on a strict **State-Driven Render Loop**. It does not retain memory of pixels; instead, it redraws all state objects on every render cycle.

### Transient vs. Persistent Rendering

- **`elements` (Persistent):** The finalized array of drawings from the Zustand store.
- **`currentElement` (Transient):** A local React state holding the shape currently being drawn.
- The render loop concatenates `elements` and `currentElement` before looping through and drawing each one.

### Render Loop (`useEffect`)

1. **Clear:** `ctx.clearRect(0, 0, canvas.width, canvas.height)` on every dependency change.
2. **Context Settings:** Uses `lineCap = 'round'` and `lineJoin = 'round'`.
3. **Eraser Implementation:** Uses `ctx.globalCompositeOperation = 'destination-out'` to delete pixels (true transparency), reverting to `'source-over'` for standard drawing.
4. **Drawing Logic:** \* Iterates through the combined elements array.
   - Uses `beginPath()`, `moveTo()`, `lineTo()`, and `stroke()` depending on the element `type`.
   - _Edge Case Handled:_ The `'line'` tool explicitly falls back to `points[0]` if `points[1]` is undefined during the initial `mousedown` event to prevent render crashes.

### Event Handlers

- **`onMouseDown` (`startDrawing`):** Initializes `currentElement` with a new UUID, current styling, and the initial `{x, y}` point.
- **`onMouseMove` (`draw`):** Updates the `currentElement`. Appends to the `points` array for freehand/lines, or calculates `width`/`height` differences for shapes.
- **`onMouseUp` / `onMouseLeave` (`finishDrawing`):** Pushes the finalized `currentElement` into the Zustand `elements` array (triggering a history save) and nullifies `currentElement`.

---

## UI Component (`client/src/App.tsx`)

Acts as the main layout container.

- **Toolbar:** Absolute positioned floating toolbar utilizing Tailwind utility classes.
- **Controls:** Maps UI buttons (Lucide icons and HTML color picker) directly to Zustand store actions (`setTool`, `setColor`, `undo`, `redo`, `clearBoard`).
- **Canvas Wrapping:** Mounts the `<Canvas />` component in a full-screen, hidden-overflow container to prevent accidental scrolling during touch/mouse drag.
