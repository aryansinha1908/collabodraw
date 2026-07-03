import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useBoardStore } from "../store";
import type { CanvasElement, Point } from "../types";

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<CanvasElement | null>(
    null,
  );

  const { elements, setElements, currentTool, strokeColor, strokeWidth } =
    useBoardStore();

  // The Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 2. Redraw all elements
    const allElements = currentElement
      ? [...elements, currentElement]
      : elements;

    allElements.forEach((element) => {
      ctx.beginPath();
      ctx.lineWidth = element.strokeWidth;

      // FIX 2: True transparency for the eraser
      if (element.type === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)"; // Color doesn't matter for destination-out
      } else {
        ctx.globalCompositeOperation = "source-over"; // Default drawing mode
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
        // FIX 1: Safely fallback to the start point if mouse hasn't moved yet
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
  }, [elements, currentElement]);

  const startDrawing = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    setIsDrawing(true);

    const startPoint: Point = { x: clientX, y: clientY };

    setCurrentElement({
      id: uuidv4(),
      type: currentTool,
      color: strokeColor,
      strokeWidth,
      points: [startPoint],
      x: clientX,
      y: clientY,
      width: 0,
      height: 0,
    });
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !currentElement) return;
    const { clientX, clientY } = e;

    setCurrentElement((prev) => {
      if (!prev) return prev;

      if (prev.type === "pen" || prev.type === "eraser") {
        return {
          ...prev,
          points: [...(prev.points || []), { x: clientX, y: clientY }],
        };
      } else if (prev.type === "line") {
        return {
          ...prev,
          points: [prev.points![0], { x: clientX, y: clientY }],
        };
      } else {
        // For rect and circle
        return {
          ...prev,
          width: clientX - prev.x!,
          height: clientY - prev.y!,
        };
      }
    });
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentElement) return;

    setIsDrawing(false);
    setElements([...elements, currentElement], true); // Save to history
    setCurrentElement(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={finishDrawing}
      onMouseLeave={finishDrawing}
      className="bg-gray-900 cursor-crosshair touch-none"
    />
  );
};
