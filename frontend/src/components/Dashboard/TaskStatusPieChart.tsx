import React, { useEffect, useState } from 'react';
import { ResponsivePie } from '@nivo/pie';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTaskData } from '../../hooks/useTaskData';

// Define the type for the chart data
interface ChartData {
  id: string;
  label: string;
  value: number;
  percentage: string;
  agent_id: string;
}

const TaskStatusPieChart: React.FC = () => {
  const { tasks, loading, error, noData } = useTaskData();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const navigate = useNavigate(); // Initialize navigate hook

  useEffect(() => {
    if (tasks.length > 0) {
      // Process the data to create chart data
      const taskStatusCount: { [status: string]: { count: number; agent_id: string } } = {};

      tasks.forEach((task) => {
        if (!taskStatusCount[task.status]) {
          taskStatusCount[task.status] = { count: 0, agent_id: task.agent_id };
        }
        taskStatusCount[task.status].count++;
      });

      const totalTasks = tasks.length;
      const chartData = Object.keys(taskStatusCount).map((status) => ({
        id: status,
        label: status,
        value: taskStatusCount[status].count,
        percentage: ((taskStatusCount[status].count / totalTasks) * 100).toFixed(2) + '%',
        agent_id: taskStatusCount[status].agent_id,
      }));

      setChartData(chartData);
    }
  }, [tasks]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
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

  if (noData) {
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
        <Typography variant="h6" color="textSecondary">No data available for Status Pie Chart</Typography>
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
        minWidth: "350px"
      }}
    >
      <h2 style={{ textAlign: "center" }}>Task Status Overview</h2>
      <ResponsivePie
        data={chartData}
        margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
        innerRadius={0.5} // Donut chart
        padAngle={0.7}
        cornerRadius={3}
        activeOuterRadiusOffset={10}
        colors={{ scheme: "pastel1" }}
        borderWidth={1}
        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#fff"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: "color" }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
        tooltip={({ datum: { id, value, color, data } }) => (
          <div
            style={{
              backgroundColor: "#1a202c",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              boxShadow: "0px 2px 4px rgba(0,0,0,0.25)",
              maxWidth: "200px",
            }}
          >
            <strong style={{ color }}>{id}</strong>
            <div>Tasks: {value}</div>
            <div>Percentage: {data.percentage}%</div>
          </div>
        )}
        onClick={(datum) => {
          const agent_id = datum.data.agent_id;
          if (agent_id) {
            navigate(`/agents/${agent_id}`);
          }
        }}
      />
    </Box>
  );
};

export default TaskStatusPieChart;
