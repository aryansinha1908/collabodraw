import { io } from "socket.io-client";

// We will use the environment variable if available, otherwise default to our local server
const SOCKET_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const socket = io(SOCKET_URL);
