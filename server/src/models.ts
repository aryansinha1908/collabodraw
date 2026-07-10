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
    boardId: { type: String, required: true, index: true }, // <-- INDEX THIS FOR SPEED
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    points: [PointSchema],
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    color: { type: String, required: true },
    strokeWidth: { type: Number, required: true },
    createdBy: String,
  },
  { timestamps: true }, // <-- Gives us createdAt for the Undo function!
);

// Board schema to contain the elements
const BoardSchema = new mongoose.Schema(
  {
    boardId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "Untitled Board" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    maxUsers: { type: Number, default: 10 },
    isPrivate: { type: Boolean, default: false },
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
    passwordHash: { type: String, required: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, required: false },
  },
  { timestamps: true },
);

export const Element = mongoose.model("Element", ElementSchema);
export const Board = mongoose.model("Board", BoardSchema);
export const User = mongoose.model("User", UserSchema);
