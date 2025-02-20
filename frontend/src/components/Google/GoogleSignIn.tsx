import React from "react";
import { auth, provider } from "./Config";
import { signInWithPopup, getAuth } from "firebase/auth";
import { Button } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { privateClient } from "@app/axios.client";
import { useAppDispatch } from '@app/hook';
import { fetchUserThunk } from '@app/users/slices/usersSlice';



const GoogleSignIn: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuthContext();
  const dispatch = useAppDispatch();

  const handleClick = () => {
    signInWithPopup(auth, provider)
      .then(async (data) => {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken(true); // Fetch ID Token

        if (!idToken) throw new Error("Failed to retrieve ID Token.");

        // Extract first and last name from _tokenResponse
        const tokenResponse = (data as any)._tokenResponse;
        const firstName = tokenResponse.firstName;
        const lastName = tokenResponse.lastName;




        const formData = new FormData();
        formData.append("idToken", idToken); // Send the ID token to the backend
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);

        try {
          const response = await privateClient.post("/auth/google", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (response.status === 201) {
            localStorage.setItem("isAuthenticated", "true");
            setIsAuthenticated(true); // Update context state
            const result = await dispatch(fetchUserThunk()).unwrap(); // Unwrap the result for direct access
            localStorage.setItem('user', JSON.stringify(result));
            navigate("/dashboard"); // Navigate to the home page
          } else {
            throw new Error(response.data.message || "Login failed.");
          }
        } catch (error) {
          console.error("Error during backend sign-in:", error);
        }
      })
      .catch((error) => {
        console.error("Error during sign-in:", error.message || error);
      });
  };

  return (
    <div>
      <Button
        onClick={handleClick}
        fullWidth
        startIcon={<GoogleIcon />}
        variant="outlined"
        sx={{
          color: "#94A3B8",
          borderColor: "#94A3B8",
          "&:hover": { borderColor: "#8B5CF6", color: "#8B5CF6" },
        }}
      >
        Google
      </Button>
    </div>
  );
};

export default GoogleSignIn;
