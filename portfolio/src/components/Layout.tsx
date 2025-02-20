import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Container } from "@mui/material";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";

const Layout: React.FC = () => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Header />
      {/* <Toolbar /> This adds space equivalent to the height of the header */}
      <Container
        component={motion.main}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{ flexGrow: 1, mt: 4 }}
      >
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;