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

    // Listen for the live roster updates
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

    // Fill background (Crucial for JPG and PDF, otherwise transparent pixels turn black!)
    ctx.fillStyle = "#111827";
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
      // Grab the image as a high-quality JPEG to embed in the PDF
      const imgData = tempCanvas.toDataURL("image/jpeg", 1.0);

      // Create a PDF with the exact dimensions of our canvas
      const pdf = new jsPDF({
        orientation:
          tempCanvas.width > tempCanvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [tempCanvas.width, tempCanvas.height],
      });

      pdf.addImage(imgData, "JPEG", 0, 0, tempCanvas.width, tempCanvas.height);
      pdf.save(`${filename}.pdf`);
    }

    // Close the menu after exporting
    setIsExportMenuOpen(false);
  };

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl (Windows) or Cmd (Mac)
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo(socket.id as string);
          socket.emit("undo", { roomId, userId: socket.id });
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          // Supports Ctrl+Y and Ctrl+Shift+Z
          e.preventDefault();
          redo();
          socket.emit("redo", roomId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [roomId, undo, redo]); // Make sure you added 'undo' and 'redo' to your destructuring from useBoardStore!

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900 font-sans">
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-4 left-4 p-3 bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 rounded-xl shadow-lg border border-gray-700 z-40 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* --- LEFT SIDEBAR --- */}
      <div
        className={`absolute top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 z-50 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              Menu
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <Home size={20} />{" "}
              <span className="font-semibold">Dashboard</span>
            </button>
          </div>
        </div>
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />{" "}
            <span className="font-semibold">Exit Room</span>
          </button>
        </div>
      </div>

      {/* --- TOP TOOLBAR (Drawing Controls) --- */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700 z-10">
        <div className="flex gap-2 border-r border-gray-600 pr-4">
          <button
            onClick={() => setTool("hand")}
            className={`p-2 rounded-lg ${currentTool === "hand" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Pan Tool"
          >
            <Hand size={20} />
          </button>
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg ${currentTool === "pen" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Pen"
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg ${currentTool === "eraser" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setTool("rect")}
            className={`p-2 rounded-lg ${currentTool === "rect" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Rectangle"
          >
            <Square size={20} />
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-2 rounded-lg ${currentTool === "circle" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Circle"
          >
            <Circle size={20} />
          </button>
          <button
            onClick={() => setTool("line")}
            className={`p-2 rounded-lg ${currentTool === "line" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
            title="Line"
          >
            <Minus size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-r border-gray-600 pr-4">
          <input
            type="color"
            onChange={(e) => setColor(e.target.value)}
            defaultValue="#ffffff"
            className="w-8 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>

        <div className="flex items-center gap-3 border-r border-gray-600 pr-4">
          <div
            className="w-3 h-3 rounded-full bg-gray-400"
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

        <div className="flex gap-2">
          <button
            onClick={() => {
              undo(socket.id as string);
              socket.emit("undo", { roomId, userId: socket.id });
            }}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Undo"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={() => {
              redo();
              socket.emit("redo", roomId);
            }}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Redo size={20} />
          </button>
          <button
            onClick={() => {
              clearBoard();
              socket.emit("clear-board", roomId);
            }}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg"
          >
            <Trash2 size={20} />
          </button>

          {/* Vertical Divider */}
          <div className="w-px h-8 bg-gray-600 mx-1 self-center"></div>

          <div className="relative flex items-center">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${isExportMenuOpen ? "bg-gray-700 text-green-300" : "text-green-400 hover:text-green-300 hover:bg-gray-700"}`}
              title="Export Options"
            >
              <Download size={20} />
            </button>

            {/* The Floating Menu */}
            {isExportMenuOpen && (
              <div className="absolute top-full mt-3 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 min-w-[140px]">
                <button
                  onClick={() => handleExport("png")}
                  className="px-4 py-3 text-sm font-semibold text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700"
                >
                  Export as PNG
                </button>
                <button
                  onClick={() => handleExport("jpg")}
                  className="px-4 py-3 text-sm font-semibold text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors border-b border-gray-700"
                >
                  Export as JPG
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="px-4 py-3 text-sm font-semibold text-left text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- RIGHT PANEL (Users List) --- */}
      <div className="absolute top-4 right-4 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg p-4 z-40">
        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-3 pb-2 border-b border-gray-700 flex items-center justify-between">
          <span>Users in Room</span>
          <span className="bg-blue-500/20 text-blue-400 text-s px-2 py-0.5 rounded-full">
            {roomUsers.length}
          </span>
        </h3>
        <ul className="flex flex-col gap-3">
          {roomUsers.map((user) => (
            <li key={user.id} className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold truncate">
                {user.username}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* --- BOTTOM RIGHT (Zoom Controls) --- */}
      <div className="absolute bottom-6 right-6 flex items-center bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-40 text-gray-300">
        <button
          onClick={handleZoomOut}
          className="p-3 hover:bg-gray-700 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>
        <span className="px-3 font-mono text-sm w-16 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-3 hover:bg-gray-700 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>
        <div className="w-px h-6 bg-gray-600 mx-1"></div>
        <button
          onClick={handleZoomReset}
          className="p-3 hover:bg-gray-700 hover:text-white transition-colors"
          title="Reset Zoom"
        >
          <Maximize size={18} />
        </button>
      </div>

      {/* --- DRAWING AREA --- */}
      <Canvas />
    </div>
  );
};
