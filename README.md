# CollaboDraw

-> A collaborative whiteboard web-based real-time platform for multiple users sessions.

## Project Goals

1. Build a low-latency collaborative whiteboard
2. Support multiple users drawing simultaneously
3. Maintain board state persistently
4. Ensure smooth UX with minimal synchronization issues
5. Design architecture scalable to future features

## Non-Goals (for Core MVP)

- Advanced shape editing
- Per-user undo/redo
- CRDT / OT conflict resolution
- Offline support

## Tech Stack

### Front-end

- React
- TypeScript
- Vite
- HTML Canvas API
- Tailwind Css
- Zustand

### Back-end

- Node.js
- Express.js
- TypeScript
- Socket.IO

### Database

- MongoDB
- Mongoose

## Core MVP Features

### 1. Board System

- Create New Boards
- Join boards using ID/Link
- Board Persistence

### 2. Drawing Tools

- Pen
- Eraser
- Rectangle
- Circle
- Line

### 3. Styling

- Color Picker
- Stroke Width

### 4. Real-Time Features

- Multi-user drawing
- Live cursors
- Connected users count

### 5. Canvas Controls

- Clear Board
- Undo / Redo

---

## Compliance MVP

### Authentication

- Register
- Login
- Protected board creation
- Only authenticated users can create or access boards

## Stretch Features

- Permissions
- PDF export
- Image upload
- Advanced object manipulation
- Board history versions
- Sticky notes
- Chat system

---

## Project Architecture

### Event Model

Two categories of events exist:

#### Temporary Events (not persisted)

- draw-start
- draw-move
- cursor-move

Used for live collaboration previews.

#### Persistent Events / Elements

- draw-end
- clear-board
- undo
- redo

These update board state and are persisted in MongoDB.

```
React Client
    |
    V
Socket IO
    |
    V
Node/Express Server
    |
    V
MongoDB
```

## State Classification

Persistent State (MongoDB)

- Boards
- Drawing elements

Transient State (Memory / Socket Server)

- Active users
- Live cursors
- Temporary drawing previews

### Front-end Responsibilities

React app handles:

- Toolbar UI
- Canvas rendering
- Local drawing state
- Socket events
- Cursor rendering

### Back-end Responsibilities

Server handles:

- Room creation
- Room joining
- Socket broadcasting
- Persistence
- User presence

Back-end Routes:

```
Auth Route:
    POST /auth/register
    POST /auth/login
    GET /auth/me
    POST /auth/logout
```

Socket events:

- create-room
- join-room
- draw-start
- draw-move
- draw-end
- cursor-move
- undo
- redo
- clear-board
- disconnect

## Socket Authentication

Client sends JWT token during socket connection.

Example:
socket.auth = {
token: jwt
}

Server verifies token before allowing room access.

Benefits:

- Identify connected users
- Secure board access
- Associate cursors with users

---

### Data Model

1. Board

```json
interface Board {
  boardId: string
  title: string
  createdAt: Date
  updatedAt: Date
  elements: CanvasElement[]
}
```

1. Element

```json
{
  id: String,
  type: "pen" | "line" | "rect" | "circle",
  points: [],
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  color: String,
  strokeWidth: Number,
  createdBy: String
}
```

1. User

```json
interface User {
  _id: string
  username: string
  email: string
  passwordHash: string
}
```

Pen uses:

- points

Rectangle/circle uses:

- x y width height

### State-driven Rendering

Maintain:

- elements = []

On every Frame:

1. Clear Canvas
2. Redraw all elements

#### Undo/Redo Architecture

Two stacks are created:

```js
elements = [];
undoStack = [];
redoStack = [];
```

Undo Policy:

- Global undo only
- Undo removes latest completed element
- Partial strokes cannot be undone

Undo:

```
pop from elements
push into redoStack
```

Redo:

```
pop from redoStack
push into elements
```

## Edge Cases

- User joins late → hydrate full board
- User disconnects mid-draw
- Multiple undo requests simultaneously
- Network lag causes out-of-order events
- Clear board while someone is drawing

---

## Development Roadmap

### Phase 1 — Local Canvas Engine

- Toolbar UI
- Canvas rendering
- Drawing tools
- Styling controls

### Phase 2 — Real-Time Collaboration

- Socket.IO setup
- Room creation/joining
- Live drawing synchronization
- Live cursors

### Phase 3 — Persistence

- MongoDB integration
- Save board state
- Restore previous board state

### Phase 4 — Authentication (Mandatory)

- Register/Login
- JWT auth
- Protected routes
- Socket authentication

### Phase 5 — Polish

- Better UI
- Export
- Stretch features
