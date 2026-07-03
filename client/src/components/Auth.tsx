import React, { useState } from "react";
import { useBoardStore } from "../store";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { setAuth } = useBoardStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const endpoint = isLogin ? "/auth/login" : "/auth/register";
    const payload = isLogin
      ? { email, password }
      : { email, username, password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setAuth(data.token, data.username);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative flex items-center justify-center font-sans overflow-hidden px-4">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none fixed"></div>

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors flex items-center gap-2 z-20"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium hidden sm:inline">
          Back to Home
        </span>
      </button>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-gray-900/60 p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-800 backdrop-blur-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <img
            src="/favicon-32x32.png"
            alt="CollaboDraw Logo"
            className="w-10 h-10 rounded-lg mb-4 shadow-lg"
          />
          <h2 className="text-2xl font-bold text-white text-center tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-gray-400 mt-2 text-center">
            {isLogin
              ? "Enter your details to access your boards."
              : "Join to start collaborating in real-time."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Animated Username Field (Only for Registration) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: -20 }}
                animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                exit={{ opacity: 0, height: 0, marginTop: -20 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-all placeholder-gray-500"
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Mail size={18} />
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-all placeholder-gray-500"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Lock size={18} />
            </div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-700 text-white text-sm rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-all placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Processing...
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-center">
          <p className="text-gray-400 text-sm">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-white hover:text-blue-400 font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Log in"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
