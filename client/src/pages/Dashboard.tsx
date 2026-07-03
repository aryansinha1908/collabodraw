import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBoardStore } from "../store";
import { Trash2, Users, Lock, Globe, ArrowLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const Dashboard = () => {
  const [joinId, setJoinId] = useState("");
  const [myBoards, setMyBoards] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newMaxUsers, setNewMaxUsers] = useState(10);
  const [newIsPrivate, setNewIsPrivate] = useState(false);

  const navigate = useNavigate();
  const { token, username, logout } = useBoardStore();

  useEffect(() => {
    fetchMyBoards();
  }, [token]);

  const fetchMyBoards = async () => {
    try {
      const res = await fetch(`${API_URL}/boards/my-boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMyBoards(await res.json());
    } catch (err) {
      console.error("Failed to fetch boards");
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
          title: newTitle,
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
    if (!confirm("Are you sure you want to delete this board?")) return;
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

  return (
    <div className="min-h-screen w-screen bg-gray-900 font-sans p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-gray-400 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft size={28} />
          </button>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">
            Hello, <strong className="text-white">{username}</strong>
          </span>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Sidebar: Actions */}
        <div className="flex flex-col gap-6">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              Join via Link / Code
            </h2>
            <form onSubmit={handleJoin} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="e.g. X7K9P2"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                className="bg-gray-700 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase text-center"
                required
              />
              <button
                type="submit"
                className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg"
              >
                Join Board
              </button>
            </form>
          </div>

          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              Create New Board
            </h2>
            <form onSubmit={handleCreateBoard} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Board Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-gray-700 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-400">
                  Max Users: {newMaxUsers}
                </label>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={newMaxUsers}
                  onChange={(e) => setNewMaxUsers(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div
                className="flex items-center gap-3 bg-gray-700 p-3 rounded-lg cursor-pointer"
                onClick={() => setNewIsPrivate(!newIsPrivate)}
              >
                <input
                  type="checkbox"
                  checked={newIsPrivate}
                  onChange={() => {}}
                  className="w-5 h-5"
                />
                <span className="text-white flex-1">Private Board</span>
                {newIsPrivate ? (
                  <Lock size={18} className="text-gray-400" />
                ) : (
                  <Globe size={18} className="text-gray-400" />
                )}
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 disabled:opacity-50"
              >
                {isCreating ? "Generating..." : "Generate Board"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Content: My Boards */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-bold text-white mb-6">My Boards</h2>
          {myBoards.length === 0 ? (
            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 text-center text-gray-400">
              You haven't created any boards yet. Create one to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myBoards.map((board) => (
                <div
                  key={board.boardId}
                  className="bg-gray-800 p-5 rounded-2xl border border-gray-700 hover:border-blue-500 transition-colors flex flex-col justify-between h-48 group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white truncate pr-2">
                        {board.title}
                      </h3>
                      {board.isPrivate ? (
                        <Lock size={18} className="text-red-400 shrink-0" />
                      ) : (
                        <Globe size={18} className="text-green-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-mono mb-4">
                      Code:{" "}
                      <span className="text-blue-400 font-bold">
                        {board.boardId}
                      </span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users size={16} /> Max {board.maxUsers} Users
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/board/${board.boardId}`)}
                      className="flex-1 bg-gray-700 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      Enter Room
                    </button>
                    <button
                      onClick={() => handleDeleteBoard(board.boardId)}
                      className="bg-gray-700 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                      title="Delete Board"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
