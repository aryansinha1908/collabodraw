# CollaboDraw

**A high-performance, real-time collaborative whiteboard built for seamless remote brainstorming, system design, and interactive learning.**

CollaboDraw allows multiple users to join a shared workspace, sketch ideas, and see updates instantly across all connected devices. Built with a focus on low-latency synchronization and responsive design, it provides a fluid experience on desktops, tablets, and mobile phones.

---

## Key Features

### Core Collaboration

- **Real-Time Synchronization:** Instantaneous drawing updates across all connected clients via Socket.io.
- **Live Presence:** View active user counts, live participant names, and synchronized real-time cursors.
- **Persistent Workspaces:** All board states are automatically saved to MongoDB. Drop off and rejoin at any time without losing your work.
- **Multi-Device Support:** Fully responsive canvas utilizing the modern Pointer Events API to natively support desktop mice, mobile touchscreens, and styluses simultaneously.

### Drawing & Canvas Engine

- **Dynamic Tools:** Freehand pen, straight lines, rectangles, circles, and an eraser.
- **Granular Control:** Custom color picker and adjustable stroke width settings.
- **Infinite Panning:** Middle-mouse or Hand-tool panning to navigate large diagrams.
- **Multiplayer Undo/Redo:** Intelligent history stacks that safely isolate and revert your specific actions without deleting your teammates' active strokes.

### Professional Workflows

- **Secure Authentication:** JWT-based user registration and protected board creation.
- **Frictionless Sharing:** Invite collaborators instantly using shareable 6-character board IDs.
- **Keyboard Shortcuts:** Rapid-fire `Ctrl+Z` (Undo) and `Ctrl+Y` (Redo) support for power users.
- **Multi-Format Export:** Download high-resolution snapshots of your board in PNG, JPG, or PDF formats.

---

## System Architecture

CollaboDraw utilizes a split-deployment architecture to maximize edge-delivery speeds while maintaining persistent WebSocket connections.

- **Frontend (Vercel):** React, TypeScript, Vite, and Zustand. Hosted on Vercel's edge network for lightning-fast static asset delivery and SPA routing.
- **Backend (Render):** Node.js, Express, and Socket.io. Hosted on Render to support the long-lived, persistent container environments required for uninterrupted WebSocket syncing.
- **Database (MongoDB Atlas):** NoSQL document storage for persistent board elements and user credentials.

### Event Synchronization Model

To protect server resources, the app categorizes network events:

1. **Transient Events (Memory/Socket):** `draw-start`, `draw-move`, `cursor-move`. These are broadcasted directly peer-to-peer via the server for live previews and are throttled (50ms intervals) to prevent network flooding.
2. **Persistent Events (Database):** `draw-end`, `clear-board`, `undo`. These trigger asynchronous MongoDB updates to ensure the permanent board record remains pristine.

---

## Technical Challenges Conquered

- **The Canvas Wipe Bug:** HTML5 `<canvas>` elements natively clear their context upon window resize. Fixed by binding window dimensions to React state with a debounced listener, forcing an automatic React re-render of the history stack in milliseconds.
- **WebSocket Flooding:** Uncapped `onMouseMove` events were generating 600+ network requests per second per user. Implemented a timestamp delta throttle to cap emissions, reducing network load by 80% while maintaining visual fluidity.
- **Targeted History Deletion:** Standard `pop()` array methods would delete the absolute latest element drawn in the room, breaking multiplayer undo. Engineered a custom backend splice function to locate and isolate only the requesting user's latest stroke index.

---

## Local Development Setup

**1. Clone the repository**

```bash
git clone [https://github.com/yourusername/collabodraw.git](https://github.com/yourusername/collabodraw.git)
```

2. Setup the backend

```bash
cd collabodraw-server
npm install
```

Create a .env file in the server directory:
Code snippet:-

```
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=<http://localhost:5173>
```

Start the server: `npm run dev`

3. Setup the Frontend

```bash
cd ../collabodraw-frontend
npm install
```

Create a .env file in the frontend directory:
Code snippet:-

```
VITE_BACKEND_URL=<http://localhost:3001>
```

Start the client: `npm run dev`

Built with ❤️ for [HackSphere]
