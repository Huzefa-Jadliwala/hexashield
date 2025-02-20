import { Box, Grid, CircularProgress, Typography } from "@mui/material";
import TaskStatusPieChart from "../components/Dashboard/TaskStatusPieChart";
import AgentTaskBarChart from "../components/Dashboard/AgentTaskBarChart";
import TaskCompletionTrends from "../components/Dashboard/TaskCompletionTrends";
import AgentPerformanceRadarChart from "../components/Dashboard/AgentPerformanceRadarChart";
import TaskStatusByAgentChart from "../components/Dashboard/TaskStatusByAgentChart";
import { useTaskData } from "hooks/useTaskData";

const DashboardPage: React.FC = () => {
  const { loading, error, noData } = useTaskData();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="h6" color="error">
          Error loading data: {error.message}
        </Typography>
      </Box>
    );
  }

  if (noData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "350px",
          width: "100%",
          minWidth: "350px",
          bgcolor: "background.default",
        }}
      >
        <Typography variant="h6" color="textSecondary" textAlign="center">
          No data available yet!  
          Connect your agents to start gathering valuable insights.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        height: "100vh",
        p: { xs: 1, sm: 3, md: 4 }, // Responsive padding
        bgcolor: "background.default",
      }}
    >
      {/* Dashboard Charts */}
      <Grid container spacing={3}>
        {/* First Row */}
        <Grid item xs={12} sm={12} md={8} marginBottom={"20px"}>
          <TaskCompletionTrends />
        </Grid>
        <Grid item xs={12} sm={12} md={4} marginBottom={"20px"}>
          <AgentPerformanceRadarChart />
        </Grid>

        {/* Second Row */}
        <Grid item xs={12} sm={6} md={4} marginBottom={"20px"}>
          <TaskStatusPieChart />
        </Grid>
        <Grid item xs={12} sm={6} md={4} marginBottom={"20px"}>
          <AgentTaskBarChart />
        </Grid>
        <Grid item xs={12} sm={6} md={4} marginBottom={"20px"}>
          <TaskStatusByAgentChart />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
