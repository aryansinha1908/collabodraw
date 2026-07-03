import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBoardStore } from "../store";

export const Home = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();
  const { token, username, logout } = useBoardStore();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;

    if (!token) {
      // If a guest tries to join a room, route them to the login page first
      navigate("/auth");
    } else {
      navigate(`/board/${roomId.trim()}`);
    }
  };

  const handleLogout = () => {
    logout();
    // No need to navigate away anymore, guests are allowed on the Home page!
  };

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-900 font-sans">
      {/* Top Right Navigation */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {token ? (
          <>
            <span className="text-gray-300">
              Welcome, <strong className="text-white">{username}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
          >
            Login / Register
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">CollaboDraw</h1>
        <p className="text-gray-400 mb-8">
          Create or join a real-time whiteboard session
        </p>

        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter Room ID (e.g. hackathon-room)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="bg-gray-700 text-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-center"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {token ? "Join / Create Board" : "Login to Join"}
          </button>
        </form>
      </div>
    </div>
  );
};
