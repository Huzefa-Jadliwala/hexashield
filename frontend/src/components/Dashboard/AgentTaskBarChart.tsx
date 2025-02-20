import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTaskData } from '../../hooks/useTaskData';

const AgentTaskBarChart: React.FC = () => {
  const { tasks, loading, error, noData } = useTaskData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Process the data
  const agentTaskCounts: { [key: string]: number } = {};
  const agentIds: { [key: string]: string } = {};

  tasks.forEach((task) => {
    if (!agentTaskCounts[task.agent_name]) {
      agentTaskCounts[task.agent_name] = 0;
      agentIds[task.agent_name] = task.agent_id;
    }
    agentTaskCounts[task.agent_name]++;
  });

  const chartData = Object.keys(agentTaskCounts).map((agent_name) => ({
    agent_name,
    agent_id: agentIds[agent_name],
    tasks: agentTaskCounts[agent_name],
  }));

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "400px",
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="h6" color="error">
          Error loading data: {error.message}
        </Typography>
      </Box>
    );
  }

  if (noData || chartData.length === 0) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '350px',
        width: '100%',
        minWidth: '350px',
        bgcolor: 'background.default',
      }}>
        <Typography variant="h6" color="textSecondary">No data available for Task Bar</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        height: "350px",
        width: "100%",
        minWidth: "350px",
      }}
    >
      <h2 style={{ textAlign: "center" }}>Tasks Per Agent</h2>
      <ResponsiveBar
        data={chartData}
        keys={["tasks"]}
        indexBy="agent_name"
        margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
        padding={0.3}
        colors={{ scheme: "category10" }}
        borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45, // Rotate agent names for better visibility
          legend: "Agent",
          legendPosition: "middle",
          legendOffset: 60,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Tasks",
          legendPosition: "middle",
          legendOffset: -60,
        }}
        tooltip={({ id, value, color }) => (
          <div
            style={{
              padding: "10px",
              color: "#fff",
              backgroundColor: color,
              borderRadius: "5px",
              boxShadow: "0px 2px 4px rgba(0,0,0,0.25)",
            }}
          >
            <strong>Agent: {id}</strong>
            <div>Tasks Run: {value}</div>
          </div>
        )}
        theme={{
          axis: {
            ticks: {
              line: { stroke: "#ddd", strokeWidth: 1 },
              text: { fill: "#fff" },
            },
            legend: {
              text: {
                fill: "#ffffff", // Change legend text color to white
              },
            },
          },
          grid: { line: { stroke: "#eee", strokeWidth: 1 } },
        }}
        onClick={(node) => {
          const agentData = chartData.find((data) => data.agent_name === node.indexValue);
          if (agentData && agentData.agent_id) {
            navigate(`/agents/${agentData.agent_id}`);
          } else {
            console.warn("Agent data not found for:", node.indexValue);
          }
        }}
      />
    </Box>
  );
};

export default AgentTaskBarChart;