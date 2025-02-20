import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Box, Button, TextField, Typography, Grid } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./carousel.css"; // Import the custom CSS
import Image1 from "../assests/images/Image_1.png";
import Image2 from "../assests/images/Image_2.png";
import Image3 from "../assests/images/Image_3.png";
import Image4 from "../assests/images/Image_4.png";
import toast, { Toaster } from "react-hot-toast";
import { Global, css } from '@emotion/react';
import { privateClient } from '@app/axios.client';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'newPassword') {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }
    try {
      const response = await privateClient.post("/auth/reset-password", {
        token,
        new_password: newPassword,
      }, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = response.data;
      setMessage(data.message);
      toast.success(data.message);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/login");
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
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your new password below.
          </Typography>

          {/* Form Fields */}
          <Box component="form" noValidate autoComplete="off" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  variant="outlined"
                  type="password"
                  value={newPassword}
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
                  label="Confirm Password"
                  name="confirmPassword"
                  variant="outlined"
                  type="password"
                  value={confirmPassword}
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
            </Grid>

            <Button
              fullWidth
              type="submit"
              variant="contained"
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
              Reset Password
            </Button>
          </Box>
          {message && (
            <Typography variant="body2" sx={{ mt: 2, color: "white" }}>
              {message}
            </Typography>
          )}
        </Box>
      </Box>
      <Toaster />
    </>
  );
};

/* Emotion Styles */
const pageContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  height: '100vh',
  color: '#fff',
  fontFamily: 'Arial, sans-serif',
  margin: '0 10%',
  justifyContent: 'space-between',

  '@media (max-width: 768px)': {
    flexDirection: 'column',
    margin: '0 5%',
    textAlign: 'center',
  },
};

const leftContentStyle = {
  flex: 1,
  textAlign: 'left',

  '@media (max-width: 768px)': {
    marginBottom: '30px',
  },
};

const illustrationContainerStyle = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const illustrationBoxStyle = {
  backgroundColor: '#2a385d',
  borderRadius: '20px',
  padding: '20px',
  boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
  maxWidth: '450px',
  width: '100%',
  textAlign: 'center',

  '@media (max-width: 768px)': {
    padding: '15px',
  },
};

export default ResetPassword;