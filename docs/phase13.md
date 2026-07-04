## Phase 13: Interactive Pitch Deck & Landing Page Overhaul

### 1. Presentation-Ready Layout

- **Hero Showcase:** Replaced the static placeholder with a premium, glassmorphism-framed snapshot of the live application workspace, featuring a dynamic background glow.
- **Zig-Zag Feature Flow:** Architected a SaaS-standard alternating layout for the feature sections, utilizing HTML5 `<video>` tags configured for silent, GIF-like autoplay (`autoPlay loop muted playsInline`) to demonstrate core functionalities efficiently.

### 2. Interactive Component Previews

- **Live Toolbar Demo (`HomeToolbar.tsx`):** Engineered a standalone, interactive version of the workspace toolbar directly into the landing page, allowing users to experience the UI without authenticating.
- **Auto-Cycling State:** Implemented a `setInterval` loop that cycles through the primary tools every 3 seconds, automatically pausing and yielding control if the user manually clicks a tool.
- **Animated Transitions:** Utilized `framer-motion` (`<AnimatePresence>`) to seamlessly fade contextual descriptions in and out as the active tool changes.

### 3. WebSocket Latency Simulation

- **Frame Sequence Engine (`SyncedTypingDemo`):** Developed a highly optimized, pre-calculated animation script using `useMemo` to simulate real-time typing across two separate "user" screens without causing React rendering lag.
- **Simulated Network Delay:** Programmatically delayed User B's UI rendering by exactly 6 frames to visually demonstrate the low-latency (~200ms) nature of the application's WebSocket connections.
- **Infinite Loop & Backspacing:** Built a custom terminal-style typing animation that seamlessly backspaces and retypes specific words ("stroke", "change", "movement") on a 5-second interval, keeping both simulated users flawlessly synchronized.
