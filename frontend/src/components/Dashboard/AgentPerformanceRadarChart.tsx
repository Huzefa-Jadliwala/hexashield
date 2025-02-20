import React, { useEffect, useState } from "react";
import { ResponsiveRadar } from "@nivo/radar";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTaskData } from '../../hooks/useTaskData';

// Define types
interface AgentMetrics {
  [agent_name: string]: {
    agent_id: string;
    tasksCompleted: number;
    timeTaken: number;
  };
}

interface ChartData extends Record<string, unknown> {
  agent_name: string;
  agent_id: string;
  tasksCompleted: number;
  timeTaken: number;
}

const AgentPerformanceRadarChart: React.FC = () => {
  const { tasks, loading, error, noData } = useTaskData();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (tasks.length > 0) {
      const agentMetrics: AgentMetrics = {};

      tasks.forEach((task) => {
        const { agent_name, agent_id, execution_time } = task;

        if (!agentMetrics[agent_name]) {
          agentMetrics[agent_name] = {
            agent_id,
            tasksCompleted: 0,
            timeTaken: 0,
          };
        }

        agentMetrics[agent_name].tasksCompleted += 1;
        const time = parseFloat(parseFloat(execution_time.replace("s", "") || "0").toFixed(2));
        agentMetrics[agent_name].timeTaken += time;
      });

      const transformedData: ChartData[] = Object.keys(agentMetrics).map((agent_name) => ({
        agent_name,
        agent_id: agentMetrics[agent_name].agent_id,
        tasksCompleted: agentMetrics[agent_name].tasksCompleted,
        timeTaken: agentMetrics[agent_name].timeTaken,
      }));

      setChartData(transformedData);
    }
  }, [tasks]);

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
        <Typography variant="h6" color="textSecondary">No data available for Task Radar</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        bgcolor: "background.default",
        height: "400px",
        width: "100%",
        minWidth: "400px",
        position: "relative",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Agent Performance Across Metrics
      </h2>

      <ResponsiveRadar
        data={chartData}
        keys={["tasksCompleted", "timeTaken"]}
        indexBy="agent_name"
        maxValue="auto"
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
        curve="linearClosed"
        borderWidth={2}
        borderColor={{ from: "color" }}
        gridLevels={5}
        gridShape="circular"
        gridLabelOffset={36}
        enableDots={true}
        dotSize={12}
        dotColor={{ theme: "background" }}
        dotBorderWidth={3}
        dotBorderColor={{ from: "color", modifiers: [["darker", 0.1]] }}
        colors={{ scheme: "category10" }}
        fillOpacity={0.25}
        blendMode="multiply"
        animate={true}
        isInteractive={true}
        onClick={(data) => {
          console.log("Clicked data:", data);
          const agentData = chartData.find((item) => item.agent_name === data.agent_name);
          if (agentData) {
            navigate(`/agents/${agentData.agent_id}`);
          } else {
            console.error("Agent not found for indexValue:", data.indexValue);
          }
        }}
        theme={{
          dots: {
            text: {
              fill: "#fff",
            },
            
          },
          axis: {
            ticks: {
              text: {
                fill: "#ffffff", // Change tick text color to white
              },
            },
            legend: {
              text: {
                fill: "#ffffff", // Change legend text color to white
              },
            },
          },
          tooltip: {
            container: {
              background: "#222",
              color: "#fff",
              fontSize: "12px",
              borderRadius: "4px",
              boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.15)",
            },
          },
        }}
      />
    </Box>
  );
};

export default AgentPerformanceRadarChart;