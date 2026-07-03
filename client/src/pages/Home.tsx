import { useNavigate } from "react-router-dom";
import {
  Zap,
  Globe,
  Users,
  Download,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useBoardStore } from "../store";
import { motion } from "framer-motion";

export const Home = () => {
  const navigate = useNavigate();
  const { token, username, logout } = useBoardStore();

  const handleCtaClick = () => {
    navigate("/dashboard");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white relative overflow-x-hidden font-sans">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none fixed"></div>

      {/* Navbar (Animated to fade in) */}
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
          {token ? (
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
            <>
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/register")}
                className="px-4 py-2 text-sm font-medium bg-white text-black rounded-md hover:bg-gray-200 transition-colors"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center">
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
            className="px-8 py-4 text-lg font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {token ? "Go to your Dashboard" : "Start drawing — it's free"}
          </button>
        </motion.div>

        {/* Hero Image Mockup (Animated to float up last) */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="mt-20 w-full max-w-5xl mx-auto p-2 bg-gray-800/50 rounded-2xl border border-gray-700/50 backdrop-blur-sm shadow-2xl"
        >
          <div className="aspect-[16/9] w-full bg-[#111827] rounded-xl border border-gray-700 flex items-center justify-center overflow-hidden relative">
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <Zap size={32} className="text-gray-600" />
              <span>[ Replace with a screenshot of your beautiful UI ]</span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-gray-800 mt-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to collaborate.
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Engineered for speed, reliability, and ease of use across all your
            devices.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6">
              <Globe className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Sync</h3>
            <p className="text-gray-400 leading-relaxed">
              Changes appear instantly across all connected screens via
              low-latency WebSockets. Zero refresh required.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6">
              <Users className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Live Presence</h3>
            <p className="text-gray-400 leading-relaxed">
              See exactly who is in your room and follow their live cursors as
              they sketch and annotate ideas.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6">
              <Download className="text-green-400" size={24} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Export</h3>
            <p className="text-gray-400 leading-relaxed">
              Take your work anywhere. Export high-resolution snapshots of your
              infinite canvas in PNG, JPG, or PDF formats.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <img
              src="/favicon-32x32.png"
              alt="CollaboDraw Logo"
              className="w-4 h-4 rounded-sm grayscale opacity-50"
            />
            <span className="font-semibold text-gray-300">CollaboDraw</span>
          </div>
          <p>
            © {new Date().getFullYear()} Built for the Hackathon. All rights
            reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
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
