/** @jsxImportSource @emotion/react */
import React, { useState, ChangeEvent, FormEvent } from "react";
import { css, Global } from "@emotion/react";
import { Box, Button, TextField, Typography, Link, Grid, Divider, InputAdornment } from "@mui/material";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./carousel.css"; // Import the custom CSS
import Image1 from "../assests/images/Image_1.png";
import Image2 from "../assests/images/Image_2.png";
import Image3 from "../assests/images/Image_3.png";
import Image4 from "../assests/images/Image_4.png";
import toast, { Toaster } from "react-hot-toast";
import useLogin from "hooks/useLogin";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "context/AuthContext";
import GoogleSignIn from "@components/Google/GoogleSignIn";
import usePasswordToggle from "hooks/usePasswordToggle";

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuthContext();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { loading, login } = useLogin();
  const navigate = useNavigate(); // Use useNavigate hook
  const [PasswordInputType, ToggleIcon] = usePasswordToggle(); // Use the custom hook


  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(formData);
      setFormData({
        email: "",
        password: "",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    }
  };

  return (
    <>
      {/* Global Styles */}
      <Global
        styles={css`
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #202840;
          }
        `}
      />

      <Box sx={pageContainerStyle}>
        {/* Right Illustration Content */}
        <Box sx={illustrationContainerStyle}>
          <Box sx={illustrationBoxStyle}>
            <Carousel
              showThumbs={false}
              autoPlay
              infiniteLoop
              showStatus={false}
              emulateTouch
              interval={5000}
              showArrows={false}
            >
              <div>
                <img
                  src={Image4}
                  alt="Slide 3"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }}
                />
              </div>
              <div>
                <img
                  src={Image1}
                  alt="Slide 1"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }}
                />
              </div>
              <div>
                <img
                  src={Image2}
                  alt="Slide 2"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }}
                />
              </div>
              <div>
                <img
                  src={Image3}
                  alt="Slide 3"
                  style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 10 }}
                />
              </div>
            </Carousel>
          </Box>
        </Box>

        {/* Left Content */}
        <Box sx={leftContentStyle}>
          <Typography variant="h4" gutterBottom fontWeight="600">
            Log in to your account
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Don't have an account?{" "}
            <Link
              href="#"
              color="#C487E0"
              underline="none"
              onClick={() => navigate("/register")} // Navigate to register page
            >
              Register
            </Link>
          </Typography>
          <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  variant="outlined"
                  value={formData.email}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={{
                    input: { color: "white" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#394970",
                      borderRadius: "13px",
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  variant="outlined"
                  type={PasswordInputType} // Use the input type from the custom hook
                  value={formData.password}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={{
                    input: { color: "white" },
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "#394970",
                      borderRadius: "13px",
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {ToggleIcon} {/* Use the toggle icon from the custom hook */}
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} textAlign="left" marginTop={-1}>
                <Link
                  href="/recover-password"
                  variant="body2"
                  color="inherit"
                  sx={{
                    "&:hover": {
                      color: "#8B5CF6",
                    },
                  }}
                >
                  Forgot Password?
                </Link>
              </Grid>
            </Grid>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: "#A78BFA",
                "&:hover": { backgroundColor: "#C487E0" },
                color: "white",
                py: 1.5,
                fontSize: "1rem",
                borderRadius: "10px",
                mt: 2,
              }}
            >
              {loading ? "Logging in..." : "Log in"}
            </Button>
            {/* Divider */}
            <Divider
              sx={{
                my: 3,
                "&::before, &::after": {
                  borderColor: "white",
                },
                color: "#94A3B8",
                textAlign: "center",
              }}
            >
              or login with
            </Divider>

            {/* Social Buttons */}
            <GoogleSignIn />
          </Box>
        </Box>
      </Box>
      <Toaster />
    </>
  );
};

/* Emotion Styles */
const pageContainerStyle = css`
  display: flex;
  align-items: center;
  height: 100vh;
  color: #fff;
  font-family: Arial, sans-serif;
  margin: 0 10%;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    margin: 0 5%;
    text-align: center;
  }
`;

const leftContentStyle = css`
  flex: 1;
  text-align: left;

  @media (max-width: 768px) {
    margin-bottom: 30px;
  }
`;

const illustrationContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    order: -1; /* Move carousel to the bottom on smaller screens */
    margin-bottom: 30px;
  }
`;

const illustrationBoxStyle = css`
  background-color: #2a385d;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

export default LoginPage;
