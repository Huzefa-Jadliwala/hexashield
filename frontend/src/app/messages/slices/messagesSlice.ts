import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message, MessageRequest } from '@app/messages/types/message.types';
import {
    fetchMessages,
    createMessage,
    updateMessage,
    queryMessages,
} from '@app/messages/services/messagesService';


interface MessagesState {
    messages: Message[]; // List of messages
    loading: boolean; // Loading state for API calls
    error: string | null; // Error message, if any
    selectedMessageId: string | null; // ID of the currently selected conversation
}

const initialState: MessagesState = {
    messages: [],
    loading: false,
    error: null,
    selectedMessageId: null,
};

// Define a type for errors
interface FetchError {
    message: string;
}

// Thunk for fetching all messages
export const fetchMessagesThunk = createAsyncThunk<
    Message[], // Success return type
    void,           // Argument type (void since no arguments)
    { rejectValue: FetchError } // Error return type
>(
    'messages/fetchMessages',
    async (_, { rejectWithValue }) => {
        try {
            const messages = await fetchMessages();
            return messages;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to fetch messages' });
        }
    }
);

// Thunk for creating a new conversation
export const createMessageThunk = createAsyncThunk<
    Message, // Success return type
    MessageRequest, // Argument type
    { rejectValue: FetchError } // Error return type
>(
    'messages/createMessage',
    async (messageRequest: MessageRequest, { rejectWithValue }) => { // Accept the payload directly as MessageRequest
        try {
            const conversation = await createMessage(messageRequest); // Pass the payload directly
            return conversation; // Return the created conversation
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to create conversation' });
        }
    }
);

// Thunk for updating a conversation
export const updateMessageThunk = createAsyncThunk<
    Message, // Success return type
    { messageId: string; updatedFields: Partial<Message> }, // Arguments
    { rejectValue: FetchError } // Error return type
>(
    'messages/updateMessage',
    async ({ messageId, updatedFields }, { rejectWithValue }) => {
        try {
            const updatedMessage = await updateMessage(messageId, updatedFields);
            return updatedMessage;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to update conversation' });
        }
    }
);

// Thunk for querying messages
export const queryMessagesThunk = createAsyncThunk<
    Message[], // Success return type
    { user_id?: string; created_by?: string; title?: string; page?: number; page_size?: number }, // Arguments
    { rejectValue: FetchError } // Error return type
>(
    'messages/queryMessages',
    async (queryParams, { rejectWithValue }) => {
        try {
            const messages = await queryMessages(queryParams);
            return messages;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to query messages' });
        }
    }
);

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        selectMessage(state, action: PayloadAction<string | null>) {
            state.selectedMessageId = action.payload;
        },
        resetMessagesState() {
            return initialState;
        },
        updateMessageInState(state, action: PayloadAction<Message>) {
            const index = state.messages.findIndex(
                (conversation) => conversation._id === action.payload._id
            );
            if (index !== -1) {
                state.messages[index] = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all messages
            .addCase(fetchMessagesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMessagesThunk.fulfilled, (state, action: PayloadAction<Message[]>) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(fetchMessagesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch messages';
            })
            // Create a new conversation
            .addCase(createMessageThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createMessageThunk.fulfilled, (state, action: PayloadAction<Message>) => {
                state.loading = false;
                state.messages.push(action.payload);
                state.selectedMessageId = action.payload._id;
            })
            .addCase(createMessageThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to create conversation';
            })
            // Update a conversation
            .addCase(updateMessageThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateMessageThunk.fulfilled, (state, action: PayloadAction<Message>) => {
                state.loading = false;
                const index = state.messages.findIndex(
                    (conversation) => conversation._id === action.payload._id
                );
                if (index !== -1) {
                    state.messages[index] = action.payload;
                }
            })
            .addCase(updateMessageThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update conversation';
            })
            // Query messages
            .addCase(queryMessagesThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(queryMessagesThunk.fulfilled, (state, action: PayloadAction<Message[]>) => {
                state.loading = false;
                state.messages = action.payload;
            })
            .addCase(queryMessagesThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to query messages';
            });
    },
});

export const {
    selectMessage,
    resetMessagesState,
    updateMessageInState,
} = messagesSlice.actions;

export default messagesSlice.reducer;
