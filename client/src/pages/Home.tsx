import { useRef, useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  ArrowRightLeft,
  Palette,
  History,
  ShieldCheck,
  BellRing,
  DownloadCloud,
  Globe,
} from "lucide-react";
import { useBoardStore } from "../store";
import { motion, useInView, type Variants } from "framer-motion";
import { HomeToolbar } from "../components/HomeToolbar";

const SyncedTypingDemo = () => {
  const syncRef = useRef(null);
  const isSyncInView = useInView(syncRef, { once: true, margin: "-100px" });

  // Pre-calculate the entire animation script once for flawless performance
  const { frames, loopStartIndex } = useMemo(() => {
    const frames = [];
    const prefix = "Every ";
    const suffix =
      " is synchronized instantly across connected participants using persistent WebSocket connections.";
    const words = ["stroke", "change", "movement"];
    const WAIT_FRAMES = 100;

    // Helper to pause the animation for 5 seconds
    const addWait = (text: any, cursorPos: any) => {
      for (let i = 0; i < WAIT_FRAMES; i++) {
        frames.push({ text, cursorPos });
      }
    };

    // Phase 1: Initial full sentence typing
    const fullInitialStr = prefix + words[0] + suffix;
    for (let i = 0; i <= fullInitialStr.length; i++) {
      frames.push({ text: fullInitialStr.substring(0, i), cursorPos: i });
    }

    addWait(fullInitialStr, fullInitialStr.length);

    // Record where the infinite loop should restart (so we don't re-type the whole sentence)
    const loopStartIndex = frames.length;

    // Phase 2: Create the Backspace & Retype cycles
    for (let w = 0; w < words.length; w++) {
      const fromWord = words[w];
      const toWord = words[(w + 1) % words.length];

      // Animate Backspacing
      for (let i = fromWord.length - 1; i >= 0; i--) {
        const currentWordState = fromWord.substring(0, i);
        const currentText = prefix + currentWordState + suffix;
        const cursorPos = prefix.length + currentWordState.length;
        frames.push({ text: currentText, cursorPos });
      }

      // Animate Typing the new word
      for (let i = 1; i <= toWord.length; i++) {
        const currentWordState = toWord.substring(0, i);
        const currentText = prefix + currentWordState + suffix;
        const cursorPos = prefix.length + currentWordState.length;
        frames.push({ text: currentText, cursorPos });
      }

      // Wait 5 seconds before the next cycle
      const typedStr = prefix + toWord + suffix;
      addWait(typedStr, typedStr.length);
    }

    return { frames, loopStartIndex };
  }, []);

  const [tick, setTick] = useState(0);

  // The Master Clock
  useEffect(() => {
    if (!isSyncInView) return;

    const interval = setInterval(() => {
      setTick((currentTick) => {
        let nextTick = currentTick + 1;
        // If we reach the end of the script, loop back to the first backspace animation
        if (nextTick >= frames.length) {
          nextTick = loopStartIndex;
        }
        return nextTick;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isSyncInView, frames.length, loopStartIndex]);

  // User B's delay is handled effortlessly by just pulling an older frame from the script!
  const frameA = frames[tick];
  const frameB = frames[Math.max(0, tick - 6)];

  // Renders the text and injects a terminal cursor exactly where the edits are happening
  const renderConsole = (frame: any, colorClass: any) => {
    if (!frame) return null;
    const { text, cursorPos } = frame;
    const before = text.substring(0, cursorPos);
    const after = text.substring(cursorPos);

    return (
      <div
        className={`text-left font-mono text-sm h-32 ${colorClass} bg-gray-900/50 p-4 rounded-lg border border-gray-800/50`}
      >
        <span>{before}</span>
        <span className="animate-pulse font-bold text-white">_</span>
        <span>{after}</span>
      </div>
    );
  };

  return (
    <div
      ref={syncRef}
      className="flex flex-col md:flex-row items-start justify-center gap-8 mb-8"
    >
      {/* User A */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="aspect-video bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl flex items-center justify-center overflow-hidden">
          <video
            src="/userA.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl border border-gray-800"
          />
        </div>
        {renderConsole(frameA, "text-blue-400")}
      </div>

      <div className="flex flex-col items-center justify-center gap-4 text-blue-500 md:mt-16">
        <ArrowRightLeft size={32} className="animate-pulse" />
      </div>

      {/* User B */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="aspect-video bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700 shadow-2xl flex items-center justify-center overflow-hidden">
          <video
            src="/userB.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-xl border border-gray-800"
          />
        </div>
        {renderConsole(frameB, "text-purple-400")}
      </div>
    </div>
  );
};

export const Home = () => {
  const navigate = useNavigate();
  const { token, username, logout } = useBoardStore();

  const handleCtaClick = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Reusable animation variant for scroll reveals
  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative overflow-x-hidden font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none fixed"></div>

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto"
      >
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <img
            src="/favicon-32x32.png"
            alt="CollaboDraw Logo"
            className="w-7 h-7 rounded-md"
          />
          CollaboDraw
        </div>

        <div className="flex gap-4 items-center">
          {token ? (
            <>
              <span className="text-sm font-medium text-gray-400 hidden md:block mr-2">
                Welcome, {username}
              </span>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <LayoutDashboard size={16} /> Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-2"
              >
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth")}
                className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
        >
          The whiteboard for <br /> engineering teams.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10"
        >
          Sketch architecture, brainstorm ideas, and collaborate in real-time.
          No latency, no complex menus. Just instant synchronization.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        >
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {token ? "Go to your Dashboard" : "Start drawing — it's free"}
          </button>
        </motion.div>

        {/* Hero Image Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="relative mx-auto mt-16 max-w-6xl z-10"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-[100px] rounded-full translate-y-10" />
          <div className="rounded-2xl border border-gray-700/50 bg-gray-900/40 p-2 sm:p-4 backdrop-blur-xl shadow-2xl">
            <img
              src="/hero-board.png"
              alt="CollaboDraw Workspace"
              className="w-full rounded-xl border border-gray-800 shadow-2xl"
            />
          </div>
        </motion.div>
      </main>

      {/* --- FEATURE SHOWCASE (Pitch Deck Layout) --- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        {/* Subtle vertical connecting line in the background */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent -translate-x-1/2 hidden md:block" />

        {/* 1. Real-Time Sync (Dual Screens) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-32 relative"
        >
          {/* Drop our new animated component here */}
          <SyncedTypingDemo />

          <div className="text-center max-w-2xl mx-auto bg-[#0d1117] relative z-10 py-4">
            <h3 className="text-2xl font-bold mb-3 flex items-center justify-center gap-2">
              <Globe className="text-blue-500" /> Instant Synchronization
            </h3>
            <p className="text-gray-400">
              Experience true real-time collaboration. Every stroke, shape, and
              movement is instantly broadcasted across the globe using
              low-latency WebSockets, ensuring your team is always on the exact
              same page.
            </p>
          </div>
        </motion.div>

        {/* 2. Toolbar Focus (Now fully interactive!) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-32 relative text-center"
        >
          {/* We just drop the new interactive component right here */}
          <HomeToolbar />
        </motion.div>

        {/* 3. Color & Stroke (Left Video, Right Text) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
            {/* PLACEHOLDER: Video for Color/Stroke Width */}
            <video
              src="/customizations.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <Palette className="text-purple-500" /> Infinite Customization
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Express your ideas clearly. Dynamically adjust stroke widths and
              select from an infinite color spectrum on the fly. Your
              customizations sync instantly to everyone in the workspace.
            </p>
          </div>
        </motion.div>

        {/* 4. Undo/Redo/Clear (Left Text, Right Video) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="order-2 md:order-1">
            <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <History className="text-green-500" /> Canvas History Controls
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Quickly correct mistakes with built-in Undo and Redo
              functionality. Keyboard shortcuts and toolbar controls make it
              easy to revert or restore your most recent drawing actions.
            </p>
          </div>
          <div className="order-1 md:order-2 rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
            {/* PLACEHOLDER: Video for Undo/Redo */}
            <img
              src="/canvasActions.png"
              alt="Export Menu Options"
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
        </motion.div>

        {/* 5. Permissions (Left Video, Right Text) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
            {/* PLACEHOLDER: Video for Collaboration Permissions */}
            <video
              src="/permissions.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <ShieldCheck className="text-yellow-500" /> Enterprise-Grade
              Security
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Control exactly who can view and edit your private workspaces.
              Owners have a dedicated administrative dashboard to intercept join
              requests and grant or revoke editor privileges in real-time.
            </p>
          </div>
        </motion.div>

        {/* 6. Toasts (Left Text, Right Video) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="order-2 md:order-1">
            <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <BellRing className="text-red-400" /> Live Presence Notifications
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              Stay informed as your collaboration session evolves. Receive
              lightweight toast notifications for connection changes, board
              owner availability, and important session events without
              interrupting your workflow.
            </p>
          </div>
          <div className="order-1 md:order-2 rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
            {/* PLACEHOLDER: Video for Toasts */}
            <video
              src="/notifications.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
        </motion.div>

        {/* 7. Export (Left Image, Right Text) */}
        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
            {/* PLACEHOLDER: Image for Export Options */}
            <img
              src="/exports.png"
              alt="Export Menu Options"
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
          <div>
            <h3 className="text-3xl font-bold mb-4 flex items-center gap-3">
              <DownloadCloud className="text-blue-400" /> Take Your Ideas
              Anywhere
            </h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              When the brainstorming is done, wrap it up seamlessly. Instantly
              export your entire infinite canvas as a high-resolution PNG, JPG,
              or PDF document with a single click.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <img
              src="/favicon-32x32.png"
              alt="CollaboDraw Logo"
              className="w-4 h-3 rounded-sm grayscale opacity-50"
            />
            <span className="font-semibold text-gray-300">CollaboDraw</span>
          </div>
          <p>
            © {new Date().getFullYear()} Built for HackSphere. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <a
              href="https://github.com/aryansinha1908/collabodraw"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
