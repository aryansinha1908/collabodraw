# CollaboDraw: Deployment Architecture & Troubleshooting (Phase 10 Context)

## System Overview

The application utilizes a split-deployment architecture to maximize performance while accommodating the persistent connection requirements of WebSockets.

- **Frontend (Vercel):** Hosts the React/Vite client. Vercel provides lightning-fast edge CDN delivery, which is ideal for the static assets and the React UI.
- **Backend (Render):** Hosts the Node.js/Express and Socket.io server. Unlike Vercel's Serverless architecture (which kills connections after 10 seconds), Render provides a persistent container environment necessary for uninterrupted real-time WebSocket synchronization.

---

## Deployment Configuration

### 1. Backend Pipeline (Render)

- **Build Command:** `npm install && npm run build` (compiles TypeScript to JavaScript using `tsc`).
- **Start Command:** `node dist/server.js`
- **Environment Variables:** \* `MONGODB_URI`: Production database connection string.
  - `CLIENT_URL`: Exact Vercel production URL used to strictly lock down CORS policies.

### 2. Frontend Pipeline (Vercel)

- **Framework:** Vite (React)
- **Environment Variables:** *`VITE_BACKEND_URL`: Points to the live Render backend URL. Must be injected*before\* the build process, as Vite bakes these into the static files at build time.
- **Routing Config:** A `vercel.json` file is present in the root directory to rewrite all traffic to `index.html`, allowing React Router to handle Single Page Application (SPA) navigation without triggering Vercel 404 errors.

---

## Technical Challenges & Resolutions

During the production deployment, several critical architectural and network bugs were isolated and resolved:

### Challenge 1: The SPA Routing 404 Trap

- **Symptom:** Direct navigation or refreshing on frontend routes (e.g., `/auth`) resulted in a Vercel 404 Not Found error.
- **Root Cause:** Vercel's edge servers default to looking for static HTML files in physical directories matching the route path.
- **Resolution:** Implemented a `vercel.json` configuration with a global rewrite (`"source": "/(.*)", "destination": "/index.html"`), forcing the server to hand off routing logic back to the React application.

### Challenge 2: Network Blocking & Render Cold Starts

- **Symptom:** Authentication `POST` requests were instantly blocked by the browser with `net::ERR_BLOCKED_BY_CLIENT`, or timed out entirely.
- **Root Cause:** Twofold issue. First, strict browser privacy extensions (like uBlock) occasionally flag cross-domain authentication requests. Second, Render's free tier spins down the backend container after 15 minutes of inactivity, requiring up to 50 seconds to "wake up" upon the next request.
- **Resolution:** Disabled browser shields for the production domain. Added robust error handling on the client to gracefully wait out the Render container cold start.

### Challenge 3: Strict CORS & The "Trailing Slash of Death"

- **Symptom:** The browser successfully completed an `OPTIONS` pre-flight check but refused to execute the actual `POST` request, throwing a CORS string mismatch error.
- **Root Cause:** The `CLIENT_URL` environment variable in Render contained a trailing slash (`https://collabodraw-frontend.vercel.app/`), while the browser's origin header omitted it (`https://collabodraw-frontend.vercel.app`). CORS security requires a 1:1 exact string match.
- **Resolution:** Updated the backend environment variables to remove the trailing slash, perfectly aligning the allowed origin with the browser's strict formatting.
