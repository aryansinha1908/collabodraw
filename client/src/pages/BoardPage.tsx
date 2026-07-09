import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Canvas } from "../components/Canvas";
import { useBoardStore } from "../store";
import { socket } from "../socket";
import toast, { Toaster } from "react-hot-toast";
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Undo,
  Redo,
  Trash2,
  Menu,
  Home,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand,
  Download,
  Eye,
  Shield,
  Copy,
  Link,
  Type,
  Focus,
  Send,
  MessageSquare,
  Users,
} from "lucide-react";

// --- NEW CHAT BUBBLE COMPONENT ---
const ChatMessageItem = ({ msg, isMe }: { msg: any; isMe: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const CHAR_LIMIT = 200; // Truncate after 200 characters

  const isLong = msg.text.length > CHAR_LIMIT;
  const displayText =
    isLong && !isExpanded ? `${msg.text.slice(0, CHAR_LIMIT)}...` : msg.text;

  return (
    <div
      className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
    >
      <span className="text-[10px] text-gray-500 mb-1 px-1">
        {isMe ? "You" : msg.username} •{" "}
        {new Date(msg.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <div
        className={`px-3 py-2 rounded-2xl text-sm shadow-sm break-words whitespace-pre-wrap ${
          isMe
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm"
        }`}
      >
        {displayText}
        {isLong && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`block mt-1.5 text-[11px] font-bold tracking-wide hover:underline ${
              isMe ? "text-blue-200" : "text-blue-400"
            }`}
          >
            {isExpanded ? "Read less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
};

export const BoardPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"participants" | "chat">(
    "participants",
  );

  const {
    currentTool,
    setTool,
    setColor,
    strokeWidth,
    setWidth,
    isZenMode,
    undo,
    redo,
    clearBoard,
    remoteUndo,
    remoteRedo,
    remoteClear,
    toggleZenMode,
    isAuthenticated,
    zoom,
    setZoom,
    roomUsers,
    setRoomUsers,
    offsetX,
    offsetY,
    messages,
    addMessage,
    hasUnread,
    setHasUnread,
    username,
  } = useBoardStore();

  // Determine current user's permissions
  const me = roomUsers.find((u: any) => u.id === socket.id);
  const amIOwner = me?.isOwner || false;
  const canIEdit = me?.isOwner || me?.canEdit || false;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    let connectToastId: string;

    socket.on("connect_error", (err) => {
      toast.error(`Connection failed: ${err.message}`, {
        id: connectToastId,
        style: {
          background: "#7f1d1d",
          color: "#fff",
          border: "1px solid #991b1b",
        },
      });
    });

    socket.on("connect", () => {
      socket.emit("join-room", roomId);
    });

    // --- NEW APPROVAL HANDSHAKE EVENTS ---
    socket.on("waiting-approval", () => {
      toast.loading("Waiting for owner approval...", {
        id: connectToastId,
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
    });

    socket.on("join-approved", () => {
      toast.success("Joined real-time workspace", {
        id: connectToastId,
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
    });

    socket.on("join-request", ({ socketId, username, roomId: reqRoomId }) => {
      toast(
        (t) => (
          <div className="flex flex-col gap-3">
            <span className="font-semibold text-sm">
              {username} wants to join your private board.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  socket.emit("approve-join", {
                    targetSocketId: socketId,
                    roomId: reqRoomId,
                  });
                  toast.dismiss(t.id);
                }}
                className="bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded text-xs font-bold text-white transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  socket.emit("reject-join", { targetSocketId: socketId });
                  toast.dismiss(t.id);
                }}
                className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded text-xs font-bold text-white transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ),
        {
          duration: Infinity,
          style: {
            background: "#1f2937",
            color: "#fff",
            border: "1px solid #374151",
          },
        },
      );
    });

    socket.on("permission-changed", (newCanEdit) => {
      if (newCanEdit) {
        toast.success("You have been granted edit access!", {
          icon: "✏️",
          style: {
            background: "#065f46",
            color: "#fff",
            border: "1px solid #047857",
          },
        });
      } else {
        toast.error("Your edit access was revoked.", {
          icon: "🔒",
          style: {
            background: "#7f1d1d",
            color: "#fff",
            border: "1px solid #991b1b",
          },
        });
        setTool("hand"); // Force back to hand tool if revoked!
      }
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") socket.connect();
      toast.error("Disconnected. Trying to reconnect...", {
        id: "disconnect-toast",
        duration: 4000,
        style: {
          background: "#7f1d1d",
          color: "#fff",
          border: "1px solid #991b1b",
        },
      });
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      toast.loading(`Reconnecting... (Attempt ${attempt})`, {
        id: "reconnect-toast",
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
    });

    socket.io.on("reconnect", () => {
      toast.success("Reconnected successfully!", {
        id: "reconnect-toast",
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
    });

    socket.on("join-error", (msg) => {
      toast.error(msg);
      navigate("/dashboard");
    });

    socket.on("owner-disconnected", () => {
      toast("The board owner has disconnected.", {
        icon: "👑",
        duration: 5000,
        style: {
          background: "#7f1d1d",
          color: "#fff",
          border: "1px solid #991b1b",
        },
      });
    });

    socket.on("owner-connected", () => {
      toast("The board owner has joined the room.", {
        icon: "👑",
        duration: 5000,
        style: {
          background: "#065f46",
          color: "#fff",
          border: "1px solid #047857",
        },
      });
    });

    socket.on("board-state", (loadedElements) =>
      useBoardStore.getState().setElements(loadedElements, false),
    );
    socket.on("board-messages", (loadedMessages) => {
      useBoardStore.getState().setMessages(loadedMessages);
    });
    socket.on("room-users", (users) => setRoomUsers(users));
    socket.on("undo", (userId) => remoteUndo(userId));
    socket.on("redo", remoteRedo);
    socket.on("clear-board", remoteClear);

    socket.on("receive-message", (message: any) => {
      addMessage(message);
      if (!useBoardStore.getState().isChatOpen) {
        useBoardStore.getState().setHasUnread(true);
      }
    });

    if (!socket.connected) {
      connectToastId = toast.loading("Connecting to workspace...", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
      socket.connect();
    } else {
      connectToastId = toast.loading("Joining workspace...", {
        style: {
          background: "#1f2937",
          color: "#fff",
          border: "1px solid #374151",
        },
      });
      socket.emit("join-room", roomId);
    }

    return () => {
      if (connectToastId) toast.dismiss(connectToastId);
      socket.disconnect();
      socket.off("connect");
      socket.off("connect_error");
      socket.off("disconnect");
      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect");
      socket.off("join-error");
      socket.off("owner-disconnected");
      socket.off("owner-connected");
      socket.off("waiting-approval");
      socket.off("join-approved");
      socket.off("join-request");
      socket.off("permission-changed");
      socket.off("board-state");
      socket.off("board-messages");
      socket.off("room-users");
      socket.off("undo");
      socket.off("redo");
      socket.off("clear-board");
      socket.off("receive-message");
    };
  }, [
    roomId,
    navigate,
    remoteUndo,
    remoteRedo,
    remoteClear,
    setRoomUsers,
    setTool,
  ]);

  // Clear unread notification when switching to the chat tab
  useEffect(() => {
    if (rightPanelTab === "chat") {
      setHasUnread(false);
    }
  }, [rightPanelTab, messages, setHasUnread]);

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

  // --- NEW: Sharing Handlers ---
  const handleCopyLink = () => {
    const url = `${window.location.origin}/board/${roomId}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!", {
      style: {
        background: "#1f2937",
        color: "#fff",
        border: "1px solid #374151",
      },
    });
    setIsSidebarOpen(false); // Close sidebar automatically after copying
  };

  const handleCopyId = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    toast.success("Room ID copied!", {
      style: {
        background: "#1f2937",
        color: "#fff",
        border: "1px solid #374151",
      },
    });
    setIsSidebarOpen(false); // Close sidebar automatically after copying
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Safety Check: Don't trigger shortcuts if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // 2. Zoom Controls (+, =, -)
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom(Math.min(useBoardStore.getState().zoom + 0.1, 3));
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom(Math.max(useBoardStore.getState().zoom - 0.1, 0.1));
      }
      if (e.key.toLowerCase() === "z" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        useBoardStore.getState().toggleZenMode();
      }

      // 3. Tool Selection (1-6)
      const toolsMap: Record<string, any> = {
        "1": "hand",
        "2": "pen",
        "3": "eraser",
        "4": "rect",
        "5": "circle",
        "6": "line",
        "7": "text",
      };

      if (toolsMap[e.key]) {
        // Prevent default so browser doesn't do weird things
        e.preventDefault();

        const requestedTool = toolsMap[e.key];

        // Security check: Viewers can ONLY select the hand tool (1)
        if (requestedTool !== "hand" && !canIEdit) {
          return;
        }

        setTool(requestedTool);
      }

      // 4. Undo/Redo Logic (Existing)
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
  }, [roomId, undo, redo, setTool, setZoom, canIEdit]); // <-- Updated dependencies!

  // Auto-scroll to bottom when new messages arrive (Safely!)
  useEffect(() => {
    if (rightPanelTab === "chat") {
      setTimeout(() => {
        if (chatScrollRef.current) {
          // This safely scrolls ONLY the internal div, never the page!
          chatScrollRef.current.scrollTo({
            top: chatScrollRef.current.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
    }
  }, [messages, rightPanelTab]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedText = chatInput.replace(
      /[\s\u200B-\u200F\u2028-\u202F\u205F-\u206F\u2800\u3164\uFFA0]/g,
      "",
    );

    if (sanitizedText.length === 0) return;

    const newMessage = {
      id: uuidv4(),
      userId: socket.id as string,
      username: username || "Anonymous",
      text: chatInput.trim(),
      timestamp: Date.now(),
    };

    // 1. Update local UI
    addMessage(newMessage);
    // 2. Broadcast to room
    socket.emit("send-message", { roomId, message: newMessage });
    // 3. Clear input
    setChatInput("");
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-[#0d1117] font-sans"
      style={{
        backgroundImage: `linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)`,
        backgroundSize: `${64 * zoom}px ${64 * zoom}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
      }}
    >
      <Toaster position="bottom-left" />

      {/* --- MENU TRIGGER --- */}
      <div
        className="absolute top-0 left-0 h-full w-8 z-40"
        onMouseEnter={() => setIsSidebarOpen(true)}
      />
      <button
        onMouseEnter={() => setIsSidebarOpen(true)}
        className={`absolute top-4 left-4 p-3 bg-gray-900/60 backdrop-blur-md text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl shadow-lg border border-gray-700/50 z-40 transition-all duration-300 ${isSidebarOpen || isZenMode ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}
      >
        <Menu size={24} />
      </button>

      {/* --- LEFT SIDEBAR --- */}
      <div
        onMouseLeave={() => setIsSidebarOpen(false)}
        className={`absolute top-4 left-4 h-fit w-64 bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 z-50 overflow-hidden ${isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-[120%] opacity-0"}`}
      >
        <div>
          <div className="flex justify-between items-center p-6 border-b border-gray-700/50 bg-gray-900/20">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
              <img
                src="/favicon-32x32.png"
                alt="Logo"
                className="w-7 h-7 rounded shadow-sm"
              />{" "}
              Menu
            </h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <Home size={18} />{" "}
              <span className="font-semibold text-sm">Dashboard</span>
            </button>

            {/* --- NEW: Share Section --- */}
            <div className="mt-2 pt-4 border-t border-gray-700/50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-3 block">
                Share Workspace
              </span>

              <button
                onClick={handleCopyId}
                className="flex items-center justify-between w-full p-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                title="Copy Room ID"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 text-blue-400 p-1.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Copy size={16} />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-sm leading-tight">
                      Copy Room ID
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono group-hover:text-gray-400 transition-colors">
                      {roomId}
                    </span>
                  </div>
                </div>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full p-3 mt-1 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition-colors group"
                title="Copy Invite Link"
              >
                <div className="bg-purple-500/10 text-purple-400 p-1.5 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <Link size={16} />
                </div>
                <span className="font-semibold text-sm">Copy Invite Link</span>
              </button>
            </div>
            {/* --------------------------- */}
          </div>
        </div>
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/20">
          <button
            onClick={() => {
              navigate("/");
            }}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <span className="font-semibold text-sm">Exit Room</span>
          </button>
        </div>
      </div>

      {/* --- TOP TOOLBAR --- */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-2.5 rounded-xl shadow-2xl border border-gray-700 z-10 transition-all duration-300 ${isZenMode ? "-translate-y-[150%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
      >
        <div className="flex gap-1.5 border-r border-gray-700 pr-4">
          <button
            onClick={() => setTool("hand")}
            className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "hand" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
            title="Pan Tool (1)"
          >
            <Hand size={18} />
            <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
              1
            </span>
          </button>

          {canIEdit && (
            <>
              <button
                onClick={() => setTool("pen")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "pen" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Pen (2)"
              >
                <Pen size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  2
                </span>
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "eraser" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Eraser (3)"
              >
                <Eraser size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  3
                </span>
              </button>
              <button
                onClick={() => setTool("rect")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "rect" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Rectangle (4)"
              >
                <Square size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  4
                </span>
              </button>
              <button
                onClick={() => setTool("circle")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "circle" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Circle (5)"
              >
                <Circle size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  5
                </span>
              </button>
              <button
                onClick={() => setTool("line")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "line" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Line (6)"
              >
                <Minus size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  6
                </span>
              </button>

              <button
                onClick={() => setTool("text")}
                className={`relative p-2.5 rounded-lg transition-colors ${currentTool === "text" ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"}`}
                title="Text (7)"
              >
                <Type size={18} />
                <span className="absolute bottom-0.5 right-1 text-[9px] font-mono font-bold opacity-60">
                  7
                </span>
              </button>
            </>
          )}
        </div>

        {canIEdit ? (
          <>
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
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 border-r border-gray-700 text-gray-400 text-sm font-semibold">
            <Eye size={18} className="text-blue-400" /> Viewing Mode
          </div>
        )}

        {canIEdit && (
          <div className="w-px h-8 bg-gray-700 mx-2 self-center"></div>
        )}

        <div className="relative flex items-center">
          <button
            onClick={toggleZenMode}
            className="p-2.5 rounded-lg transition-colors text-gray-400 hover:text-white hover:bg-gray-800"
            title="Zen Mode (Z)"
          >
            <Focus size={18} />
          </button>
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

      {/* --- FLOATING EXIT ZEN MODE BUTTON --- */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isZenMode ? "translate-y-0 opacity-100" : "-translate-y-[150%] opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={toggleZenMode}
          className="flex items-center gap-2 bg-gray-900/80 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors text-sm font-semibold tracking-wide"
        >
          <Focus size={16} /> Exit Zen Mode (Z)
        </button>
      </div>

      {/* --- UNIFIED RIGHT PANEL (Participants & Chat) --- */}
      <div
        className={`absolute top-4 right-4 w-80 bg-gray-900/85 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl flex flex-col z-40 transition-all duration-300 overflow-hidden ${isZenMode ? "translate-x-[120%] opacity-0 pointer-events-none" : "translate-x-0 opacity-100"} max-h-[50vh]`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/30 shrink-0">
          <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2">
            {rightPanelTab === "participants" ? (
              <>
                <Users size={16} className="text-blue-400" />
                Participants
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">
                  {roomUsers.length}
                </span>
              </>
            ) : (
              <>
                <MessageSquare size={16} className="text-blue-400" />
                Room Chat
              </>
            )}
          </h3>

          {/* The Toggle Button */}
          <button
            onClick={() =>
              setRightPanelTab((prev) =>
                prev === "participants" ? "chat" : "participants",
              )
            }
            className="text-gray-400 hover:text-white transition-colors relative p-1.5 hover:bg-gray-700 rounded-lg"
            title={
              rightPanelTab === "participants"
                ? "Switch to Chat"
                : "Switch to Participants"
            }
          >
            {rightPanelTab === "participants" ? (
              <>
                <MessageSquare size={16} />
                {hasUnread && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 border border-gray-900 rounded-full animate-pulse" />
                )}
              </>
            ) : (
              <Users size={16} />
            )}
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {rightPanelTab === "participants" ? (
            /* --- PARTICIPANTS TAB --- */
            <ul className="flex flex-col gap-3 p-4 overflow-y-auto">
              {roomUsers.map((user: any) => (
                <li
                  key={user.id}
                  className="flex flex-col gap-2 text-white bg-gray-800/40 p-3 rounded-xl border border-gray-700/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner border border-white/10 ${user.isOwner ? "bg-gradient-to-br from-yellow-500 to-orange-600" : "bg-gradient-to-br from-blue-500 to-purple-600"}`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium truncate text-gray-200">
                          {user.username}{" "}
                          {user.id === socket.id && (
                            <span className="text-gray-500 text-xs">(You)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          {user.isOwner ? (
                            <>
                              <Shield size={10} className="text-yellow-500" />{" "}
                              Owner
                            </>
                          ) : user.canEdit ? (
                            <>
                              <Pen size={10} className="text-blue-400" /> Editor
                            </>
                          ) : (
                            <>
                              <Eye size={10} className="text-gray-400" /> Viewer
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {amIOwner && !user.isOwner && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/50">
                      <button
                        onClick={() =>
                          socket.emit("update-permission", {
                            targetSocketId: user.id,
                            canEdit: !user.canEdit,
                            roomId,
                          })
                        }
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold rounded transition-colors uppercase tracking-wider ${user.canEdit ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}
                      >
                        {user.canEdit ? "Revoke Access" : "Allow Editing"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            /* --- CHAT TAB --- */
            <div className="flex flex-col h-full overflow-hidden">
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-4"
              >
                {messages.length === 0 ? (
                  <div className="py-12 flex items-center justify-center text-xs text-gray-500 italic">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <ChatMessageItem
                      key={msg.id}
                      msg={msg}
                      isMe={msg.username === username}
                    />
                  ))
                )}
              </div>
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-gray-800/50 border-t border-gray-700/50 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white p-2 rounded-xl transition-colors flex items-center justify-center shadow-md"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* --- BOTTOM RIGHT (Zoom Controls) --- */}
      <div
        className={`absolute bottom-6 right-6 flex items-center bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-40 text-gray-400 transition-all duration-300 ${isZenMode ? "translate-y-[120%] opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}
      >
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

      <Canvas />
    </div>
  );
};
