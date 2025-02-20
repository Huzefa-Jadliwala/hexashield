import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
    fetchConversations,
    createConversation,
    updateConversation,
    queryConversations,
    generateConversationReport
} from '../services/conversationsService';
import { Conversation } from '@app/conversations/types/conversation.types';

interface ConversationsState {
    conversations: Conversation[]; // List of conversations
    loading: boolean; // Loading state for API calls
    generateReportLoading: boolean;
    generateReportError: string | null;
    error: string | null; // Error message, if any
    selectedConversationId: string | null; // ID of the currently selected conversation
}

const initialState: ConversationsState = {
    conversations: [],
    loading: false,
    generateReportLoading: false,
    generateReportError: null,
    error: null,
    selectedConversationId: null,
};

// Define a type for errors
interface FetchError {
    message: string;
}

// Thunk for fetching all conversations
export const fetchConversationsThunk = createAsyncThunk<
    Conversation[], // Success return type
    void,           // Argument type (void since no arguments)
    { rejectValue: FetchError } // Error return type
>(
    'conversations/fetchConversations',
    async (_, { rejectWithValue }) => {
        try {
            const conversations = await fetchConversations();
            return conversations;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to fetch conversations' });
        }
    }
);

// Thunk for creating a new conversation
export const createConversationThunk = createAsyncThunk<
    Conversation, // Success return type
    { id: string; title: string; created_by: string, type: string, standard: string }, // Argument type
    { rejectValue: FetchError } // Error return type
>(
    'conversations/createConversation',
    async ({ id, title, created_by, type, standard }, { rejectWithValue }) => { // Destructure the payload as an object
        try {
            const conversation = await createConversation(id, title, type, created_by, standard); // Pass correct arguments
            return conversation; // Return the created conversation
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to create conversation' });
        }
    }
);

// Thunk for updating a conversation
export const updateConversationThunk = createAsyncThunk<
    Conversation, // Success return type
    { conversationId: string; updatedFields: Partial<Conversation> }, // Arguments
    { rejectValue: FetchError } // Error return type
>(
    'conversations/updateConversation',
    async ({ conversationId, updatedFields }, { rejectWithValue }) => {
        try {
            const updatedConversation = await updateConversation(conversationId, updatedFields);
            return updatedConversation;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to update conversation' });
        }
    }
);

// Thunk for querying conversations
export const queryConversationsThunk = createAsyncThunk<
    Conversation[], // Success return type
    { created_by?: string; title?: string; page?: number; page_size?: number }, // Arguments
    { rejectValue: FetchError } // Error return type
>(
    'conversations/queryConversations',
    async (queryParams, { rejectWithValue }) => {
        try {
            const conversations = await queryConversations(queryParams);
            return conversations;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to query conversations' });
        }
    }
);

// Thunk for querying conversations
export const generateConversationReportThunk = createAsyncThunk<
    any, // Success return type
    string, // Argument type (conversationId)
    { rejectValue: FetchError } // Error return type
>(
    'conversations/generateReport',
    async (conversationId, { rejectWithValue }) => {
        try {
            const response = await generateConversationReport(conversationId);
            return response;
        } catch (error: any) {
            return rejectWithValue({ message: error.message || 'Failed to query conversations' });
        }
    }
);

const conversationsSlice = createSlice({
    name: 'conversations',
    initialState,
    reducers: {
        selectConversation(state, action: PayloadAction<string | null>) {
            state.selectedConversationId = action.payload;
        },
        resetConversationsState() {
            return initialState;
        },
        updateConversationInState(state, action: PayloadAction<Conversation>) {
            const index = state.conversations.findIndex(
                (conversation) => conversation._id === action.payload._id
            );
            if (index !== -1) {
                state.conversations[index] = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch all conversations
            .addCase(fetchConversationsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversationsThunk.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
                state.loading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversationsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to fetch conversations';
            })
            .addCase(generateConversationReportThunk.pending, (state) => {
                state.generateReportLoading = true;
                state.generateReportError = null;
            })
            .addCase(generateConversationReportThunk.fulfilled, (state, action: PayloadAction<any>) => {
                state.generateReportLoading = false;
                state.generateReportError = action.payload;
            })
            .addCase(generateConversationReportThunk.rejected, (state, action) => {
                state.generateReportLoading = false;
                state.generateReportError = action.payload?.message || 'Failed to fetch conversations';
            })
            // Create a new conversation
            .addCase(createConversationThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createConversationThunk.fulfilled, (state, action: PayloadAction<Conversation>) => {
                state.loading = false;
                state.conversations.push(action.payload);
                state.selectedConversationId = action.payload._id;
            })
            .addCase(createConversationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to create conversation';
            })
            // Update a conversation
            .addCase(updateConversationThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateConversationThunk.fulfilled, (state, action: PayloadAction<Conversation>) => {
                state.loading = false;
                const index = state.conversations.findIndex(
                    (conversation) => conversation._id === action.payload._id
                );
                if (index !== -1) {
                    state.conversations[index] = action.payload;
                }
            })
            .addCase(updateConversationThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to update conversation';
            })
            // Query conversations
            .addCase(queryConversationsThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(queryConversationsThunk.fulfilled, (state, action: PayloadAction<Conversation[]>) => {
                state.loading = false;
                state.conversations = action.payload;
            })
            .addCase(queryConversationsThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || 'Failed to query conversations';
            });
    },
});

export const {
    selectConversation,
    resetConversationsState,
    updateConversationInState,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
