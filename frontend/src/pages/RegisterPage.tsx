import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Checkbox,
  Link,
  FormControlLabel,
  Divider,
  Grid,
  InputAdornment,
} from "@mui/material";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import "./carousel.css"; // Import the custom CSS
import Image1 from "../assests/images/Image_1.png";
import Image2 from "../assests/images/Image_2.png";
import Image3 from "../assests/images/Image_3.png";
import Image4 from "../assests/images/Image_4.png";
import TermsAndConditions from "../components/TermsAndConditions";
import useSignUp from "hooks/useSignUp";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "@components/Google/GoogleSignIn";
import { useAuthContext } from "context/AuthContext";
import { Global, css } from "@emotion/react";
import usePasswordToggle from "hooks/usePasswordToggle";


const RegisterPage = () => {
  const { isAuthenticated } = useAuthContext();


  const { loading, signup } = useSignUp();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [termsOpen, setTermsOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [PasswordInputType, ToggleIcon] = usePasswordToggle(); // Use the custom hook



  const navigate = useNavigate(); // Use useNavigate hook

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);



  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAgreed(e.target.checked);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreed) {
      alert("You must agree to the terms and conditions to create an account.");
      return;
    }
    signup(formData);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
    });
  };

  const handleOpenTerms = () => {
    setTermsOpen(true);
  };

  const handleCloseTerms = () => {
    setTermsOpen(false);
  };

  return (
    <>
      {/* Global Styles */}
      <Global
        styles={css`
        body,
        html {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #202840;
        }
      `}
      />
      <Box sx={pageContainerStyle}>
        {/* Left Section */}
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
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 10,
                  }}
                />
              </div>
              <div>
                <img
                  src={Image2}
                  alt="Slide 2"
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 10,
                  }}
                />
              </div>
              <div>
                <img
                  src={Image3}
                  alt="Slide 3"
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: 10,
                  }}
                />
              </div>
            </Carousel>
          </Box>
        </Box>

        {/* Right Section */}
        <Box sx={rightContentStyle}>
          <Typography
            variant="h4"
            gutterBottom
            fontWeight="600"
            sx={{ fontSize: { xs: "1.8rem", sm: "2rem", md: "2.5rem" } }}
          >
            Create an account
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Already have an account?{" "}
            <Link
              href="#"
              color="#C487E0"
              underline="none"
              onClick={() => navigate("/login")}
            >
              Login
            </Link>
          </Typography>

          {/* Form Fields */}
          <Box
            component="form"
            noValidate
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="FirstName"
                  name="first_name"
                  variant="outlined"
                  value={formData.first_name}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={textFieldStyle}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="LastName"
                  name="last_name"
                  variant="outlined"
                  value={formData.last_name}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={textFieldStyle}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  variant="outlined"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={textFieldStyle}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={PasswordInputType} // Use the input type from the custom hook
                  value={formData.password}
                  onChange={handleChange}
                  InputLabelProps={{ style: { color: "#94A3B8" } }}
                  sx={textFieldStyle}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {ToggleIcon} {/* Use the toggle icon from the custom hook */}
                      </InputAdornment>
                    ),
                  }}
                />

              </Grid>
            </Grid>

            {/* Terms and Conditions */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={handleCheckboxChange}
                  sx={{
                    color: "#8B5CF6",
                    "&.Mui-checked": { color: "#8B5CF6" },
                  }}
                />
              }
              label={
                <Typography variant="body2" color="#94A3B8">
                  I agree to the{" "}
                  <Link
                    href="#"
                    color="#8B5CF6"
                    underline="none"
                    onClick={handleOpenTerms}
                  >
                    Terms & Conditions
                  </Link>
                </Typography>
              }
              sx={{ mt: 1, mb: 2 }}
            />

            {/* Submit Button */}
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
              }}
            >
              {loading ? "Creating account..." : "Create account"}
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
              or register with
            </Divider>

            {/* Social Buttons */}
            <GoogleSignIn />
          </Box>
        </Box>

        <TermsAndConditions open={termsOpen} onClose={handleCloseTerms} />
      </Box>
    </>
  );
};

/* Emotion Styles */
const pageContainerStyle = {
  display: "flex",
  alignItems: "center",
  height: "100vh",
  color: "#fff",
  fontFamily: "Arial, sans-serif",
  margin: "0 10%",
  justifyContent: "space-between",

  "@media (max-width: 768px)": {
    flexDirection: "column",
    margin: "0 5%",
    textAlign: "center",
  },
};

const rightContentStyle = {
  flex: 1,
  textAlign: "left", // Change text alignment to left
  "@media (max-width: 768px)": {
    marginBottom: "30px",
    textAlign: "center", // Center alignment on smaller screens
  },
};

const illustrationContainerStyle = {
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const illustrationBoxStyle = {
  backgroundColor: "#2a385d",
  borderRadius: "20px",
  padding: "20px",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)",
  maxWidth: "450px",
  width: "100%",
  textAlign: "center",

  "@media (max-width: 768px)": {
    padding: "15px",
  },
};

const textFieldStyle = {
  input: { color: "white" },
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#394970",
    borderRadius: "13px",
  },
};

export default RegisterPage;
