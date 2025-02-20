import React, { createContext, useState, useEffect, useContext } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

type ThemeContextType = {
  toggleTheme: () => void;
  mode: "light" | "dark";
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeContextProvider");
  }
  return context;
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    // Retrieve the saved theme mode from localStorage
    const savedMode = localStorage.getItem("themeMode");
    return savedMode === "light" ? "light" : "dark";
  });

  useEffect(() => {
    // Save the theme mode to localStorage whenever it changes
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  // Function to toggle between light and dark modes
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // Dynamically create the theme based on the current mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode, // 'light' or 'dark'

          primary: {
            main: "#d094ea", // The primary color
            light: "#e5b1f1", // Lighter shade of primary
            dark: "#9a68b0", // Darker shade of primary
            contrastText: "#ffffff", // Text color on primary
          },

          secondary: {
            main: "#f50057", // The secondary color
            light: "#ff5983", // Lighter shade of secondary
            dark: "#bb002f", // Darker shade of secondary
            contrastText: "#ffffff", // Text color on secondary
          },

          error: {
            main: "#f44336", // Color for error messages
            light: "#e57373", // Lighter shade of error
            dark: "#d32f2f", // Darker shade of error
            contrastText: "#ffffff", // Text color on error
          },

          warning: {
            main: "#ff9800", // Color for warnings
            light: "#ffb74d", // Lighter shade of warning
            dark: "#f57c00", // Darker shade of warning
            contrastText: "#000000", // Text color on warning
          },

          info: {
            main: "#2196f3", // Color for informational messages
            light: "#64b5f6", // Lighter shade of info
            dark: "#1976d2", // Darker shade of info
            contrastText: "#ffffff", // Text color on info
          },

          success: {
            main: "#4caf50", // Color for success messages
            light: "#81c784", // Lighter shade of success
            dark: "#388e3c", // Darker shade of success
            contrastText: "#ffffff", // Text color on success
          },

          text: {
            primary: mode === "light" ? "#000000" : "#ffffff", // Primary text color
            secondary: mode === "light" ? "#666666" : "#cccccc", // Secondary text color
            disabled: mode === "light" ? "rgba(0, 0, 0, 0.38)" : "rgba(255, 255, 255, 0.5)", // Disabled text color
          },

          background: {
            default: mode === "light" ? "#ffffff" : "#121212", // Default background color
            paper: mode === "light" ? "#f4f4f4" : "#1c1c1c", // Background color for paper components
          },

          divider: mode === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)", // Divider color

          action: {
            active: "rgba(0, 0, 0, 0.54)", // Active action color
            hover: "rgba(0, 0, 0, 0.08)", // Hover color
            hoverOpacity: 0.08, // Hover opacity
            selected: "rgba(0, 0, 0, 0.14)", // Selected color
            selectedOpacity: 0.14, // Selected opacity
            disabled: "rgba(0, 0, 0, 0.26)", // Disabled action color
            disabledBackground: "rgba(0, 0, 0, 0.12)", // Background color for disabled actions
            disabledOpacity: 0.38, // Disabled opacity
            focus: "rgba(0, 0, 0, 0.12)", // Focus color
            focusOpacity: 0.12, // Focus opacity
            activatedOpacity: 0.12, // Activated opacity
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
};
