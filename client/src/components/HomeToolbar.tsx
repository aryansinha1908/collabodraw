import { useState, useEffect } from "react";
import {
  Hand,
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  MousePointerClick,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Configuration for our 6 tools and their descriptions
const TOOLS = [
  {
    id: "pan",
    icon: Hand,
    name: "Pan Tool",
    desc: "Navigate the infinite canvas seamlessly without accidentally modifying your work.",
  },
  {
    id: "pen",
    icon: Pen,
    name: "Pen Tool",
    desc: "Express your ideas freely with smooth, pressure-sensitive freehand sketching.",
  },
  {
    id: "eraser",
    icon: Eraser,
    name: "Eraser Tool",
    desc: "Quickly remove mistakes or fine-tune your complex architectural diagrams.",
  },
  {
    id: "rect",
    icon: Square,
    name: "Rectangle",
    desc: "Perfect for drawing wireframes, bounding boxes, and system architecture blocks.",
  },
  {
    id: "circle",
    icon: Circle,
    name: "Circle",
    desc: "Highlight key areas or create elegant flowcharts and node graphs.",
  },
  {
    id: "line",
    icon: Minus,
    name: "Line Tool",
    desc: "Connect components and map out precise user flows and relationships.",
  },
];

export const HomeToolbar = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Handle the automatic cycling every 3 seconds
  useEffect(() => {
    if (!isAutoCycling) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TOOLS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isAutoCycling]);

  // Handle manual clicks
  const handleToolClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoCycling(false); // Stop auto-cycling if the user interacts
  };

  const activeTool = TOOLS[activeIndex];

  return (
    <div className="flex flex-col items-center">
      {/* The Interactive Toolbar */}
      <div className="inline-flex items-center gap-1.5 p-2 rounded-xl bg-gray-900/80 backdrop-blur-xl border border-gray-700 shadow-2xl relative z-10 mb-8">
        {TOOLS.map((tool, idx) => {
          const Icon = tool.icon;
          const isActive = activeIndex === idx;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(idx)}
              className={`p-3 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-110"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
              title={tool.name}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>

      {/* The Dynamic Description */}
      <div className="max-w-2xl mx-auto bg-[#0d1117] relative z-10 h-32 flex flex-col items-center justify-start text-center">
        <h3 className="text-2xl font-bold mb-3 flex items-center justify-center gap-2">
          <MousePointerClick className="text-blue-500" /> Distraction-Free
          Tooling
        </h3>

        {/* AnimatePresence allows for smooth fading when the text changes */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-gray-400 text-lg">
              <span className="text-blue-400 font-semibold mr-2">
                {activeTool.name}:
              </span>
              {activeTool.desc}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
