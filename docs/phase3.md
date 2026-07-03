# CollaboDraw: Database Persistence (Phase 3 Context)

## System Overview

Phase 3 transitions the application from volatile transient sessions to a permanent state architecture. It utilizes MongoDB to store finalized drawing actions and introduces "Hydration" to serve saved states to newly connected clients.

### Tech Stack

- **Database:** MongoDB Atlas
- **ODM:** Mongoose

---

## Data Models (`collabodraw-server/src/models.ts`)

Strict Mongoose schemas enforce the exact data structure dictated by the TypeScript frontend interfaces.

- **PointSchema:** `{ x: Number, y: Number }` (Nested array schema).
- **ElementSchema:** Maps precisely to the `CanvasElement` interface. Stores shape primitives, coordinates, styling (`color`, `strokeWidth`), and authorship (`createdBy`).
- **BoardSchema:** The root document container.
  - `boardId`: Unique identifier (currently maps to socket room IDs).
  - `elements`: Array of `ElementSchema` objects.
  - `timestamps`: Auto-generated creation and update times.

---

## Persistence Logic (`collabodraw-server/src/server.ts`)

The socket listeners were upgraded to execute database writes simultaneously with network broadcasts.

### 1. Incremental Writes

- **Event:** `draw-end`
- **DB Action:** Uses `$push` via `findOneAndUpdate` to append a single finalized element to the `Board.elements` array. Utilizes `upsert: true` to dynamically create the document if a user draws before a board is formally initialized.

### 2. Destructive Writes

- **Event:** `clear-board` -> Uses `$set: { elements: [] }` to wipe the canvas.
- **Event:** `undo` -> Uses `$pop: { elements: 1 }` to delete the last drawn stroke globally. _(Note: True robust undo/redo in production requires soft-deletes or action logs, but `$pop` handles the hackathon MVP constraints efficiently)._

---

## Client Hydration

When a user joins a room, they must sync with the historical state.

1. **Server (`join-room` listener):** \* Queries `Board.findOne({ boardId })`.
    - If no board exists, executes `Board.create()` to initialize an empty array.
    - Directly targets the joining user with `socket.emit('board-state', board.elements)`.
2. **Client (`src/App.tsx`):**
    - Listens for `board-state`.
    - Invokes Zustand's `setElements(loadedElements, false)` to inject the database state directly into the render loop _without_ pushing it to the local undo stack.
