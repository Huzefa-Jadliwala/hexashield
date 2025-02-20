import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Report } from '@app/reports/types/report.types';
import { queryReports } from '@app/reports/services/reportService';

interface ReportState {
    reports: {
        data: Report[];
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
    }; // List of reports with pagination metadata
    loading: boolean; // Loading state for API calls
    error: string | null; // Error message, if any
    selectedReportId: string | null; // ID of the currently selected report
}

const initialState: ReportState = {
    reports: {
        data: [],
        page: 1,
        page_size: 10,
        total_items: 0,
        total_pages: 0,
    },
    loading: false,
    error: null,
    selectedReportId: null,
};

// Define a type for errors
interface FetchError {
    message: string;
}

// Thunk for querying reports
export const queryReportsThunk = createAsyncThunk<
    { data: Report[]; page: number; page_size: number; total_items: number; total_pages: number }, // Success return type
    { conversation_id?: string; message_id?: string; type?: string; created_by?: string; page?: number; page_size?: number }, // Arguments
    { rejectValue: FetchError } // Error return type
>(
    'reports/queryReports',
    async (queryParams, { rejectWithValue }) => {
        try {
            const reports = await queryReports(queryParams);
            return reports;
        } catch (error) {
            if (error instanceof Error) {
                return rejectWithValue({ message: error.message });
            }
            return rejectWithValue({ message: 'Unknown error occurred' });
        }
    }
);

const reportsSlice = createSlice({
    name: 'reports',
    initialState,
    reducers: {
        selectReport(state, action: PayloadAction<string | null>) {
            state.selectedReportId = action.payload;
        },
        resetReportsState() {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            // Query reports
            .addCase(queryReportsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(
                queryReportsThunk.fulfilled,
                (state, action: PayloadAction<{ data: Report[]; page: number; page_size: number; total_items: number; total_pages: number }>) => {
                    state.loading = false;
                    state.reports = {
                        data: action.payload.data,
                        page: action.payload.page,
                        page_size: action.payload.page_size,
                        total_items: action.payload.total_items,
                        total_pages: action.payload.total_pages,
                    };
                }
            )
            .addCase(queryReportsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to query reports';
            });
    },
});

export const { selectReport, resetReportsState } = reportsSlice.actions;

export default reportsSlice.reducer;
