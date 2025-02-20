import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { privateClient } from "@app/axios.client";

const useLogout = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const { setIsAuthenticated } = useAuthContext();

  const logout = async () => {
    console.log("called")
    setLoading(true);
    try {

      const res = await privateClient.get("/auth/logout")
      
      if (res.status !== 200) {
        throw new Error("Failed to log out");
      }

      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("user");
      setIsAuthenticated(false);
      toast.success("Logged out successfully");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, logout };
};

export default useLogout;
