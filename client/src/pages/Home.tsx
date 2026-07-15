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
  Eye,
  PenTool,
  Hand,
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  Wand2,
  Undo,
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Users,
  Shield,
  Menu,
  Home as HomeIcon,
  Copy,
  Link,
} from "lucide-react";
import { useBoardStore } from "../store";
import { motion, useInView, type Variants } from "framer-motion";
import { HomeToolbar } from "../components/HomeToolbar";
import { Canvas } from "../components/Canvas";
import { demoElements } from "../demoData";
import toast, { Toaster } from "react-hot-toast";
import { socket } from "../socket";

// --- EXISTING SYNC TYPING DEMO ---
const SyncedTypingDemo = () => {
  const syncRef = useRef(null);
  const isSyncInView = useInView(syncRef, { once: true, margin: "-100px" });

  const { frames, loopStartIndex } = useMemo(() => {
    const frames = [];
    const prefix = "Every ";
    const suffix =
      " is synchronized instantly across connected participants using persistent WebSocket connections.";
    const words = ["stroke", "change", "movement"];
    const WAIT_FRAMES = 100;

    const addWait = (text: any, cursorPos: any) => {
      for (let i = 0; i < WAIT_FRAMES; i++) {
        frames.push({ text, cursorPos });
      }
    };

    const fullInitialStr = prefix + words[0] + suffix;
    for (let i = 0; i <= fullInitialStr.length; i++) {
      frames.push({ text: fullInitialStr.substring(0, i), cursorPos: i });
    }

    addWait(fullInitialStr, fullInitialStr.length);
    const loopStartIndex = frames.length;

    for (let w = 0; w < words.length; w++) {
      const fromWord = words[w];
      const toWord = words[(w + 1) % words.length];

      for (let i = fromWord.length - 1; i >= 0; i--) {
        const currentWordState = fromWord.substring(0, i);
        const currentText = prefix + currentWordState + suffix;
        const cursorPos = prefix.length + currentWordState.length;
        frames.push({ text: currentText, cursorPos });
      }

      for (let i = 1; i <= toWord.length; i++) {
        const currentWordState = toWord.substring(0, i);
        const currentText = prefix + currentWordState + suffix;
        const cursorPos = prefix.length + currentWordState.length;
        frames.push({ text: currentText, cursorPos });
      }

      const typedStr = prefix + toWord + suffix;
      addWait(typedStr, typedStr.length);
    }

    return { frames, loopStartIndex };
  }, []);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isSyncInView) return;
    const interval = setInterval(() => {
      setTick((currentTick) => {
        let nextTick = currentTick + 1;
        if (nextTick >= frames.length) {
          nextTick = loopStartIndex;
        }
        return nextTick;
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isSyncInView, frames.length, loopStartIndex]);

  const frameA = frames[tick];
  const frameB = frames[Math.max(0, tick - 6)];

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

// --- DUMMY CURSOR COMPONENT ---
const DummyCursor = ({ x, y, name, color, offsetX, offsetY, zoom }: any) => (
  <div
    className="absolute pointer-events-none z-30 flex flex-col items-start transition-transform duration-75"
    style={{
      transform: `translate(${offsetX + x * zoom}px, ${offsetY + y * zoom}px)`,
    }}
  >
    <svg
      width="24"
      height="36"
      viewBox="0 0 24 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.65376 21.1573L2.2471 2.24614C1.98638 0.800045 3.39956 -0.274154 4.6868 0.392686L22.2577 9.49753C23.6305 10.2091 23.5042 12.2227 22.0396 12.7538L14.4947 15.4897C14.1206 15.6253 13.8202 15.9038 13.6559 16.2711L10.3705 23.6212C9.70425 25.1119 7.60098 24.8988 7.21855 23.3323L5.65376 21.1573Z"
        fill={color}
        stroke="white"
        strokeWidth="2"
      />
    </svg>
    <div
      className="text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md ml-4 -mt-2"
      style={{ backgroundColor: color }}
    >
      {name}
    </div>
  </div>
);

export const Home = () => {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    username,
    logout,
    setElements,
    zoom,
    setZoom,
    undo,
    redo,
    clearBoard,
    currentTool,
    setTool,
    setColor,
    strokeWidth,
    setWidth,
    offsetX,
    offsetY,
  } = useBoardStore();

  const handleCtaClick = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_SERVER_URL || "http://localhost:3001"}/auth/logout`,
        { method: "POST", credentials: "include" },
      );
    } catch (error) {
      console.error("Logout failed:", error);
    }
    logout();
    navigate("/");
  };

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  // --- DEMO BOARD STATE ---
  const [isEditorMode, setIsEditorMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dummy Participants Logic
  const [dummyParticipants, setDummyParticipants] = useState([
    {
      id: "1",
      username: "NotARobot",
      isOwner: false,
      canEdit: true,
      color: "from-blue-500 to-purple-600",
    },
    {
      id: "2",
      username: "VeryRealHuman",
      isOwner: false,
      canEdit: false,
      color: "from-green-500 to-teal-600",
    },
  ]);

  const allParticipants = [
    {
      id: "me",
      username: `${username || "Guest"} (You)`,
      isOwner: true,
      canEdit: true,
      color: "from-yellow-500 to-orange-600",
    },
    ...dummyParticipants,
  ];

  const handleTogglePerms = (
    userId: string,
    currentStatus: boolean,
    name: string,
  ) => {
    setDummyParticipants((prev) =>
      prev.map((p) =>
        p.id === userId ? { ...p, canEdit: !currentStatus } : p,
      ),
    );
    if (currentStatus) {
      toast.error(`${name}'s edit access was revoked.`, {
        style: {
          background: "#7f1d1d",
          color: "#fff",
          border: "1px solid #991b1b",
        },
      });
    } else {
      toast.success(`${name} has been granted edit access!`, {
        style: {
          background: "#065f46",
          color: "#fff",
          border: "1px solid #047857",
        },
      });
    }
  };

  // Zoom Logic
  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.4));
  const handleZoomReset = () => setZoom(1);

  // Hydrate Data on Mount
  useEffect(() => {
    setElements(demoElements, false);
    setTool("pen");
    return () => setElements([], false);
  }, [setElements, setTool]);

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
          {isAuthenticated ? (
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
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
            >
              Get Started
            </button>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-16 pb-20 px-4 text-center">
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
            className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 mb-10"
          >
            {isAuthenticated
              ? "Go to your Dashboard"
              : "Start drawing — it's free"}
          </button>
        </motion.div>

        {/* --- INTERACTIVE HERO SHOWCASE --- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="relative mx-auto max-w-6xl w-full z-10 flex flex-col"
        >
          {/* CENTERED Animated Mode Selection Tabs */}
          <div className="flex justify-center w-full z-20 relative top-[1px]">
            <div className="flex bg-gray-900/80 rounded-t-xl border-t border-x border-gray-700/50 overflow-hidden shadow-2xl relative">
              <button
                onClick={() => {
                  setIsEditorMode(true);
                  setTool("pen");
                }}
                className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-colors duration-200 ${isEditorMode ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
              >
                {isEditorMode && (
                  <motion.div
                    layoutId="activeModeBg"
                    className="absolute inset-0 bg-[#0d1117]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <PenTool size={16} /> Editor Mode
                </span>
                {isEditorMode && (
                  <motion.div
                    layoutId="activeModeBorder"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>

              <button
                onClick={() => {
                  setIsEditorMode(false);
                  setTool("hand");
                }}
                className={`relative flex items-center gap-2 px-6 py-2.5 text-sm font-bold transition-colors duration-200 ${!isEditorMode ? "text-blue-400" : "text-gray-500 hover:text-gray-300"}`}
              >
                {!isEditorMode && (
                  <motion.div
                    layoutId="activeModeBg"
                    className="absolute inset-0 bg-[#0d1117]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Eye size={16} /> Viewer Mode
                </span>
                {!isEditorMode && (
                  <motion.div
                    layoutId="activeModeBorder"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 blur-[100px] rounded-full translate-y-20" />
          {/* --- NEW OUTER BEZEL --- */}
          <div className="w-full rounded-2xl border border-gray-700/50 bg-gray-900/40 p-2 sm:p-4 backdrop-blur-xl shadow-2xl">
            <div
              className="relative w-full h-[600px] rounded-xl border border-gray-800 bg-[#0d1117] shadow-inner overflow-hidden group"
              style={{
                backgroundImage: `linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)`,
                backgroundSize: `${64 * zoom}px ${64 * zoom}px`,
                backgroundPosition: `${offsetX}px ${offsetY}px`,
              }}
            >
              {/* Scoped Toaster exactly to the canvas area */}
              <Toaster
                position="bottom-left"
                containerStyle={{ position: "absolute" }}
              />

              {/* --- MENU TRIGGER & LEFT SIDEBAR --- */}
              <div
                className="absolute top-0 left-0 h-full w-8 z-40"
                onMouseEnter={() => setIsSidebarOpen(true)}
              />
              <button
                onMouseEnter={() => setIsSidebarOpen(true)}
                className={`absolute top-4 left-4 p-2 bg-gray-900/60 backdrop-blur-md text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl shadow-lg border border-gray-700/50 z-40 transition-all duration-300 ${isSidebarOpen ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}
              >
                <Menu size={16} />
              </button>

              <div
                onMouseLeave={() => setIsSidebarOpen(false)}
                className={`absolute top-4 left-4 h-fit w-56 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 z-50 overflow-hidden ${isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0"}`}
              >
                <div>
                  <div className="flex justify-between items-center p-4 border-b border-gray-700/50 bg-gray-800/30">
                    <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <img
                        src="/favicon-32x32.png"
                        alt="Logo"
                        className="w-5 h-5 rounded shadow-sm"
                      />{" "}
                      Menu
                    </h2>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      <HomeIcon size={14} />{" "}
                      <span className="font-semibold text-xs">Dashboard</span>
                    </button>

                    <div className="mt-1 pt-3 border-t border-gray-700/50">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2 block">
                        Share Workspace
                      </span>
                      <button
                        onClick={() =>
                          toast.success("Invite link copied! (Demo)", {
                            style: {
                              background: "#1f2937",
                              color: "#fff",
                              border: "1px solid #374151",
                            },
                          })
                        }
                        className="flex items-center justify-between w-full p-2.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            <Copy size={12} />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="font-semibold text-xs">
                              Copy Room ID
                            </span>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          toast.success("Invite link copied! (Demo)", {
                            style: {
                              background: "#1f2937",
                              color: "#fff",
                              border: "1px solid #374151",
                            },
                          })
                        }
                        className="flex items-center gap-2 w-full p-2.5 mt-0.5 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                      >
                        <div className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <Link size={12} />
                        </div>
                        <span className="font-semibold text-xs">
                          Copy Invite Link
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-gray-700/50 bg-gray-900/20">
                  <button
                    onClick={() =>
                      toast.success("Exited demo room!", {
                        style: {
                          background: "#1f2937",
                          color: "#fff",
                          border: "1px solid #374151",
                        },
                      })
                    }
                    className="flex items-center gap-2 w-full p-2.5 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                  >
                    <span className="font-semibold text-xs">Exit Room</span>
                  </button>
                </div>
              </div>

              {/* SCALED DOWN Replica Toolbar */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-gray-900/80 backdrop-blur-md p-1.5 rounded-xl shadow-2xl border border-gray-700 z-40 transition-all duration-300">
                <div className="flex gap-1 border-r border-gray-700 pr-3">
                  <button
                    onClick={() => setTool("hand")}
                    className={`relative p-2 rounded-lg transition-colors ${currentTool === "hand" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                  >
                    <Hand size={14} />
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                      1
                    </span>
                  </button>

                  {isEditorMode && (
                    <>
                      <button
                        onClick={() => setTool("pen")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "pen" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Pen size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          2
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("eraser")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "eraser" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Eraser size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          3
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("rect")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Square size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          4
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("circle")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "circle" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Circle size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          5
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("line")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "line" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Minus size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          6
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("text")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "text" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Type size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          7
                        </span>
                      </button>
                      <button
                        onClick={() => setTool("laser")}
                        className={`relative p-2 rounded-lg transition-colors ${currentTool === "laser" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                      >
                        <Wand2 size={14} />
                        <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-bold opacity-60">
                          8
                        </span>
                      </button>
                    </>
                  )}
                </div>

                {isEditorMode ? (
                  <>
                    <div className="flex items-center gap-2 border-r border-gray-700 pr-3">
                      <input
                        type="color"
                        onChange={(e) => setColor(e.target.value)}
                        defaultValue="#ffffff"
                        className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0 p-0"
                      />
                    </div>
                    <div className="flex items-center gap-3 border-r border-gray-700 pr-3 pl-1">
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300"
                        style={{ transform: `scale(${strokeWidth / 10})` }}
                      ></div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={strokeWidth}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        className="w-20 accent-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-1 pl-1">
                      <button
                        onClick={() => undo(socket.id as string)}
                        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Undo size={14} />
                      </button>
                      <button
                        onClick={() => redo()}
                        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        <Redo size={14} />
                      </button>
                      <button
                        onClick={() => clearBoard()}
                        className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-3 text-gray-400 text-xs font-semibold">
                    <Eye size={14} className="text-blue-400" /> Viewing Mode
                  </div>
                )}
              </div>

              {/* SCALED DOWN Participants Tile */}
              <div className="absolute top-4 right-4 w-56 bg-gray-900/85 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col z-40 text-left">
                <div className="flex items-center justify-between p-3 border-b border-gray-700/50 bg-gray-800/30">
                  <h3 className="text-gray-300 text-xs font-bold flex items-center gap-2">
                    <Users size={14} className="text-blue-400" /> Participants
                    <span className="bg-blue-600 text-white text-[10px] px-1.5 py-[1px] rounded-full ml-1">
                      3
                    </span>
                  </h3>
                </div>
                <ul className="flex flex-col gap-2 p-3">
                  {allParticipants.map((user) => (
                    <li
                      key={user.id}
                      className="flex flex-col gap-2 text-white bg-gray-800/40 p-2.5 rounded-xl border border-gray-700/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shadow-inner border border-white/10 bg-gradient-to-br ${user.color}`}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium truncate text-gray-200">
                            {user.username}
                          </span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1 mt-0.5">
                            {user.isOwner ? (
                              <>
                                <Shield size={8} className="text-yellow-500" />{" "}
                                Owner
                              </>
                            ) : user.canEdit ? (
                              <>
                                <Pen size={8} className="text-blue-400" />{" "}
                                Editor
                              </>
                            ) : (
                              <>
                                <Eye size={8} className="text-gray-400" />{" "}
                                Viewer
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                      {!user.isOwner && (
                        <div className="flex mt-1.5 pt-1.5 border-t border-gray-700/50">
                          <button
                            onClick={() =>
                              handleTogglePerms(
                                user.id,
                                user.canEdit,
                                user.username,
                              )
                            }
                            className={`flex-1 flex items-center justify-center py-1 text-[9px] font-bold rounded transition-colors uppercase tracking-wider ${user.canEdit ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}
                          >
                            {user.canEdit ? "Revoke Access" : "Allow Editing"}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* SCALED DOWN Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex items-center bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-40 text-gray-400">
                <button
                  onClick={handleZoomOut}
                  className="p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <ZoomOut size={14} />
                </button>
                <span className="px-1 font-mono text-[10px] w-10 text-center select-none text-gray-300">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <ZoomIn size={14} />
                </button>
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <button
                  onClick={handleZoomReset}
                  className="p-2.5 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Maximize size={12} />
                </button>
              </div>

              {/* Static Dummy Cursors mapped to world coordinates */}
              <DummyCursor
                x={220}
                y={150}
                name="NotARobot"
                color="#3B82F6"
                offsetX={offsetX}
                offsetY={offsetY}
                zoom={zoom}
              />
              <DummyCursor
                x={480}
                y={280}
                name="VeryRealHuman"
                color="#10B981"
                offsetX={offsetX}
                offsetY={offsetY}
                zoom={zoom}
              />

              {/* The Isolated Sandbox Engine */}
              <Canvas isDemo={true} demoCanEdit={isEditorMode} />
            </div>
          </div>
        </motion.div>
      </main>

      {/* --- FEATURE SHOWCASE --- */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-32 mt-12">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-800 to-transparent -translate-x-1/2 hidden md:block" />

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-32 relative"
        >
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

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-32 relative text-center"
        >
          <HomeToolbar />
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
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
            <img
              src="/canvasActions.png"
              alt="History"
              className="w-full rounded-xl border border-gray-800"
            />
          </div>
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center mb-32 relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
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

        <motion.div
          variants={fadeUpVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-12 items-center relative bg-[#0d1117]"
        >
          <div className="rounded-2xl border border-gray-700 bg-gray-900/40 p-2 backdrop-blur-xl shadow-2xl">
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
