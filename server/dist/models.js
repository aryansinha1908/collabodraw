"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Board = exports.Element = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Point sub-schema for freehand lines and tools
const PointSchema = new mongoose_1.default.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
}, { _id: false });
// Element schema for the individual shapes/strokes
const ElementSchema = new mongoose_1.default.Schema({
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
}, { timestamps: true });
// Board schema to contain the elements
const BoardSchema = new mongoose_1.default.Schema({
    boardId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "Untitled Board" },
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" },
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
}, { timestamps: true });
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false },
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, required: false },
}, { timestamps: true });
exports.Element = mongoose_1.default.model("Element", ElementSchema);
exports.Board = mongoose_1.default.model("Board", BoardSchema);
exports.User = mongoose_1.default.model("User", UserSchema);
