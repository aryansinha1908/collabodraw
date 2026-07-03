# CollaboDraw: Authentication & Routing (Phase 4 Context)

## System Overview

Phase 4 secured the application by introducing JWT-based authentication, password hashing, and protected frontend routing. It ensures only registered users can access or create whiteboard sessions, while leaving the landing page accessible to guests.

### Tech Stack

- **Auth:** JSON Web Tokens (JWT), bcryptjs
- **Routing:** React Router v6
- **State Persistence:** Zustand + `localStorage`

---

## Backend Security (`server/src/routes/auth.ts` & `server/src/server.ts`)

### 1. REST APIs

- **`/auth/register`**: Validates uniqueness, hashes passwords via `bcryptjs` (salt rounds: 10), creates the `User` document, and signs a JWT.
- **`/auth/login`**: Verifies email existence, compares the hashed password, and issues a JWT.
- _Note on Environment Variables:_ The JWT secret is dynamically evaluated inside the route handlers to prevent Node.js import hoisting bugs from signing tokens with fallback secrets before `dotenv` initializes.

### 2. Socket.IO Middleware ("The Bouncer")

- Intercepts all incoming WebSocket handshake requests (`io.use(...)`).
- Extracts the JWT from `socket.handshake.auth.token`.
- Verifies the token. If valid, attaches the `username` to `socket.data` for downstream use. If invalid/missing, actively rejects the connection with an `Authentication error`.

---

## Frontend Architecture

The React application was heavily refactored from a monolithic conditional render to a strict routed architecture.

### 1. Route Hierarchy (`client/src/App.tsx`)

- **`/` (Home):** Unprotected landing page. Dynamically renders Login/Logout buttons based on authentication state.
- **`/auth` (Authentication):** The login/register form UI. On success, writes the token to Zustand and redirects to Home.
- **`/board/:roomId` (Canvas):** Wrapped in a `<ProtectedRoute>` component. If a guest attempts to navigate here, they are intercepted and redirected to `/auth`.

### 2. State & Socket Synchronization

- **Zustand (`client/src/store.ts`):** Stores `token` and `username`. Initializes from `localStorage` so sessions survive page refreshes.
- **Socket Instantiation:** `autoConnect` is disabled by default. The socket only connects when a user navigates to `/board/:roomId`, attaching the token to the handshake payload.
- **Failsafe:** Listens for `connect_error`. If the server rejects the token (e.g., expired), the client automatically purges `localStorage` and kicks the user back to the login screen.
