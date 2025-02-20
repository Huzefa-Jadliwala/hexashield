import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserState } from '@app/users/types/users.types';
import { fetchCurrentUser, updateUser } from '@app/users/services/usersService';
import { AxiosError } from 'axios'; // Import for strong error typing

// Initial state
const initialState: UserState = {
    user: null,
    loading: false,
    error: null,
    updateLoading: false,
    updateError: null,
};

// Define a type for rejected error values
interface RejectValue {
    message: string;
}

// Async thunk for fetching the current user
export const fetchUserThunk = createAsyncThunk<
    User,                  // Success return type
    void,                  // Argument type (no arguments)
    { rejectValue: RejectValue } // Error return type
>(
    'user/fetchUser',
    async (_, { rejectWithValue }) => {
        try {
            return await fetchCurrentUser();
        } catch (error) {
            const axiosError = error as AxiosError<{ detail: string }>;
            return rejectWithValue({
                message: axiosError.response?.data?.detail || 'Failed to fetch user',
            });
        }
    }
);

// Thunk for updating the user
export const updateUserThunk = createAsyncThunk<
    User,               // Success return type
    { userId: string; data: FormData },  // Argument type
    { rejectValue: RejectValue }       // Error return type
>(
    'user/updateUser',
    async ({ userId, data }, { rejectWithValue }) => {
        try {
            return await updateUser(userId, data);
        } catch (error) {
            const axiosError = error as AxiosError<{ message: string }>;
            return rejectWithValue({
                message: axiosError.response?.data?.message || 'Failed to update user',
            });
        }
    }
);

// User slice
const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        resetUserState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // Fetch user cases
            .addCase(fetchUserThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserThunk.fulfilled, (state, action: PayloadAction<User>) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(fetchUserThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch user';
            })

            // Update user cases
            .addCase(updateUserThunk.pending, (state) => {
                state.updateLoading = true;
                state.updateError = null;
            })
            .addCase(updateUserThunk.fulfilled, (state, action: PayloadAction<User>) => {
                state.updateLoading = false;
                state.user = action.payload;
            })
            .addCase(updateUserThunk.rejected, (state, action) => {
                state.updateLoading = false;
                state.updateError = action.payload?.message || 'Failed to update user';
            });
    },
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;
