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
    title: { type: String, default: "Untitled Board" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // <-- THIS IS MANDATORY
    maxUsers: { type: Number, default: 10 },
    isPrivate: { type: Boolean, default: false },
    elements: { type: Array, default: [] },
    messages: {
      type: [
        {
          id: String,
          userId: String,
          username: String,
          text: String,
          timestamp: Number,
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export const Board = mongoose.model("Board", BoardSchema);
export const User = mongoose.model("User", UserSchema);
