import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchAgents } from '../services/agentsService';
import { Agent } from '../types/agent.types';

interface AgentsState {
    agents: Agent[]; // List of agents
    loading: boolean; // Loading state for API calls
    error: string | null; // Error message, if any
}

const initialState: AgentsState = {
    agents: [],
    loading: false,
    error: null,
};

// Define a type for errors
interface FetchError {
    message: string;
}

// Thunk for fetching agents
export const fetchAgentsThunk = createAsyncThunk<
    Agent[], // Success return type
    { created_by?: string; }, // Arguments,   
    { rejectValue: FetchError } // Error return type
>(
    'agents/fetchAgents',
    async (queryParams, { rejectWithValue }) => {
        try {
            const agents = await fetchAgents(queryParams);
            return agents; // Expected to return an array of Agent objects
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Unknown error occurred' });
        }
    }
);



const agentsSlice = createSlice({
    name: 'agents',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAgentsThunk.pending, (state) => {
                state.loading = true;
                state.error = null; // Clear any previous errors
            })
            .addCase(fetchAgentsThunk.fulfilled, (state, action: PayloadAction<Agent[]>) => {
                state.loading = false;
                state.agents = action.payload; // Populate the agents list
            })
            .addCase(fetchAgentsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch agents'; // Set error message
            });
    },
});

export default agentsSlice.reducer;
