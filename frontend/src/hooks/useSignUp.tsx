import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { privateClient } from "@app/axios.client";
import axios from "axios";

interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

const useSignUp = () => {
  const [loading, setLoading] = useState(false);
  const {  setIsAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  const signup = async ({ first_name,
    last_name, email, password }: SignUpData) => {
    const success = handleInputErrors({
      first_name,
      last_name,
      email,
      password
    });
    if (!success) {
      return;
    }
    setLoading(true);

    const formData = new FormData();

    formData.append("first_name", first_name);
    formData.append("last_name", last_name);
    formData.append("email", email);
    formData.append("password", password);
    try {
      const res = await privateClient.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (res.status !== 201) {
        const errorData = res.data;
        const errorMessage = mapErrorCodeToMessage(res.status, errorData);
        toast.error(errorMessage);
        return;
      }

      setIsAuthenticated(true)
      navigate('/'); // Redirect to home page after successful signup

      
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

  return { loading, signup };
};

export default useSignUp;

function handleInputErrors({ first_name, last_name, email, password }: SignUpData) {
  if (!first_name || !last_name || !email || !password) {
    toast.error("Please fill all the fields");
    return false;
  }

  if (first_name.length < 1 || first_name.length > 20) {
    toast.error("First name must be between 1 and 20 characters");
    return false;
  }

  if (last_name.length < 1 || last_name.length > 20) {
    toast.error("Last name must be between 1 and 20 characters");
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    toast.error("Invalid email format");
    return false;
  }

  if (password.length < 8 || password.length > 16) {
    toast.error("Password must be between 8 and 16 characters");
    return false;
  }

  return true;
}

// Map error codes to user-friendly messages
const mapErrorCodeToMessage = (statusCode: number, errorData?: any): string => {
  switch (statusCode) {
    case 400:
      return "Invalid registration details. Please check your input and try again.";
    case 409:
      return "An account with this email already exists. Please use a different email.";
    case 500:
      return "Our servers are currently experiencing issues. Please try again later.";
    default:
      return errorData?.detail || "An unexpected error occurred. Please try again.";
  }
};