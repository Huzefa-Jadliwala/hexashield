import { useEffect } from "react";
import { socket } from "@app/socket";

const DebugSocketConnection = () => {
    useEffect(() => {
        // Connect the socket
        if (!socket.connected) {
            console.log("Connecting socket...");
            socket.connect();
        }

        // Listen for connection events
        socket.on("connect", () => {
            console.log("Socket connected successfully:", socket.id);
        });

        socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected:", reason);
        });

        // Cleanup listeners on unmount
        return () => {
            socket.off("connect");
            socket.off("connect_error");
            socket.off("disconnect");
        };
    }, []);

    return null;
};

export default DebugSocketConnection;
