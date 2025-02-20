import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Task } from "../types/task.types";
import { fetchTasks } from "../services/tasksService";

// Define the TaskState interface with pagination metadata
interface TasksState {
  tasks: {
    data: Task[];
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
  }; // List of tasks with pagination metadata
  loading: boolean; // Loading state for API calls
  error: string | null; // Error message, if any
  selectedTaskId: string | null; // ID of the currently selected task
}

// Define a type for errors
interface FetchError {
  message: string;
}

// Initial state
const initialState: TasksState = {
  tasks: {
    data: [],
    page: 1,
    page_size: 10,
    total_items: 0,
    total_pages: 0,
  },
  loading: false,
  error: null,
  selectedTaskId: null,
};

// Thunk to fetch tasks with pagination and filtering
export const fetchTasksThunk = createAsyncThunk<
  { data: Task[]; page: number; page_size: number; total_items: number; total_pages: number }, // Success return type
  { agentId: string; status?: string; page?: number; page_size?: number; sort_by?: string; sort_order?: string }, // Arguments
  { rejectValue: FetchError } // Error return type
>(
  "tasks/fetchTasks",
  async ({ agentId, status, page = 1, page_size = 10, sort_by = "created_at", sort_order = "desc" }, { rejectWithValue }) => {
    try {
      const tasks = await fetchTasks({ agentId, status, page, page_size, sort_by, sort_order });
      return tasks;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue({ message: error.message });
      }
      return rejectWithValue({ message: "Unknown error occurred while fetching tasks" });
    }
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    selectTask(state, action: PayloadAction<string | null>) {
      state.selectedTaskId = action.payload;
    },
    resetTasksState() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tasks - Pending
      .addCase(fetchTasksThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Fetch tasks - Fulfilled
      .addCase(
        fetchTasksThunk.fulfilled,
        (state, action: PayloadAction<{ data: Task[]; page: number; page_size: number; total_items: number; total_pages: number }>) => {
          state.loading = false;
          state.tasks = {
            data: action.payload.data,
            page: action.payload.page,
            page_size: action.payload.page_size,
            total_items: action.payload.total_items,
            total_pages: action.payload.total_pages,
          };
        }
      )
      // Fetch tasks - Rejected
      .addCase(fetchTasksThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch tasks";
      });
  },
});

// Export actions
export const { selectTask, resetTasksState } = tasksSlice.actions;

// Export the reducer
export default tasksSlice.reducer;
