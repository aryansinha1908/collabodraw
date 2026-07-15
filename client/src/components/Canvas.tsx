import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useBoardStore } from "../store";
import type { CanvasElement } from "../types";
import { useParams } from "react-router-dom";
import { socket } from "../socket";
import toast from "react-hot-toast";

type LaserPoint = {
  x: number;
  y: number;
  time: number; // The exact millisecond this dot was drawn
  id: string;
  strokeWidth: number;
};

interface CanvasProps {
  isDemo?: boolean;
  demoCanEdit?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  isDemo = false,
  demoCanEdit = false,
}) => {
  const lastCursorEmit = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { roomId } = useParams();
  const activeRoomId = roomId || "default-room";

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(
    null,
  );

  // --- NEW: Panning State ---
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const laserTrailRef = useRef<LaserPoint[]>([]);
  const LASER_LIFESPAN = 1000; // How long it takes to vanish (1 second)
  const ephemeralCanvasRef = useRef<HTMLCanvasElement>(null);

  const [remoteElements, setRemoteElements] = useState<
    Record<string, CanvasElement>
  >({});
  const [cursors, setCursors] = useState<
    Record<string, { x: number; y: number; username: string }>
  >({});
  const [canvasSize, setCanvasSize] = useState({
    width: window.innerWidth * 3,
    height: window.innerHeight * 3,
  });

  const {
    elements,
    setElements,
    currentTool,
    strokeColor,
    strokeWidth,
    addRemoteElement,
    zoom,
    offsetX,
    offsetY,
    setOffset, // Pulled new pan states from store
    typingState,
    setTypingState,
  } = useBoardStore();

  // --- NEW: Coordinate Math Helper ---
  // --- BUG FIX: THE WORLD COORDINATE MATH ---
  const getCoordinates = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    // --- FIX: Fetch live instantaneous state ---
    const liveState = useBoardStore.getState();

    return {
      x: (e.clientX - rect.left - liveState.offsetX) / liveState.zoom,
      y: (e.clientY - rect.top - liveState.offsetY) / liveState.zoom,
    };
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Optional: A tiny debounce so it doesn't fire 100 times while dragging the window
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setCanvasSize({
          width: window.innerWidth * 3,
          height: window.innerHeight * 3,
        });
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (isDemo) return;

    socket.on("draw-start", ({ userId, element }) => {
      // 1. THE INTERCEPTOR: Route laser straight to the animation loop
      if (element.type === "laser") {
        laserTrailRef.current.push({
          x: element.x,
          y: element.y,
          time: Date.now(),
          id: element.id,
          strokeWidth: element.strokeWidth || 2,
        });
        return;
      }
      setRemoteElements((prev) => ({ ...prev, [userId]: element }));
    });

    socket.on("draw-move", ({ userId, element }) => {
      // 2. THE INTERCEPTOR: Catch moving lasers from other users
      if (element.type === "laser") {
        laserTrailRef.current.push({
          x: element.x,
          y: element.y,
          time: Date.now(),
          id: element.id,
          strokeWidth: element.strokeWidth || 2,
        });
        return;
      }
      setRemoteElements((prev) => ({ ...prev, [userId]: element }));
    });

    socket.on("draw-end", (element: CanvasElement) => {
      setRemoteElements((prev) => {
        const newState = { ...prev };
        delete newState[element.createdBy!];
        return newState;
      });

      // 3. THE SHIELD: Do NOT add lasers to the permanent Zustand store
      if (element.type !== "laser") {
        addRemoteElement(element);
      }
    });
    socket.on("cursor-move", ({ userId, x, y, username }) =>
      setCursors((prev) => ({ ...prev, [userId]: { x, y, username } })),
    );
    socket.on("user-left", (userId) => {
      setCursors((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      setRemoteElements((prev) => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    });

    return () => {
      socket.off("draw-start");
      socket.off("draw-move");
      socket.off("draw-end");
      socket.off("cursor-move");
      socket.off("user-left");
    };
  }, [addRemoteElement]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const allElements = [...elements];
    if (currentElement) allElements.push(currentElement);
    Object.values(remoteElements).forEach((el) => allElements.push(el));

    allElements.forEach((element) => {
      ctx.beginPath();
      ctx.lineWidth = element.strokeWidth;
      ctx.globalCompositeOperation =
        element.type === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle =
        element.type === "eraser" ? "rgba(0,0,0,1)" : element.color;

      if (
        (element.type === "pen" || element.type === "eraser") &&
        element.points
      ) {
        ctx.moveTo(element.points[0].x, element.points[0].y);
        element.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      } else if (element.type === "line" && element.points) {
        ctx.moveTo(element.points[0].x, element.points[0].y);
        const endPoint = element.points[1] || element.points[0];
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      } else if (
        element.type === "rect" &&
        element.x !== undefined &&
        element.y !== undefined
      ) {
        ctx.strokeRect(
          element.x,
          element.y,
          element.width || 0,
          element.height || 0,
        );
      } else if (
        element.type === "circle" &&
        element.x !== undefined &&
        element.y !== undefined
      ) {
        const radius = Math.sqrt(
          Math.pow(element.width || 0, 2) + Math.pow(element.height || 0, 2),
        );
        ctx.arc(element.x, element.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (
        element.type === "text" &&
        element.text &&
        element.x !== undefined &&
        element.y !== undefined
      ) {
        ctx.font = `${element.fontSize}px sans-serif`;
        ctx.fillStyle = element.color; // Text uses fillStyle, not strokeStyle!
        ctx.textBaseline = "top"; // Aligns the canvas text with our HTML textarea

        // Canvas fillText doesn't support line breaks natively.
        // We have to split by \n and draw each line slightly lower!
        const lines = element.text.split("\n");
        const lineHeight = (element.fontSize || 16) * 1.2;

        lines.forEach((line, index) => {
          ctx.fillText(line, element.x!, element.y! + index * lineHeight);
        });
      }
    });
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }, [
    elements,
    currentElement,
    remoteElements,
    canvasSize,
    zoom,
    offsetX,
    offsetY,
  ]);

  useEffect(() => {
    if (typingState && textAreaRef.current) {
      setTimeout(() => {
        textAreaRef.current?.focus();
      }, 10);
    }
  }, [typingState]);

  // --- LASER POINTER ANIMATION LOOP (60FPS) ---
  useEffect(() => {
    let animationFrameId: number;

    const renderLaser = () => {
      const canvas = ephemeralCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const now = Date.now();

      // 1. Wipe the physical screen BEFORE moving the camera
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Filter dead points
      laserTrailRef.current = laserTrailRef.current.filter(
        (p) => now - p.time < LASER_LIFESPAN,
      );

      if (laserTrailRef.current.length > 1) {
        // --- FIX: Fetch live camera state from Zustand ---
        const liveState = useBoardStore.getState();

        // 3. Move the Laser Camera!
        ctx.save();
        ctx.translate(liveState.offsetX, liveState.offsetY);
        ctx.scale(liveState.zoom, liveState.zoom);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(255, 50, 50, 0.8)";

        for (let i = 1; i < laserTrailRef.current.length; i++) {
          const p1 = laserTrailRef.current[i - 1];
          const p2 = laserTrailRef.current[i];
          if (p1.id !== p2.id) continue;

          const age = now - p2.time;
          const opacity = Math.max(0, 1 - age / LASER_LIFESPAN);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineWidth = (p1.strokeWidth || 2) * 2;
          ctx.strokeStyle = `rgba(255, 50, 50, ${opacity})`;
          ctx.stroke();
        }

        ctx.shadowBlur = 0;
        ctx.restore(); // 4. Reset the laser camera!
      }

      animationFrameId = requestAnimationFrame(renderLaser);
    };

    renderLaser();
    return () => cancelAnimationFrame(animationFrameId);
  }, [strokeWidth]);

  // --- NEW: Commit Text Logic ---
  const commitText = () => {
    if (!typingState) return;

    // Only save it if they actually typed something
    if (typingState.text.trim() !== "") {
      const newElement: CanvasElement = {
        id: uuidv4(),
        type: "text",
        color: strokeColor,
        strokeWidth,
        x: typingState.x,
        y: typingState.y,
        text: typingState.text,
        // Make sure this matches the fontSize in your textarea styles
        fontSize: Math.max(strokeWidth * 8, 16),
        createdBy: socket.id,
      };

      // 1. Save to local state
      setElements([...elements, newElement], true);
      // 2. Broadcast to everyone else!
      if (!isDemo) {
        socket.emit("draw-end", { roomId: activeRoomId, element: newElement });
      }
    }

    // Close the box
    setTypingState(null);
  };

  // --- UPDATED: Mouse Handlers ---
  const handleMouseDown = (e: React.PointerEvent) => {
    // Check if using Hand tool OR Middle Mouse Button (button 1)
    if (currentTool === "hand" || e.button === 1) {
      setIsPanning(true);
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    // --- NEW: Security Check ---
    const roomUsers = useBoardStore.getState().roomUsers;
    const currentUser = roomUsers.find((u: any) => u.id === socket.id);

    // --- SHIELD: Hybrid Security Check ---
    let canIEdit = false;

    if (isDemo) {
      canIEdit = demoCanEdit;
    } else {
      canIEdit = currentUser?.isOwner || currentUser?.canEdit || false;
    }

    if (!canIEdit) {
      toast.error(
        isDemo
          ? "Switch to Editor Mode to draw!"
          : "You are in view-only mode. Ask the owner for edit access.",
        {
          id: "view-only-toast",
        },
      );
      return;
    }

    const { x, y } = getCoordinates(e);
    // --- NEW: TEXT TOOL INTERCEPTION ---
    if (currentTool === "text") {
      e.preventDefault(); // CRITICAL: Stops canvas from stealing focus
      e.stopPropagation();

      if (typingState) {
        commitText();
        setTypingState(null);
        return;
      }

      const { x, y } = getCoordinates(e);
      setTypingState({ x, y, text: "" });
      return;
    }
    setIsDrawing(true);

    const newElement: CanvasElement = {
      id: uuidv4(),
      type: currentTool,
      color: strokeColor,
      strokeWidth,
      points: [{ x, y }],
      x,
      y,
      width: 0,
      height: 0,
      createdBy: socket.id,
    };

    if (currentTool === "laser") {
      laserTrailRef.current.push({
        x,
        y,
        time: Date.now(),
        id: newElement.id,
        strokeWidth: strokeWidth,
      });
    }

    setCurrentElement(newElement);
    if (!isDemo) {
      socket.emit("draw-start", { roomId: activeRoomId, element: newElement });
    }
  };

  const handleMouseMove = (e: React.PointerEvent) => {
    // 1. Panning Logic
    if (isPanning) {
      const dx = e.clientX - startPan.x;
      const dy = e.clientY - startPan.y;

      // --- FIX: Fetch live instantaneous state ---
      const liveState = useBoardStore.getState();

      setOffset(liveState.offsetX + dx, liveState.offsetY + dy);
      setStartPan({ x: e.clientX, y: e.clientY });
      return;
    }

    const { x, y } = getCoordinates(e);

    // --- BUG FIX 1: THE GHOST CURSOR SHIELD ---
    // Only emit cursor movements if you are officially in the room's user list
    const roomUsers = useBoardStore.getState().roomUsers;
    const amIInRoom = roomUsers.some((u: any) => u.id === socket.id);

    if (amIInRoom) {
      const now = Date.now();
      if (now - lastCursorEmit.current > 50) {
        socket.emit("cursor-move", { roomId: activeRoomId, x, y });
        lastCursorEmit.current = now;
      }
    }

    if (!isDrawing || !currentElement) return;

    // --- THE FIX: ISOLATE THE LASER ---
    if (currentTool === "laser") {
      laserTrailRef.current.push({
        x: x,
        y: y,
        time: Date.now(),
        id: currentElement.id,
        strokeWidth: currentElement.strokeWidth,
      });

      // Emit and instantly RETURN to prevent the double-emit bug
      socket.emit("draw-move", {
        roomId: activeRoomId,
        element: {
          type: "laser",
          id: currentElement.id,
          x: x,
          y: y,
          strokeWidth: currentElement.strokeWidth || 2,
        },
      });

      return; // <-- CRITICAL: This stops the rest of the function!
    }

    // --- STANDARD TOOLS (Pen, Line, Rect, Circle, Eraser) ---
    const updatedElement = { ...currentElement };

    if (updatedElement.type === "pen" || updatedElement.type === "eraser") {
      updatedElement.points = [...(updatedElement.points || []), { x, y }];
    } else if (updatedElement.type === "line") {
      updatedElement.points = [updatedElement.points![0], { x, y }];
    } else {
      updatedElement.width = x - updatedElement.x!;
      updatedElement.height = y - updatedElement.y!;
    }

    setCurrentElement(updatedElement);
    if (!isDemo) {
      socket.emit("draw-move", {
        roomId: activeRoomId,
        element: updatedElement,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentElement) return;
    setIsDrawing(false);
    setElements([...elements, currentElement], true);
    if (!isDemo) {
      socket.emit("draw-end", {
        roomId: activeRoomId,
        element: currentElement,
      });
    }
    setCurrentElement(null);
  };

  return (
    <div
      className="relative block"
      style={{ width: canvasSize.width, height: canvasSize.height }}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
      onPointerOut={handleMouseUp}
    >
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute pointer-events-none z-50 flex flex-col items-start"
          style={{
            transform: `translate(${offsetX + cursor.x * zoom}px, ${offsetY + cursor.y * zoom}px)`,
          }}
        >
          <svg
            width="24"
            height="36"
            viewBox="0 0 24 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5.65376 21.1573L2.2471 2.24614C1.98638 0.800045 3.39956 -0.274154 4.6868 0.392686L22.2577 9.49753C23.6305 10.2091 23.5042 12.2227 22.0396 12.7538L14.4947 15.4897C14.1206 15.6253 13.8202 15.9038 13.6559 16.2711L10.3705 23.6212C9.70425 25.1119 7.60098 24.8988 7.21855 23.3323L5.65376 21.1573Z"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md ml-4 -mt-2">
            {cursor.username}
          </div>
        </div>
      ))}

      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute top-0 left-0 pointer-events-none"
      />

      <canvas
        ref={ephemeralCanvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="absolute top-0 left-0 pointer-events-none"
      />

      {/* --- NEW: THE HTML TEXT OVERLAY --- */}
      {typingState && (
        <textarea
          ref={textAreaRef}
          value={typingState.text}
          onChange={(e) =>
            setTypingState({ ...typingState, text: e.target.value })
          }
          onBlur={commitText} // Safe to add back now!
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault(); // Stops the browser from doing any weird focus shifts
              commitText(); // Save it instead of destroying it!
            }
          }}
          style={{
            position: "absolute",
            left: `${offsetX + typingState.x * zoom}px`,
            top: `${offsetY + typingState.y * zoom}px`,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            margin: 0,
            padding: 0,
            border: "none",
            outline: "1px dashed rgba(59, 130, 246, 0.5)", // Soft blue outline
            background: "transparent", // Completely clear
            color: strokeColor,
            fontFamily: "sans-serif",
            fontSize: `${Math.max(strokeWidth * 8, 16)}px`,
            lineHeight: "1.2",
            whiteSpace: "pre",
            resize: "none",
            overflow: "hidden",
            zIndex: 99999,
            minWidth: "150px",
            minHeight: "40px",
          }}
        />
      )}

      <div
        className={`absolute top-0 left-0 w-full h-full ${currentTool === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-crosshair"} touch-none`}
      />
    </div>
  );
};
