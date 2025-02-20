import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { WebhexRequest } from '../types/webhex.types';
import { scanProgress } from '../services/webhexService';

interface WebHexState {
    progress: number;
    loading: boolean;
    error: string | null;
}

const initialState: WebHexState = {
    progress: 0,
    loading: false,
    error: null,
};

// Thunk to fetch scan progress
export const scanProgressThunk = createAsyncThunk<
    number, // Success return type
    WebhexRequest // Argument type
>(
    'webhex/scanProgress',
    async ({ report_id }, { rejectWithValue }) => {
        try {
            const response = await scanProgress({ report_id });
            return response.status; // Assuming the API returns `status` as progress
        } catch (error: any) {
            return rejectWithValue(error.response?.data || { message: 'Failed to fetch scan progress' });
        }
    }
);

const webHexSlice = createSlice({
    name: 'webhex',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(scanProgressThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(scanProgressThunk.fulfilled, (state, action: PayloadAction<number>) => {
                state.progress = action.payload;
                state.loading = false;
            })
            .addCase(scanProgressThunk.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload?.message || 'Something went wrong';
            });
    },
});

export default webHexSlice.reducer;