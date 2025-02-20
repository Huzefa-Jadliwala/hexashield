import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { FaBullseye } from "react-icons/fa";

const Purpose: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <Box
            sx={{
                py: { xs: 4, md: 6 }, // Adjusted padding-y for top and bottom
                px: { xs: 2, md: 4 },
                backgroundColor: theme => theme.palette.mode === 'dark' ? "#388e3c" : "#c8e6c9", // Green shades
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "70vh", // Fixed minimum height
                overflow: "hidden",
                position: "relative",
                borderRadius: "20px", // Rounded corners
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: theme => theme.palette.mode === 'dark' ? "rgba(0, 0, 0, 0.65)" : "rgba(0, 0, 0, 0.35)", // Dark overlay
                    zIndex: 1,
                },
                backgroundAttachment: "fixed", // Parallax effect
            }}
        >
            <Box
                sx={{
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 2,
                    textAlign: "center",
                    maxWidth: "80%",
                }}
            >
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: isVisible ? 1 : 0, y: 0 }}
                    transition={{ duration: 1.5 }}
                    style={{
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <motion.div
                        animate={{
                            y: [0, -15, 0], // Floating effect for the icon
                            scale: [1, 1.1, 1], // Bouncing effect
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                        }}
                    >
                        <FaBullseye
                            size={80} // Adjusted icon size
                            color="#ffd700"
                            aria-label="Bullseye icon representing purpose"
                            style={{
                                filter: "drop-shadow(0 0 25px #ffd700)",
                                transition: "transform 0.3s ease-in-out", // Hover scale effect
                            }}
                        />
                    </motion.div>
                    <Typography
                        variant="h4" // Adjusted font size
                        sx={{
                            mt: 2,
                            fontWeight: "bold",
                            fontFamily: "'Poppins', sans-serif",
                            textTransform: "uppercase",
                            letterSpacing: "2px",
                            color: "#ffffff",
                            textShadow: "4px 4px 8px rgba(0, 0, 0, 0.4)", // Added shadow for emphasis
                            "&:hover": {
                                transform: "scale(1.1)",
                                transition: "transform 0.3s ease-in-out",
                            },
                        }}
                    >
                        Our Purpose
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            mt: 2,
                            lineHeight: 1.8,
                            fontFamily: "'Roboto', sans-serif",
                            fontSize: { xs: "0.9rem", md: "1rem" },
                            fontWeight: 300,
                            maxWidth: "80%",
                            color: "#e0e0e0",
                            opacity: 0.9,
                            "&:hover": {
                                color: "#eec6fe",
                                transition: "color 0.3s ease-in-out",
                            },
                        }}
                    >
                        Delivering excellence through AI-powered security for a safer and more trustworthy digital world.
                    </Typography>
                </motion.div>
            </Box>
        </Box>
    );
};

export default Purpose;