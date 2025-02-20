import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { privateClient } from '@app/axios.client';
import axios from "axios";
import { fetchUserThunk } from '@app/users/slices/usersSlice';
import { useAppDispatch } from '@app/hook';

interface LoginData {
  email: string;
  password: string;
}

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const { setIsAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const login = async ({ email, password }: LoginData) => {
    const success = handleInputErrors({ email, password });
    if (!success) {
      return;
    }

    setLoading(true);
    try {

      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await privateClient.post("/auth/login", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (res.status !== 200) {
        const errorData = res.data;
        const errorMessage = mapErrorCodeToMessage(res.status, errorData);
        toast.error(errorMessage);
        return;
      }

      localStorage.setItem("isAuthenticated", "true");
      setIsAuthenticated(true);

      const result = await dispatch(fetchUserThunk()).unwrap(); // Unwrap the result for direct access
      localStorage.setItem('user', JSON.stringify(result));

      navigate('/dashboard'); // Redirect to home page after successful login
      toast.success("Login successful");


    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = mapErrorCodeToMessage(error.response.status, error.response.data);
        toast.error(errorMessage);
      } else if (error instanceof Error) {
        toast.error("Something went wrong. Please try again.");
      } else {
        toast.error("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;

const handleInputErrors = ({ email, password }: LoginData) => {
  if (!email || !password) {
    toast.error("Please fill in all fields");
    return false;
  }
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error("Invalid email format");
    return false;
  }

  // Validate password length
  if (password.length < 8 || password.length > 16) {
    toast.error("Password must be between 8 and 16 characters long");
    return false;
  }

  return true;
};

// Map error codes to user-friendly messages
const mapErrorCodeToMessage = (statusCode: number, errorData?: any): string => {
  switch (statusCode) {
    case 404:
      return "We couldn't find your account. Please check your email address.";
    case 401:
      return "The email or password you entered is incorrect. Please try again.";
    case 500:
      return "Our servers are currently experiencing issues. Please try again later.";
    default:
      return errorData?.detail || "An unexpected error occurred. Please try again.";
  }
};
