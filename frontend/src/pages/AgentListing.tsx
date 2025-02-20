import { Box, Stack, Typography, Button, IconButton, Tooltip } from "@mui/material";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAgents } from "@app/agents/hooks"; // Hook to fetch agents
import CircleIcon from "@mui/icons-material/Circle";
import InfoIcon from "@mui/icons-material/Info";
import { keyframes } from "@emotion/react";

// Define pulsating animation
const pulsate = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.4); }
  50% { box-shadow: 0 0 15px rgba(0, 255, 0, 0.8); }
  100% { box-shadow: 0 0 5px rgba(0, 255, 0, 0.4); }
`;

const AgentListing: React.FC = () => {
  const { agents, loading, error } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Handle button click to select an agent
  const handleButtonClick = (agentId: string) => {
    console.log(`Agent selected: ${agentId}`);
    setSelectedAgentId(agentId);
    // You can add dispatch logic or additional functionality here
  };

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          bgcolor: "#131D3B",
          width: { xs: "100%", md: "300px" },
          height: { xs: "auto", md: "100vh" },
          padding: { xs: 2, md: 2 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "white",
            marginBottom: { xs: 3, md: 10 },
            textAlign: "center",
          }}
        >
          Available Agents
        </Typography>

        {/* Loading State */}
        {loading && <Typography sx={{ color: "white" }}>Loading...</Typography>}

        {/* Error State */}
        {error && <Typography sx={{ color: "red" }}>Error: {error}</Typography>}

        {/* Agent List */}
        {!loading && !error && agents.length === 0 && (
          <Typography sx={{ color: "white" }}>No agents available</Typography>
        )}

        <Stack spacing={2} sx={{ width: "100%" }}>
          {agents.map((agent) => (
            <NavLink
              key={agent._id}
              to={`/agents/${agent.agent_id}`}
              style={{ textDecoration: "none" }}
              activeStyle={{ color: "white" }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <Button
                  sx={{
                    width: "250px",
                    height: "40px",
                    borderRadius: "8px",
                    justifyContent: "space-between",
                    backgroundColor: isActive ? "white" : "#1e293b",
                    color: isActive ? "black" : "white",
                    "&:hover": {
                      backgroundColor: "#3b82f6",
                    },
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={() => handleButtonClick(agent._id)}
                >
                  <Typography
                    sx={{
                      textAlign: "left",
                      flexGrow: 1,
                      marginLeft: "8px",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Agent: {agent.client_info.hostname}
                  </Typography>
                  <CircleIcon
                    sx={{
                      color: agent.status === "online" ? "green" : "gray",
                      fontSize: "12px",
                      marginRight: "8px",
                      animation: agent.status === "online" ? `${pulsate} 1.5s infinite` : "none",
                      borderRadius: "50%",
                    }}
                  />
                  <Tooltip
                    title={
                      <Box>
                        <Typography variant="body2">
                          <strong>Hostname:</strong> {agent.client_info.hostname}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Username:</strong> {agent.client_info.username}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Platform:</strong> {agent.client_info.osinfo.platform}
                        </Typography>
                        <Typography variant="body2">
                          <strong>OS:</strong> {agent.client_info.osinfo.os}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Kernel:</strong> {agent.client_info.osinfo.kernel}
                        </Typography>
                        {/* <Typography variant="body2">
                          <strong>IP Address:</strong> {agent.client_info.ip}
                        </Typography> */}
                        <Typography variant="body2">
                          <strong>Status:</strong> {agent.status}
                        </Typography>
                      </Box>
                    }
                    placement="top"
                    arrow
                  >
                    <IconButton
                      sx={{
                        color: isActive ? "black" : "white",
                        marginRight: "8px",
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </Button>
              )}

            </NavLink>
          ))}
        </Stack>
      </Box>

      {/* Content Area */}
      <Box
        sx={{
          flexGrow: 1,
          padding: { xs: 2, sm: 3 },
          overflowY: "auto",
        }}
      >
        <Outlet context={{ selectedAgentId }} />
      </Box>
    </Box>
  );
};

export default AgentListing;
