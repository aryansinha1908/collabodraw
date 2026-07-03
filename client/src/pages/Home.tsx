import { useNavigate } from "react-router-dom";
import { useBoardStore } from "../store";

export const Home = () => {
  const navigate = useNavigate();
  const { token } = useBoardStore();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gray-900 font-sans text-white px-4">
      {/* Top Nav */}
      <div className="absolute top-4 right-8 flex items-center gap-4">
        {token ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-300 hover:text-white font-semibold"
          >
            Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="text-gray-300 hover:text-white font-semibold"
          >
            Login
          </button>
        )}
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl flex flex-col items-center gap-6">
        <h1 className="text-6xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          CollaboDraw
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-4">
          The real-time collaborative whiteboard. Create private rooms, share
          secure links, and draw together instantly.
        </p>

        {token ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            Open Dashboard
          </button>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="bg-blue-600 hover:bg-blue-500 px-10 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg shadow-blue-500/30"
          >
            Start Drawing for Free
          </button>
        )}
      </div>
    </div>
  );
};
