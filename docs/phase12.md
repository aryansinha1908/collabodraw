## Phase 12: Role-Based Access Control & Private Approvals

### 1. Real-Time Permission Engine (RBAC)

- **JWT Identity Extraction:** Updated the `server.ts` Socket middleware to extract the database `userId` from the token payload, securely matching it against the board's `ownerId` in MongoDB.
- **Canvas Security:** Implemented a pre-flight authorization check inside `Canvas.tsx` (`handleMouseDown`). Users without `canEdit` privileges are blocked from drawing and receive a View-Only toast warning, though they retain the ability to use the hand tool to pan the infinite canvas.
- **Dynamic State Typing:** Upgraded the Zustand store (`store.ts`) `roomUsers` array to strictly type and track `isOwner` and `canEdit` boolean flags for all connected clients.

### 2. Private Board Approval Handshake

- **Server Interception:** Modified the `join-room` event in `server.ts`. If a non-owner attempts to join a private board, the server aborts the standard join process, places the user in a `waiting-approval` state, and isolates the owner's socket ID.
- **Interactive Approvals:** Built an interactive `react-hot-toast` UI that routes a specific `join-request` payload solely to the board owner, allowing them to click "Approve" or "Reject" directly from the notification.
- **Fallback Handling:** Added error handling to automatically reject users if they attempt to join a private board while the owner is offline.

### 3. Administrative UI & Participant Dashboard

- **Dynamic Toolbars:** Updated `BoardPage.tsx` to conditionally render the drawing tools. View-Only users see a streamlined UI with a "Viewing Mode" badge instead of pen/shape options.
- **Role Badges:** Upgraded the participants sidebar to display distinct visual hierarchies (👑 Owner, ✏️ Editor, 👁️ Viewer).
- **Live Permission Toggles:** Provided the Owner with inline action buttons in the participants menu to instantly trigger `update-permission` socket events, granting or revoking edit access for specific users on the fly.

### 4. Connection Lifecycle & UI Fixes

- **Presence Alerts:** Added `owner-connected` and `owner-disconnected` socket broadcasts to keep active members informed of the host's status.
- **Strict Mode Memory Leak Fix:** Resolved the infinite loading spinner bug caused by React 18's double-mounting by decoupling the `socket.connect()` call and explicitly firing `toast.dismiss()` in the `useEffect` cleanup phase.
- **Error Handling:** Added a `connect_error` listener to gracefully catch and display token or server rejection messages.
