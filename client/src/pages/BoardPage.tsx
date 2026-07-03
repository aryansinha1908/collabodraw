import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { useBoardStore } from "../store";
import { socket } from "../socket";
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Undo,
  Redo,
  Trash2,
  LogOut,
  Menu,
  X,
  Home,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  Download,
} from "lucide-react";

export const BoardPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const {
    currentTool,
    setTool,
    setColor,
    strokeWidth,
    setWidth,
    undo,
    redo,
    clearBoard,
    remoteUndo,
    remoteRedo,
    remoteClear,
    token,
    logout,
    zoom,
    setZoom,
    roomUsers,
    setRoomUsers,
    offsetX, // Extracted panning offsets from the store
    offsetY,
  } = useBoardStore();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    socket.auth = { token };
    socket.connect();

    socket.on("connect", () => socket.emit("join-room", roomId));

    socket.on("join-error", (msg) => {
      alert(msg);
      navigate("/dashboard");
    });
    socket.on("board-state", (loadedElements) =>
      useBoardStore.getState().setElements(loadedElements, false),
    );

    socket.on("room-users", (users) => setRoomUsers(users));

    socket.on("undo", (userId) => remoteUndo(userId));
    socket.on("redo", remoteRedo);
    socket.on("clear-board", remoteClear);

    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("join-error");
      socket.off("board-state");
      socket.off("room-users");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear-board");
    };
  }, [
    roomId,
    token,
    navigate,
    remoteUndo,
    remoteRedo,
    remoteClear,
    setRoomUsers,
  ]);

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.4));
  const handleZoomReset = () => setZoom(1);

  const handleExport = (format: "png" | "jpg" | "pdf") => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Updated background fill color to perfectly match the new #0d1117 dark theme
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const filename = `CollaboDraw-${roomId}`;

    if (format === "png" || format === "jpg") {
      const mimeType = format === "png" ? "image/png" : "image/jpeg";
      const dataUrl = tempCanvas.toDataURL(mimeType, 1.0);
      const link = document.createElement("a");
      link.download = `${filename}.${format}`;
      link.href = dataUrl;
      link.click();
    } else if (format === "pdf") {
      const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);

      const pdf = new jsPDF({
        orientation:
          tempCanvas.width > tempCanvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [tempCanvas.width, tempCanvas.height],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, tempCanvas.width, tempCanvas.height);
      pdf.save(`${filename}.pdf`);
    }

    setIsExportMenuOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo(socket.id as string);
          socket.emit("undo", { roomId, userId: socket.id });
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
          socket.emit("redo", roomId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomId, undo, redo]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-[#0d1117] font-sans"
      style={{
        // Dynamically binds the grid position and scale to the global canvas pan/zoom state
        backgroundImage: `linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)`,
        backgroundSize: `${64 * zoom}px ${64 * zoom}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    >
      {/* Invisible Hover Trigger Zone */}
      <div
        className="absolute top-0 left-0 h-full w-6 z-40"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Menu Toggle Button (Fades out when sidebar opens) */}
      <button
        onMouseEnter={() => setIsSidebarOpen(true)}
        className={`absolute top-4 left-4 p-3 bg-gray-900/80 backdrop-blur-md text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl shadow-lg border border-gray-700 z-40 transition-all duration-300 ${
          isSidebarOpen
            ? "opacity-0 pointer-events-none scale-90"
            : "opacity-100 scale-100"
        }`}
      >
        <Menu size={24} />
      </button>

      {/* --- LEFT SIDEBAR (Floating & Hover-Responsive) --- */}
      {/* Invisible Hover Trigger Zone */}
      <div
        className="absolute top-0 left-0 h-full w-8 z-40"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />

      {/* Menu Toggle Button (Fades out when sidebar opens) */}
      <button
        onMouseEnter={() => setIsSidebarOpen(true)}
        className={`absolute top-4 left-4 p-3 bg-gray-900/60 backdrop-blur-md text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl shadow-lg border border-gray-700/50 z-40 transition-all duration-300 ${
          isSidebarOpen
            ? "opacity-0 pointer-events-none scale-90"
            : "opacity-100 scale-100"
        }`}
      >
        <Menu size={24} />
      </button>

      {/* --- LEFT SIDEBAR (Floating, Glassmorphism, Hover-Responsive) --- */}
      <div
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`absolute top-4 left-4 h-[calc(100vh-2rem)] w-64 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col justify-between transform transition-all duration-300 z-50 overflow-hidden ${
          isSidebarOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-[120%] opacity-0"
        }`}
      >
        <div>
          <div className="flex justify-between items-center p-6 border-b border-gray-700/50 bg-gray-900/20">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <img
                src="/favicon-32x32.png"
                alt="Logo"
                className="w-7 h-7 rounded shadow-sm"
              />
              Menu
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Home size={18} />{" "}
              <span className="font-semibold text-sm">Dashboard</span>
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/20">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} />{" "}
            <span className="font-semibold text-sm">Exit Room</span>
          </button>
        </div>
      </div>

      {/* --- TOP TOOLBAR (Drawing Controls) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-2.5 rounded-xl shadow-2xl border border-gray-700 z-10">
        <div className="flex gap-1.5 border-r border-gray-700 pr-4">
          <button
            onClick={() => setTool("hand")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "hand" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Pan Tool"
          >
            <Hand size={18} />
          </button>
          <button
            onClick={() => setTool("pen")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "pen" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Pen"
          >
            <Pen size={18} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "eraser" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Eraser"
          >
            <Eraser size={18} />
          </button>
          <button
            onClick={() => setTool("rect")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Rectangle"
          >
            <Square size={18} />
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "circle" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Circle"
          >
            <Circle size={18} />
          </button>
          <button
            onClick={() => setTool("line")}
            className={`p-2.5 rounded-lg transition-colors ${currentTool === "line" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Line"
          >
            <Minus size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-r border-gray-700 pr-4">
          <input
            type="color"
            onChange={(e) => setColor(e.target.value)}
            defaultValue="#ffffff"
            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
          />
        </div>

        <div className="flex items-center gap-4 border-r border-gray-700 pr-4 pl-2">
          <div
            className="w-3 h-3 rounded-full bg-gray-300"
            style={{ transform: `scale(${strokeWidth / 10})` }}
          ></div>
          <input
            type="range"
            min="1"
            max="30"
            value={strokeWidth}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex gap-1.5 pl-1">
          <button
            onClick={() => {
              undo(socket.id as string);
              socket.emit("undo", { roomId, userId: socket.id });
            }}
            className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            title="Undo"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => {
              redo();
              socket.emit("redo", roomId);
            }}
            className="p-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
            title="Redo"
          >
            <Redo size={18} />
          </button>
          <button
            onClick={() => {
              clearBoard();
              socket.emit("clear-board", roomId);
            }}
            className="p-2.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Clear Board"
          >
            <Trash2 size={18} />
          </button>

          <div className="w-px h-8 bg-gray-700 mx-2 self-center"></div>

          <div className="relative flex items-center">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`p-2.5 rounded-lg transition-colors ${isExportMenuOpen ? "bg-gray-800 text-green-400" : "text-gray-400 hover:text-green-400 hover:bg-gray-800"}`}
              title="Export Options"
            >
              <Download size={18} />
            </button>

            {isExportMenuOpen && (
              <div className="absolute top-full mt-4 right-0 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 min-w-[160px] backdrop-blur-xl">
                <button
                  onClick={() => handleExport("png")}
                  className="px-4 py-3 text-sm font-medium text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                >
                  Export as PNG
                </button>
                <button
                  onClick={() => handleExport("jpg")}
                  className="px-4 py-3 text-sm font-medium text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors border-b border-gray-800"
                >
                  Export as JPG
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="px-4 py-3 text-sm font-medium text-left text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL (Users List) --- */}
      <div className="absolute top-4 right-4 w-48 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl p-4 z-40">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3 pb-3 border-b border-gray-800 flex items-center justify-between">
          <span>Participants</span>
          <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
            {roomUsers.length}
          </span>
        </h3>
        <ul className="flex flex-col gap-3">
          {roomUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-3 text-white">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-xs shadow-inner border border-white/10">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium truncate text-gray-200">
                {user.username}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* --- BOTTOM RIGHT (Zoom Controls) --- */}
      <div className="absolute bottom-6 right-6 flex items-center bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-40 text-gray-400">
        <button
          onClick={handleZoomOut}
          className="p-3 hover:bg-gray-800 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
        <span className="px-2 font-mono text-xs w-14 text-center select-none text-gray-300">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-3 hover:bg-gray-800 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>
        <div className="w-px h-6 bg-gray-700 mx-1"></div>
        <button
          onClick={handleZoomReset}
          className="p-3 hover:bg-gray-800 hover:text-white transition-colors"
          title="Reset Zoom"
        >
          <Maximize size={16} />
        </button>
      </div>

      {/* --- DRAWING AREA --- */}
      <Canvas />
    </div>
  );
};
