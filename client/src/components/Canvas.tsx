import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useBoardStore } from "../store";
import type { CanvasElement, Point } from "../types";
import { useParams } from "react-router-dom";
import { socket } from "../socket";

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { roomId } = useParams();
  const activeRoomId = roomId || "default-room";
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(
    null,
  );

  // Transient remote states
  const [remoteElements, setRemoteElements] = useState<
    Record<string, CanvasElement>
  >({});
  const [cursors, setCursors] = useState<
    Record<string, { x: number; y: number; username: string }>
  >({});

  const {
    elements,
    setElements,
    currentTool,
    strokeColor,
    strokeWidth,
    addRemoteElement,
  } = useBoardStore();

  // --- SOCKET LISTENERS ---
  useEffect(() => {
    socket.on("draw-start", ({ userId, element }) => {
      setRemoteElements((prev) => ({ ...prev, [userId]: element }));
    });

    socket.on("draw-move", ({ userId, element }) => {
      setRemoteElements((prev) => ({ ...prev, [userId]: element }));
    });

    socket.on("draw-end", (element: CanvasElement) => {
      setRemoteElements((prev) => {
        const newState = { ...prev };
        delete newState[element.createdBy!]; // Remove transient preview
        return newState;
      });
      addRemoteElement(element); // Commit to persistent state
    });

    socket.on("cursor-move", ({ userId, x, y, username }) => {
      setCursors((prev) => ({ ...prev, [userId]: { x, y, username } }));
    });

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

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Combine local persistent, local transient, and remote transient elements
    const allElements = [...elements];
    if (currentElement) allElements.push(currentElement);
    Object.values(remoteElements).forEach((el) => allElements.push(el));

    allElements.forEach((element) => {
      ctx.beginPath();
      ctx.lineWidth = element.strokeWidth;

      if (element.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = element.color;
      }

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
      }
    });
    ctx.globalCompositeOperation = "source-over";
  }, [elements, currentElement, remoteElements]); // Added remoteElements to dependency array

  // --- LOCAL DRAWING LOGIC WITH EMISSIONS ---
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;

    // Always emit cursor position
    socket.emit("cursor-move", {
      roomId: activeRoomId,
      x: clientX,
      y: clientY,
    });

    if (!isDrawing || !currentElement) return;

    const updatedElement = { ...currentElement };

    if (updatedElement.type === "pen" || updatedElement.type === "eraser") {
      updatedElement.points = [
        ...(updatedElement.points || []),
        { x: clientX, y: clientY },
      ];
    } else if (updatedElement.type === "line") {
      updatedElement.points = [
        updatedElement.points![0],
        { x: clientX, y: clientY },
      ];
    } else {
      updatedElement.width = clientX - updatedElement.x!;
      updatedElement.height = clientY - updatedElement.y!;
    }

    setCurrentElement(updatedElement);
    socket.emit("draw-move", { roomId: activeRoomId, element: updatedElement });
  };

  const startDrawing = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setIsDrawing(true);

    const newElement: CanvasElement = {
      id: uuidv4(),
      type: currentTool,
      color: strokeColor,
      strokeWidth,
      points: [{ x: clientX, y: clientY }],
      x: clientX,
      y: clientY,
      width: 0,
      height: 0,
      createdBy: socket.id, // Tag with user ID
    };

    setCurrentElement(newElement);
    socket.emit("draw-start", { roomId: activeRoomId, element: newElement });
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);
    setElements([...elements, currentElement], true);
    socket.emit("draw-end", { roomId: activeRoomId, element: currentElement });
    setCurrentElement(null);
  };

  return (
    <>
      {/* Render Live Cursors */}
      {Object.entries(cursors).map(([userId, cursor]) => (
        <div
          key={userId}
          className="absolute pointer-events-none z-50 transition-all duration-75 ease-linear flex flex-col items-start"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          {/* Simple custom cursor SVG */}
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

          {/* NEW: Username Tag */}
          <div className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md ml-4 -mt-2">
            {cursor.username}
          </div>
        </div>
      ))}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={startDrawing}
        onMouseMove={handleMouseMove}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        className="bg-gray-900 cursor-crosshair touch-none block"
      />
    </>
  );
};
