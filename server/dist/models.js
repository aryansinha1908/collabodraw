"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Board = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Point sub-schema for freehand lines and tools
const PointSchema = new mongoose_1.default.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true },
}, { _id: false });
// Element schema for the individual shapes/strokes
const ElementSchema = new mongoose_1.default.Schema({
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
}, { _id: false });
// Board schema to contain the elements
const BoardSchema = new mongoose_1.default.Schema({
    boardId: { type: String, required: true, unique: true },
    title: { type: String, default: "Untitled Board" },
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "User" }, // <-- THIS IS MANDATORY
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
}, { timestamps: true });
const UserSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
}, { timestamps: true });
exports.Board = mongoose_1.default.model("Board", BoardSchema);
exports.User = mongoose_1.default.model("User", UserSchema);
