import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hook";
import { fetchTasksThunk } from "../slices/tasksSlice";
import { RootState } from "../../store";
import { useLocation } from "react-router-dom";

export const useTasks = ({
  agentId,
  status,
  page = 1,
  page_size = 50,
  sort_by = "created_at",
  sort_order = "desc",
}: {
  agentId: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}) => {
  const dispatch = useAppDispatch();
  const location = useLocation(); // Track navigation changes
  const { tasks, loading, error } = useAppSelector((state: RootState) => state.tasks);

  // Memoized fetch function to avoid unnecessary re-creations
  const fetchTasks = useCallback(() => {
    if (agentId) {
      dispatch(fetchTasksThunk({ agentId, status, page, page_size, sort_by, sort_order }));
    }
  }, [dispatch, agentId, status, page, page_size, sort_by, sort_order]);

  // Automatically fetch tasks when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, location.pathname]); // Triggers on navigation changes

  return { tasks, loading, error, fetchTasks };
};
