import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTaskData } from '../../hooks/useTaskData';

interface ChartData {
  agent_name: string;
  agent_id: string;
  [key: string]: string | number;
}

const TaskStatusByAgentChart: React.FC = () => {
  const { tasks, loading, error, noData } = useTaskData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Process the data
  const taskStatusByAgent: { [agent_name: string]: { [status: string]: number } } = {};
  const agentIds: { [agent_name: string]: string } = {};
  const possibleStatuses = ['success', 'failure'];

  tasks.forEach((task) => {
    if (!taskStatusByAgent[task.agent_name]) {
      taskStatusByAgent[task.agent_name] = {};
      agentIds[task.agent_name] = task.agent_id;
    }
    if (!taskStatusByAgent[task.agent_name][task.status]) {
      taskStatusByAgent[task.agent_name][task.status] = 0;
    }
    taskStatusByAgent[task.agent_name][task.status]++;
  });

  // Transform data for the chart
  const chartData: ChartData[] = Object.keys(taskStatusByAgent).map((agent_name) => {
    const agentData: ChartData = {
      agent_name,
      agent_id: agentIds[agent_name],
    };
    possibleStatuses.forEach((status) => {
      agentData[status] = taskStatusByAgent[agent_name][status] || 0;
    });
    return agentData;
  });

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
        <Typography variant="h6" color="textSecondary">No data available for For Task Status Chart</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      flexGrow: 1,
      bgcolor: 'background.default',
      height: '350px',
      width: '100%',
      minWidth: '350px',
    }}>
      <h2 style={{ textAlign: 'center' }}>Task Status by Agent</h2>
      <ResponsiveBar
        data={chartData}
        keys={possibleStatuses}
        indexBy="agent_name"
        margin={{ top: 10, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        groupMode="stacked"
        colors={{ scheme: 'set3' }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Agent',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Number of Tasks',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        theme={{
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
          legends: {
            text: {
              fill: "#ffffff", // Change legend text color to white
            },
          },
        }}
        tooltip={({ id, value, color, indexValue }) => (
          <div style={{
            background: color,
            padding: '5px 10px',
            borderRadius: '4px',
            color: '#000',
          }}>
            <strong>{indexValue} ({id})</strong>: {value} tasks
          </div>
        )}
        onClick={(node) => {
          const agentData = chartData.find((data) => data.agent_name === node.indexValue);
          if (agentData?.agent_id) {
            navigate(`/agents/${agentData.agent_id}`);
          }
        }}
        role="application"
        ariaLabel="Task status by agent bar chart"
        barAriaLabel={(e) => `${e.id}: ${e.formattedValue} tasks for agent ${e.indexValue}`}
      />
    </Box>
  );
};

export default TaskStatusByAgentChart;