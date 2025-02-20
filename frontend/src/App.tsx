import React, { useState } from 'react';
import { CssBaseline, Box, Button, useMediaQuery, ThemeProvider, createTheme } from '@mui/material';
import { Outlet } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';

const theme = createTheme({
  palette: {
    background: { default: '#0A0F29', paper: '#0A0F29' },
    primary: { main: '#E5E5E5' },
    secondary: { main: '#00D9F9' },
    text: { primary: '#E5E5E5', secondary: '#AB47BC' },
    divider: '#202940',
  },
});

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        {/* Sidebar */}
        <LeftSidebar open={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Main Content */}
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
            overflow: 'auto',
            transition: 'margin-left 0.3s ease',
            marginLeft: sidebarOpen && !isMobile ? '260px' : '0',
          }}
        >
          {!sidebarOpen && (
            <Button
              variant="contained"
              sx={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}
              onClick={() => setSidebarOpen(true)}
            >
              <MenuOpenIcon sx={{ color: 'white' }} />
            </Button>
          )}
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default App;
