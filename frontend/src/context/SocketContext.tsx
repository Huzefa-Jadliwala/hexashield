import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { socket } from "@app/socket";

interface SocketContextProps {
    socket: Socket;
    connect: () => void;
    disconnect: () => void;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextProps | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isConnected, setIsConnected] = useState(socket.connected);

    const connect = () => {
        if (!socket.connected) {
            socket.connect();
        }
    };

    const disconnect = () => {
        if (socket.connected) {
            socket.disconnect();
        }
    };

    useEffect(() => {
        const updateConnectionState = () => {
            setIsConnected(socket.connected);
        };

        socket.on("connect", updateConnectionState);
        socket.on("disconnect", updateConnectionState);
        socket.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        return () => {
            socket.off("connect", updateConnectionState);
            socket.off("disconnect", updateConnectionState);
            socket.off("connect_error");
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, connect, disconnect, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = (): SocketContextProps => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be used within a SocketProvider");
    }
    return context;
};
