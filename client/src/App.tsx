import { Canvas } from "./components/Canvas";
import { useBoardStore } from "./store";
import {
  Pen,
  Eraser,
  Square,
  Circle,
  Minus,
  Undo,
  Redo,
  Trash2,
} from "lucide-react";

function App() {
  const { currentTool, setTool, setColor, undo, redo, clearBoard } =
    useBoardStore();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gray-900">
      {/* Top Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-800 p-3 rounded-xl shadow-lg border border-gray-700">
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

        <div className="flex gap-2">
          <button
            onClick={undo}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Undo size={20} />
          </button>
          <button
            onClick={redo}
            className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg"
          >
            <Redo size={20} />
          </button>
          <button
            onClick={clearBoard}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <Canvas />
    </div>
  );
}

export default App;
