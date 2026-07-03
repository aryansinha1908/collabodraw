import mongoose from "mongoose";

// Point sub-schema for freehand lines and tools
const PointSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

// Element schema for the individual shapes/strokes
const ElementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: { type: String, required: true }, // 'pen', 'eraser', 'rect', etc.
    points: [PointSchema],
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    color: { type: String, required: true },
    strokeWidth: { type: Number, required: true },
    createdBy: String,
  },
  { _id: false },
);

// Board schema to contain the elements
const BoardSchema = new mongoose.Schema(
  {
    boardId: { type: String, required: true, unique: true },
    title: { type: String, default: "Hackathon Board" },
    elements: [ElementSchema],
  },
  { timestamps: true },
);

export const Board = mongoose.model("Board", BoardSchema);
