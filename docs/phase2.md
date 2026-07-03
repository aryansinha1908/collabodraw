# CollaboDraw: Backend & Socket Architecture (Phase 2 Context)

## System Overview

Phase 2 introduced real-time multiplayer collaboration. It establishes a Node.js/Express server utilizing Socket.IO to broadcast transient and persistent state changes across multiple connected React clients.

### Tech Stack

- **Server:** Node.js + Express.js
- **WebSockets:** Socket.IO
- **Client Integration:** `socket.io-client`
- **Local State Sync:** Zustand (Separation of local vs. remote actions)

---

## Server Architecture (`server/src/server.ts`)

The server acts as a lightweight WebSocket broadcaster with a basic in-memory room management system.

### Transient Memory

- `roomUsers`: A `Map<string, Set<string>>` tracking active `socket.id`s within specific `roomId`s.
- No drawing data is stored on the server memory in this phase; it solely routes data between clients.

### Socket Event Dictionary

**1. Connection & Rooms**

- `connection` / `disconnect`: Manages user lifecycle. Automatically broadcasts `user-left` to room members to clean up live cursors.
- `join-room`: Subscribes a client to a specific room ID (currently hardcoded to `'hackathon-room'` on the client for MVP).

**2. Transient Events (High Frequency, Not Persisted)**
These events bypass the undo/redo stack and are used strictly for live UI feedback.

- `cursor-move`: Broadcasts `{ userId, x, y }`.
- `draw-start`: Broadcasts the initial shape state.
- `draw-move`: Broadcasts updates to the active shape (points array, or width/height).

**3. Persistent Events (Low Frequency, State-Altering)**
These events represent finalized actions. (In Phase 3, these will trigger MongoDB writes).

- `draw-end`: Broadcasts the finalized `CanvasElement`.
- `undo` / `redo` / `clear-board`: Broadcasts global state mutation commands.

---

## Frontend Sync Architecture

The client was updated to bi-directionally sync with the server while preventing infinite broadcast loops.

### 1. Zustand Store Upgrades (`client/src/store.ts`)

Added specific **Remote Actions** (`addRemoteElement`, `remoteUndo`, `remoteRedo`, `remoteClear`).

- **Crucial Logic:** These remote actions strictly update the local React/Zustand state _without_ triggering a new `socket.emit`. This prevents an infinite loop where Client A emits to Client B, and Client B receives and re-emits back to Client A.

### 2. Live Canvas Integration (`client/src/components/Canvas.tsx`)

The state-driven render loop was expanded to handle multi-player states.

#### Render Loop Additions

- **Remote Elements State:** `useState<Record<string, CanvasElement>>({})`
  - Tracks shapes currently being drawn by _other_ users. Indexed by `userId` to allow multiple remote users to draw simultaneously without overwriting each other's live previews.
- **Cursors State:** `useState<Record<string, Point>>({})`
  - Tracks live mouse coordinates of remote users, rendering an SVG cursor layer strictly above the canvas.

#### Event Lifecycle

1. **Local user drags mouse (`draw-move`):** Updates local `currentElement` -> Emits `draw-move` to network.
2. **Remote user receives (`draw-move`):** Updates local `remoteElements[userId]`. The render loop draws it.
3. **Local user lifts mouse (`draw-end`):** Pushes to Zustand `elements` array -> Emits `draw-end`.
4. **Remote user receives (`draw-end`):** Deletes preview from `remoteElements[userId]` -> Pushes finalized element to Zustand via `addRemoteElement()`.

### 3. Global Control Sync (`client/src/App.tsx`)

- Instantiates room joining (`socket.emit('join-room')`) on initial mount.
- Wraps toolbar functions (Undo, Redo, Clear) to execute the local Zustand action _and_ broadcast the Socket event simultaneously.
