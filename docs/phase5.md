# CollaboDraw: Board Management & Dashboard (Phase 5 Context)

## System Overview

Phase 5 transitioned the application from arbitrary, unsecured WebSocket rooms to structured, database-backed board management. It introduces a dedicated User Dashboard, secure 6-character shareable links, and server-side capacity enforcement.

### Key Features

- **Shareable Links:** Boards are accessed via generated 6-character alphanumeric IDs.
- **Access Control:** Boards enforce maximum user capacities to prevent overloading.
- **Separation of Concerns:** Distinct public landing page vs. private authenticated dashboard.

---

## Database Architecture (`server/src/models.ts`)

The `BoardSchema` was expanded to store configuration and ownership data alongside the drawing elements.

- **`boardId`:** A 6-character alphanumeric string generated upon creation (e.g., `X7K9P2`). Acts as both the database index and the shareable link.
- **`ownerId`:** References the `User` document of the creator.
- **`maxUsers`:** Integer defining the capacity limit (default: 10).
- **`isPrivate`:** Boolean indicating visibility status.
- **`title`:** User-defined string name for the board.

---

## Backend APIs & Socket Security (`server/src/routes/boards.ts` & `server/src/server.ts`)

### 1. Board REST API

Introduced a dedicated router protected by the JWT middleware to handle CRUD operations before a user ever connects to a WebSocket room.

- **`POST /boards`:** Generates the unique `boardId`, applies user settings (capacity, privacy, title), and saves the initial document.
- **`GET /boards/my-boards`:** Queries `Board.find({ ownerId: req.user.userId })` to populate the user's dashboard.
- **`DELETE /boards/:boardId`:** Deletes a board entirely. Enforces strict authorization ensuring `req.user.userId === board.ownerId`.

### 2. Socket.IO "Bouncer" Validation

The `join-room` WebSocket listener was upgraded from a blind connection to a validated entry point.

1. **Existence Check:** Queries the database to ensure the `boardId` exists. Emits `join-error` if invalid.
2. **Capacity Check:** Evaluates `io.sockets.adapter.rooms.get(roomId).size` against the database's `maxUsers` limit. Refuses connection and emits `join-error` if the room is full.

---

## Frontend Architecture

The UI was restructured to support complex board management and clean up the routing hierarchy.

### 1. Route Splitting

- **`/` (Landing Page):** A pure, unauthenticated marketing page. Prompts login for guests or redirects to the dashboard for authenticated users.
- **`/dashboard` (User Dashboard):** A protected grid layout containing:
  - **Create Board:** Form to specify title, capacity, and privacy, returning a new `boardId`.
  - **Join Board:** Text input to navigate directly to a friend's 6-character code.
  - **My Boards Grid:** Iterates over fetched boards, displaying metadata and providing quick actions (Join, Delete).

### 2. Graceful Socket Rejection (`client/src/pages/BoardPage.tsx`)

The canvas component was updated to handle server-side connection rejections gracefully. It listens for `socket.on('join-error')`, alerts the user of the specific failure reason (e.g., "Board is at maximum capacity"), and redirects them safely back to the Dashboard.
