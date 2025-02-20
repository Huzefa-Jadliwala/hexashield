import React, { useState, useEffect } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  CssBaseline,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Collapse,
  useMediaQuery,
  useTheme,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import HexaLayer from "../assests/images/HexaLayer.png";
import { scroller } from "react-scroll";
import { useThemeContext } from "../context/ThemeContext";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { toggleTheme, mode } = useThemeContext();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMenuToggle = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (section: string) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { section } });
    } else {
      scroller.scrollTo(section, {
        smooth: true,
        duration: 500,
      });
    }
  };

  useEffect(() => {
    if (location.state && location.state.section) {
      scroller.scrollTo(location.state.section, {
        smooth: true,
        duration: 500,
      });
    }
  }, [location]);

  return (
    <>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          transition: "background-color 0.3s",
          backgroundColor: scrolled ? theme.palette.background.default : "transparent",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo and Title */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <RouterLink to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
              <img src={HexaLayer} alt="Logo" style={{ height: "40px", marginRight: "8px" }} />
              <Typography variant="h6" color={theme.palette.text.primary}>
                Hexalayer
              </Typography>
            </RouterLink>
          </Box>

          {/* Links, Theme Toggle, and Menu Icon */}
          <Box sx={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {!isMobile && (
              <Box sx={{ display: "flex", gap: "1.5rem" }}>
                {["home", "team", "contact-us"].map((section) => (
                  <Typography
                    key={section}
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      transition: "color 0.3s, transform 0.3s",
                      cursor: "pointer",
                      "&:hover": {
                        color: theme.palette.primary.main,
                        transform: "scale(1.1)",
                      },
                      "&:active": {
                        color: theme.palette.primary.dark,
                        transform: "scale(0.95)",
                      },
                    }}
                    onClick={() => handleNavClick(section)}
                  >
                    {section.replace("-", " ").toUpperCase()}
                  </Typography>
                ))}
                <RouterLink to="/features" style={{ textDecoration: "none" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      transition: "color 0.3s, transform 0.3s",
                      "&:hover": {
                        color: theme.palette.primary.main,
                        transform: "scale(1.1)",
                      },
                      "&:active": {
                        color: theme.palette.primary.dark,
                        transform: "scale(0.95)",
                      },
                    }}
                  >
                    OUR OFFERING
                  </Typography>
                </RouterLink>
                <RouterLink to="/blogs" style={{ textDecoration: "none" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: theme.palette.text.primary,
                      transition: "color 0.3s, transform 0.3s",
                      "&:hover": {
                        color: theme.palette.primary.main,
                        transform: "scale(1.1)",
                      },
                      "&:active": {
                        color: theme.palette.primary.dark,
                        transform: "scale(0.95)",
                      },
                    }}
                  >
                    BLOGS
                  </Typography>
                </RouterLink>
              </Box>
            )}
            {/* Theme Toggle Icon */}
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === "dark" ? (
                <Brightness7Icon sx={{ color: theme.palette.text.primary }} />
              ) : (
                <Brightness4Icon sx={{ color: theme.palette.text.primary }} />
              )}
            </IconButton>
            {isMobile && (
              <IconButton color="inherit" onClick={handleMenuToggle}>
                {menuOpen ? (
                  <CloseIcon sx={{ color: theme.palette.text.primary }} />
                ) : (
                  <MenuIcon sx={{ color: theme.palette.text.primary }} />
                )}
              </IconButton>
            )}
          </Box>
        </Toolbar>

        {/* Mobile Menu */}
        {isMobile && (
          <Collapse in={menuOpen} timeout="auto" unmountOnExit>
            <List
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                position: "absolute",
                top: "64px",
                left: 0,
                width: "100%",
                zIndex: 10,
              }}
            >
              {["home", "team", "contact-us"].map((section) => (
                <ListItem
                  key={section}
                  component="div" // or 'button', 'a' depending on your use case
                  onClick={() => {
                    closeMenu();
                    handleNavClick(section);
                  }}
                  sx={{ cursor: "pointer", textAlign: "center" }}
                >
                  <ListItemText
                    primary={section.replace("-", " ").toUpperCase()}
                    sx={{
                      color: theme.palette.primary.contrastText,
                      "&:hover": {
                        color: theme.palette.secondary.light,
                      },
                    }}
                  />
                </ListItem>
              ))}
              <ListItem
                component={RouterLink}
                to="/blogs"
                onClick={closeMenu}
                sx={{ cursor: "pointer", textAlign: "center" }}
              >
                <ListItemText
                  primary="BLOGS"
                  sx={{
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      color: theme.palette.secondary.light,
                    },
                  }}
                />
              </ListItem>
              <ListItem
                component={RouterLink}
                to="/Features"
                onClick={closeMenu}
                sx={{ cursor: "pointer", textAlign: "center" }}
              >
                <ListItemText
                  primary="FEATURES"
                  sx={{
                    color: theme.palette.primary.contrastText,
                    "&:hover": {
                      color: theme.palette.secondary.light,
                    },
                  }}
                />
              </ListItem>
            </List>
          </Collapse>
        )}
      </AppBar>
    </>
  );
};

export default Header;