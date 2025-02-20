import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hook';
import {
    createConversationThunk,
    updateConversationThunk,
    queryConversationsThunk,
    generateConversationReportThunk,
} from '../slices/conversationsSlice';
import { RootState } from '../../store';
import { Conversation } from '../types/conversation.types';
import { getUserIdFromLocalStorage } from 'utils/cookieValidation';
import { useLocation } from 'react-router-dom';

export const useConversations = () => {
    const dispatch = useAppDispatch();
    const location = useLocation(); // Track navigation changes

    // Extract state data
    const { conversations, loading, error, generateReportLoading, generateReportError } = useAppSelector(
        (state: RootState) => state.conversations
    );

    // Fetch all conversations
    const fetchConversationsByQuery = useCallback(() => {
        dispatch(queryConversationsThunk({ created_by: getUserIdFromLocalStorage(), page: 1, page_size: 100 }));
    }, [dispatch]);

    // Create a new conversation
    const createConversation = useCallback(
        (id: string, title: string, created_by: string, type: string, standard: string) => {
            return dispatch(createConversationThunk({ id: id, title: title, created_by: created_by, type: type, standard: standard }));
        },
        [dispatch]
    );

    // Update an existing conversation
    const updateConversation = useCallback(
        (conversationId: string, updatedFields: Partial<Conversation>) => {
            return dispatch(updateConversationThunk({ conversationId, updatedFields }));
        },
        [dispatch]
    );

    // Query conversations with filters
    const queryConversations = useCallback(
        (filters: { created_by?: string; title?: string; page?: number; page_size?: number }) => {
            return dispatch(queryConversationsThunk(filters));
        },
        [dispatch]
    );

    const generateConversationReport = useCallback(
        (conversationId: string) => {
            return dispatch(generateConversationReportThunk(conversationId));
        },
        [dispatch]
    );

    // Automatically fetch conversations when the tab is visited
    useEffect(() => {

        fetchConversationsByQuery();

    }, [fetchConversationsByQuery]); // Runs on navigation changes

    return {
        conversations,
        loading,
        error,
        generateReportLoading,
        generateReportError,
        fetchConversationsByQuery,
        createConversation,
        updateConversation,
        queryConversations,
        generateConversationReport,
    };
};
