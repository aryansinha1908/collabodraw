import { useEffect } from "react";
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
  ArrowLeft,
} from "lucide-react";

export const BoardPage = () => {
  const { roomId } = useParams(); // Get room ID from the URL
  const navigate = useNavigate();
  const {
    currentTool,
    setTool,
    setColor,
    undo,
    redo,
    clearBoard,
    remoteUndo,
    remoteRedo,
    remoteClear,
    setWidth,
    strokeWidth,
    token,
    username,
    logout,
  } = useBoardStore();

  useEffect(() => {
    if (!token) {
      navigate("/auth");
      return;
    }

    socket.auth = { token };
    socket.connect();

    socket.on("connect", () => {
      console.log("Connected, joining room:", roomId);
      socket.emit("join-room", roomId);
    });

    const handleReconnect = () => socket.emit("join-room", roomId);
    socket.on("connect", handleReconnect);

    socket.on("connect_error", (err) => {
      if (err.message.includes("Authentication error")) {
        logout();
        navigate("/auth");
      }
    });

    socket.on("board-state", (loadedElements) => {
      useBoardStore.getState().setElements(loadedElements, false);
    });

    socket.on("undo", remoteUndo);
    socket.on("redo", remoteRedo);
    socket.on("clear-board", remoteClear);

    // Handle specific join rejections from the server
    socket.on("join-error", (errorMessage) => {
      alert(errorMessage); // Show the user why they were rejected
      navigate("/"); // Kick them back to the dashboard
    });

    return () => {
      socket.disconnect();
      socket.off("connect");
      socket.off("connect_error");
      socket.off("board-state");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear-board");
      socket.off("join-error");
    };
  }, [roomId, token, navigate, logout, remoteUndo, remoteRedo, remoteClear]);

  const handleUndo = () => {
    undo();
    socket.emit("undo", roomId);
  };
  const handleRedo = () => {
    redo();
    socket.emit("redo", roomId);
  };
  const handleClear = () => {
    clearBoard();
    socket.emit("clear-board", roomId);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700 z-10">
        {/* Home Button */}
        <div className="flex gap-2 border-r border-gray-600 pr-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
            title="Back to Home"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        <div className="flex gap-2 border-r border-gray-600 pr-4">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg ${currentTool === "pen" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg ${currentTool === "eraser" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
          >
            <Eraser size={20} />
          </button>
          <button
            onClick={() => setTool("rect")}
            className={`p-2 rounded-lg ${currentTool === "rect" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
          >
            <Square size={20} />
          </button>
          <button
            onClick={() => setTool("circle")}
            className={`p-2 rounded-lg ${currentTool === "circle" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
          >
            <Circle size={20} />
          </button>
          <button
            onClick={() => setTool("line")}
            className={`p-2 rounded-lg ${currentTool === "line" ? "bg-blue-500" : "hover:bg-gray-700"} text-white`}
          >
            <Minus size={20} />
          </button>
        </div>

        <div className="flex gap-2 border-r border-gray-600 pr-4">
          <input
            type="color"
            onChange={(e) => setColor(e.target.value)}
            defaultValue="#ffffff"
            className="w-8 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>

        <div className="flex items-center gap-3 border-r border-gray-600 pr-4">
          <div
            className="w-4 h-4 rounded-full bg-gray-400"
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

        <div className="flex gap-2 border-r border-gray-600 pr-4">
          <button
            onClick={handleUndo}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Redo size={20} />
          </button>
          <button
            onClick={handleClear}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-2">
          <span className="text-sm font-semibold text-gray-300 bg-gray-700 px-3 py-1 rounded-full">
            {username}
          </span>
          <button
            onClick={handleLogout}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <Canvas />
    </div>
  );
};
