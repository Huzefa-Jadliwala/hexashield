// AuthContext.tsx
import { privateClient } from "@app/axios.client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Add the AuthContextProviderProps interface
interface AuthContextProviderProps {
  children: ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthContextProvider");
  }
  return context;
};

export const AuthContextProvider: React.FC<AuthContextProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {

    if (localStorage.getItem("isAuthenticated") && localStorage.getItem("isAuthenticated") == "true") {

      return true
    }
    else {
      return false
    }

  });

  const checkAccessToken = async () => {
    try {
      const response = await privateClient.get("/auth/check-token");
      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        await refreshAccessToken();
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const refreshAccessToken = async () => {
    try {
      const response = await privateClient.get("/auth/refresh");
      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAccessToken();
    const interval = setInterval(checkAccessToken, 15 * 60 * 1000); // Check every 15 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem("isAuthenticated", isAuthenticated.toString());
  }, [isAuthenticated]);


  return (
    <AuthContext.Provider value={{
      
      isAuthenticated,
      setIsAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
};