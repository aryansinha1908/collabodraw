import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useBoardStore } from "../store";
import {
  Trash2,
  Users,
  Lock,
  Globe,
  ArrowRight,
  Plus,
  Layout,
  LogOut,
  Loader2,
  Copy,
  Link,
} from "lucide-react";

// Using the exact API URL logic from your source
const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const Dashboard = () => {
  // Application State
  const navigate = useNavigate();
  const { token, username, logout } = useBoardStore();

  // Component State
  const [joinId, setJoinId] = useState("");
  const [myBoards, setMyBoards] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);

  // New Board Form State
  const [newTitle, setNewTitle] = useState("");
  const [newMaxUsers, setNewMaxUsers] = useState(10);
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  useEffect(() => {
    fetchMyBoards();
  }, [token]);

  const fetchMyBoards = async () => {
    setIsLoadingBoards(true);
    try {
      const res = await fetch(`${API_URL}/boards/my-boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyBoards(await res.json());
    } catch (err) {
      console.error("Failed to fetch boards");
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch(`${API_URL}/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle || "Untitled Board",
          maxUsers: newMaxUsers,
          isPrivate: newIsPrivate,
        }),
      });
      if (res.ok) {
        const board = await res.json();
        navigate(`/board/${board.boardId}`);
      }
    } catch (err) {
      console.error("Failed to create board");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBoard = async (boardId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this board? This cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchMyBoards();
    } catch (err) {
      console.error("Failed to delete");
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) navigate(`/board/${joinId.trim()}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- NEW: Sharing Handlers ---
  const handleCopyLink = (boardId: string) => {
    // Dynamically builds the full URL based on where the app is hosted
    const url = `${window.location.origin}/board/${boardId}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied to clipboard!", {
      style: {
        background: "#1f2937",
        color: "#fff",
        border: "1px solid #374151",
      },
    });
  };

  const handleCopyId = (boardId: string) => {
    navigator.clipboard.writeText(boardId);
    toast.success("Room ID copied!", {
      style: {
        background: "#1f2937",
        color: "#fff",
        border: "1px solid #374151",
      },
    });
  };

  // Framer Motion Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative font-sans overflow-x-hidden">
      <Toaster position="bottom-right" />
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none fixed"></div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0">
        <div
          onClick={() => navigate("/")}
          className="text-xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer"
        >
          <img
            src="/favicon-32x32.png"
            alt="CollaboDraw Logo"
            className="w-7 h-7 rounded-md"
          />
          CollaboDraw
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-gray-400">{username}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
            title="Log out"
          >
            <LogOut size={16} />{" "}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR: Actions (Forms) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Join Board Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-xl"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Globe size={18} className="text-blue-500" /> Join via Code
              </h2>
              <form
                onSubmit={handleJoin}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  placeholder="e.g. X7K9P2"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                  className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-3 placeholder-gray-500 outline-none transition-all font-mono tracking-widest uppercase"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
            </motion.div>

            {/* Create Board Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 backdrop-blur-sm shadow-xl"
            >
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-500" /> Create New Board
              </h2>
              <form
                onSubmit={handleCreateBoard}
                className="flex flex-col gap-4"
              >
                <input
                  type="text"
                  placeholder="Board Title (e.g. Brainstorming)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-4 py-3 outline-none transition-all"
                  required
                />

                <div className="flex flex-col gap-2 p-4 bg-gray-950/30 rounded-lg border border-gray-800/50">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-400">Max Participants</span>
                    <span className="font-mono text-blue-400">
                      {newMaxUsers}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="50"
                    value={newMaxUsers}
                    onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div
                  className="flex items-center justify-between p-4 bg-gray-950/30 rounded-lg border border-gray-800/50 cursor-pointer hover:border-gray-700 transition-colors"
                  onClick={() => setNewIsPrivate(!newIsPrivate)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${newIsPrivate ? "bg-blue-500 border-blue-500" : "border-gray-600"}`}
                    >
                      {newIsPrivate && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-gray-300">Private Board</span>
                  </div>
                  {newIsPrivate ? (
                    <Lock size={16} className="text-gray-500" />
                  ) : (
                    <Globe size={16} className="text-gray-500" />
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg mt-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    "Generate Board"
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* RIGHT CONTENT: My Boards Grid */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Workspaces</h2>
            </div>

            {isLoadingBoards ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2
                  size={32}
                  className="animate-spin mb-4 text-blue-500"
                />
                <p>Loading your boards...</p>
              </div>
            ) : myBoards.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-800 rounded-2xl bg-gray-900/20"
              >
                <Layout size={48} className="text-gray-700 mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-gray-300">
                  No boards yet
                </h3>
                <p className="text-gray-500">
                  Use the menu on the left to create your first collaborative
                  workspace.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {myBoards.map((board) => (
                  <motion.div
                    key={board.boardId}
                    variants={cardVariants}
                    whileHover={{ y: -4 }}
                    className="group flex flex-col bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all shadow-lg"
                  >
                    {/* Card Header Pattern */}
                    <div
                      onClick={() => navigate(`/board/${board.boardId}`)}
                      className="aspect-[21/9] w-full bg-[#111827] flex items-center justify-center border-b border-gray-800 cursor-pointer relative overflow-hidden"
                    >
                      <Layout
                        size={32}
                        className="text-gray-800 group-hover:text-blue-500/20 transition-colors z-10"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 flex flex-col grow">
                      <div className="flex justify-between items-start mb-1">
                        <h3
                          onClick={() => navigate(`/board/${board.boardId}`)}
                          className="text-lg font-semibold text-gray-200 truncate pr-2 cursor-pointer group-hover:text-white transition-colors"
                        >
                          {board.title}
                        </h3>
                        {board.isPrivate ? (
                          <span title="Private" className="shrink-0 mt-1">
                            <Lock size={16} className="text-gray-600" />
                          </span>
                        ) : (
                          <span title="Public" className="shrink-0 mt-1">
                            <Globe size={16} className="text-gray-600" />
                          </span>
                        )}{" "}
                      </div>

                      {/* Interactive ID Badge */}
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyId(board.boardId);
                          }}
                          className="group/id flex items-center gap-1.5 text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded border border-gray-700 hover:border-gray-500 font-mono transition-colors"
                          title="Copy Room ID"
                        >
                          ID:{" "}
                          <span className="text-blue-400 group-hover/id:text-blue-300">
                            {board.boardId}
                          </span>
                          <Copy
                            size={12}
                            className="opacity-0 group-hover/id:opacity-100 transition-opacity"
                          />
                        </button>
                      </div>

                      {/* Action Footer */}
                      <div className="flex gap-2">
                        {/* NEW: Copy Link Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink(board.boardId);
                          }}
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded transition-colors border border-gray-700"
                          title="Copy full invite link"
                        >
                          <Link size={16} />
                        </button>

                        <button
                          onClick={() => navigate(`/board/${board.boardId}`)}
                          className="px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded transition-colors"
                        >
                          Enter
                        </button>
                        <button
                          onClick={() => handleDeleteBoard(board.boardId)}
                          className="p-1.5 bg-transparent hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded transition-colors"
                          title="Delete Board"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
