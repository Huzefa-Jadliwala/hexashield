import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Box,
  Typography,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Dashboard,
  Chat,
  Settings,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import HexaLayerImage from '../assests/images/HexaLayer.png';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import DnsIcon from '@mui/icons-material/Dns';
import useLogout from 'hooks/useLogout';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import SummarizeIcon from '@mui/icons-material/Summarize';
import WebAssetIcon from '@mui/icons-material/WebAsset';

const LeftSidebar: React.FC<{
  open: boolean;
  setSidebarOpen: (open: boolean) => void;
}> = ({ open, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { logout } = useLogout();


  const sidebarItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { label: 'Chats', icon: <Chat />, path: '/conversations' },
    { label: 'Agents', icon: <DnsIcon />, path: '/agents' },
    { label: 'Manual Reports', icon: <SummarizeIcon />, path: '/manual-reports' },
    { label: 'Auto Reports', icon: <AutoModeIcon />, path: '/auto-reports' },
    { label: 'Webhex Reports', icon: <WebAssetIcon />, path: '/webhex-reports' },

  ];

  const userItems = [
    { label: 'User Settings', icon: <Settings />, path: '/user-profile' },
    { label: 'Logout', icon: <Logout />, path: '/login' },
  ];

  const handleNavigation = (path: string, label: string) => {
    if (label === 'Logout') {
      logout(); // Call the logout function
    }
    navigate(path);
    if (isMobile) setSidebarOpen(false); // Close sidebar on mobile after navigation
  };


  const isSelected = (path: string) => location.pathname.startsWith(path);

  return (
    <Drawer
      sx={{
        "& .MuiDrawer-paper": {
          width: isMobile ? "100%" : 260,
          height: isMobile ? "50%" : "100%",
          boxSizing: "border-box",
          backgroundColor: "#202940",
          color: "white",
        },
      }}
      variant={isMobile ? "temporary" : "persistent"}
      anchor={isMobile ? "top" : "left"}
      open={open}
      onClose={() => setSidebarOpen(false)} // Close sidebar on mobile when clicked outside
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          padding: "20px",
          borderBottom: "1px solid #3c3c3c",
        }}
      >
        <img src={HexaLayerImage} alt="HexaLayer Logo" height={30} width={30} />
        <Typography
          variant="h6"
          sx={{ color: "white", flexGrow: 1, fontFamily: "roboto" }}
        >
          HexaShield
        </Typography>
        {isMobile && (
          <Button variant="contained" onClick={() => setSidebarOpen(false)}>
            <MenuOpenIcon />
          </Button>
        )}
      </Box>


      <Divider />

      <List>
        {sidebarItems.map((item) => (
          <Tooltip key={item.label} title={item.label}>
            <ListItemButton
              onClick={() => handleNavigation(item.path, item.label)}
              sx={{
                padding: '10px 20px',
                backgroundColor: isSelected(item.path)
                  ? theme.palette.background.default
                  : 'transparent',
                borderRadius: '12px 0px 0px 12px',
                marginLeft: isSelected(item.path) ? '15px' : '0px',
                '&:hover': { backgroundColor: theme.palette.action.hover },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {item.icon}
                <ListItemText primary={item.label} sx={{ color: '#fff' }} />
              </Box>
            </ListItemButton>
          </Tooltip>
        ))}                         
      </List>

      <Divider />

      <List sx={{ marginTop: 'auto' }}>
        {userItems.map((item) => (

          <Tooltip key={item.label} title={item.label}>
            <ListItemButton
              onClick={() => handleNavigation(item.path, item.label)}
              sx={{
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {item.icon}
                <ListItemText primary={item.label} sx={{ color: "#fff" }} />
              </Box>
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  );
};

export default LeftSidebar;
