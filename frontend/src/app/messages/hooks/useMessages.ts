import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hook';
import { RootState } from '@app/store';
import { Message, MessageRequest } from '@app/messages/types/message.types';
import {
    fetchMessagesThunk,
    createMessageThunk,
    updateMessageThunk,
    queryMessagesThunk,
} from '@app/messages/slices/messagesSlice';

export const useMessages = () => {
    const dispatch = useAppDispatch();

    // Extract state data
    const { messages, loading, error } = useAppSelector((state: RootState) => state.messages);

    // Fetch all messages
    const fetchMessages = useCallback(() => {
        dispatch(fetchMessagesThunk());
    }, [dispatch]);

    // Create a new message
    const createConversation = useCallback((data: MessageRequest) => {
        return dispatch(createMessageThunk(data));
    }, [dispatch]);

    // Update an existing message
    const updateConversation = useCallback((messageId: string, updatedFields: Partial<Message>) => {
        return dispatch(updateMessageThunk({ messageId, updatedFields }));
    }, [dispatch]);

    // Query messages with filters
    const queryMessages = useCallback(
        (filters: { user_id?: string; created_by?: string; title?: string; page?: number; page_size?: number }) => {
            return dispatch(queryMessagesThunk(filters));
        },
        [dispatch]
    );

    // Automatically fetch messages on initialization
    useEffect(() => {
        if (!messages.length) {
            fetchMessages();
        }
    }, [fetchMessages, messages.length]);

    return {
        messages,
        loading,
        error,
        fetchMessages,
        createConversation,
        updateConversation,
        queryMessages,
    };
};
