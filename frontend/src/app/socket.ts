import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_API_URL as string;

export const socket: Socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"], // WebSocket first, fallback to polling
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 5000, // Retry every 5 seconds if disconnected
    reconnectionDelayMax: 10000,
    timeout: 60000, // Match the server's ping_timeout (1 minute)
    closeOnBeforeunload: true,
    forceNew: true,
});

// Event listeners for debugging and monitoring
socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
        // Server intentionally disconnected, try reconnecting manually
        socket.connect();
    }
});

socket.on("reconnect_attempt", (attempt) => {
    console.log(`Reconnection attempt #${attempt}`);
});

socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
});


