import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveLine } from "@nivo/line";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useTaskData } from '../../hooks/useTaskData';

interface ChartDataPoint {
  x: string;
  y: number;
  agent_ids: string[]; // Changed to array to store multiple agent IDs
}

interface LineChartData {
  id: string;
  color: string;
  data: ChartDataPoint[];
}

const TaskCompletionTrends: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, loading, error, noData } = useTaskData();
  const [chartData, setChartData] = useState<LineChartData[]>([]);

  useEffect(() => {
    if (tasks.length > 0) {
      // Create a map to aggregate tasks by date
      const tasksByDate = new Map<string, { count: number; agent_ids: string[] }>();

      tasks.forEach((task) => {
        const date = new Date(task.completed_at).toLocaleDateString("en-US");

        if (!tasksByDate.has(date)) {
          tasksByDate.set(date, { count: 0, agent_ids: [] });
        }

        const dateData = tasksByDate.get(date)!;
        dateData.count += 1;
        dateData.agent_ids.push(task.agent_id);
      });

      // Convert map to sorted array of data points
      const sortedDates = Array.from(tasksByDate.keys()).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );

      const aggregatedData = sortedDates.map(date => ({
        x: date,
        y: tasksByDate.get(date)!.count,
        agent_ids: tasksByDate.get(date)!.agent_ids
      }));

      const chartData: LineChartData[] = [
        {
          id: "Task Completion",
          color: "hsl(220, 70%, 50%)",
          data: aggregatedData,
        },
      ];

      setChartData(chartData);
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
      }}
    >
      <h2 style={{ textAlign: "center" }}>Task Completion Trends</h2>
      <ResponsiveLine
        data={chartData}
        margin={{ top: 10, right: 110, bottom: 70, left: 60 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: 0, // Set minimum to 0 to better show task counts
          max: "auto",
          stacked: false,
          reverse: false,
        }}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: "Date",
          legendOffset: 40,
          legendPosition: "middle",
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Tasks Completed",
          legendOffset: -50,
          legendPosition: "middle",
        }}
        enableGridX={true}
        enableGridY={true}
        colors={{ scheme: "set2" }}
        pointSize={10}
        pointColor={{ from: "color", modifiers: [] }}
        pointBorderWidth={2}
        pointBorderColor={{ from: "serieColor" }}
        pointLabelYOffset={-12}
        useMesh={true}
        animate={true}
        motionConfig="wobbly"
        tooltip={({ point }) => (
          <div
            style={{
              backgroundColor: point.serieColor,
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "4px",
            }}
          >
            <strong>{point.data.xFormatted}</strong>: {point.data.yFormatted} tasks
          </div>
        )}
        legends={[
          {
            anchor: "bottom-right",
            direction: "column",
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: "left-to-right",
            itemWidth: 93,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: "circle",
            symbolBorderColor: "rgba(0, 0, 0, .5)",
            effects: [
              {
                on: "hover",
                style: {
                  itemBackground: "rgba(0, 0, 0, .03)",
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        onClick={(point) => {
          // Modified to handle multiple agent IDs
          const agent_ids = (point.data as unknown as ChartDataPoint).agent_ids;
          if (agent_ids && agent_ids.length > 0) {
            // For now, navigate to the first agent's page
            // You might want to modify this to show a selection dialog
            navigate(`/agents/${agent_ids[0]}`);
          }
        }}
        theme={{
          axis: {
            ticks: {
              text: {
                fill: "#ffffff",
              },
            },
            legend: {
              text: {
                fill: "#ffffff",
              },
            },
          },
          legends: {
            text: {
              fill: "#ffffff",
            },
          },
        }}
      />
    </Box>
  );
};

export default TaskCompletionTrends;