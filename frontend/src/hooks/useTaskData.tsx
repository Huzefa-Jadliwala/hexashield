import { useState, useEffect } from 'react';
import { privateClient } from '@app/axios.client';

interface Task {
  _id: string;
  agent_id: string;
  agent_name: string;
  conversation_id: string;
  status: string;
  created_at: string;
  completed_at: string;
  priority: string;
  execution_time: string;
}

interface TaskDataState {
  tasks: Task[];
  loading: boolean;
  error: Error | null;
  noData: boolean; // Add a noData flag
}

const CACHE_DURATION = 60000; // 1 minute (in milliseconds)
const STORAGE_KEY = "task_data_cache";

export const useTaskData = () => {
  const [state, setState] = useState<TaskDataState>({
    tasks: [],
    loading: true,
    error: null,
    noData: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Retrieve cached data from session storage
      const cachedData = sessionStorage.getItem(STORAGE_KEY);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = Date.now();

        if (timestamp && now - timestamp < CACHE_DURATION) {
          console.log("Using cached data from session storage", data);
          setState({
            tasks: data,
            loading: false,
            error: null,
            noData: data.length === 0,
          });
          return;
        }
      }

      // If no cache or expired, fetch new data
      setState(prev => ({ ...prev, loading: true }));

      try {
        const response = await privateClient.get("tasks/");
        const tasks = response.data;
        console.log("Fetched fresh data", tasks);

        // Store new data and timestamp in session storage
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: tasks, timestamp: Date.now() })
        );

        setState({
          tasks,
          loading: false,
          error: null,
          noData: tasks.length === 0,
        });
      } catch (error) {
        setState({
          tasks: [],
          loading: false,
          error: error as Error,
          noData: false,
        });
      }
    };

    fetchData();
  }, []);

  return { ...state };
};
