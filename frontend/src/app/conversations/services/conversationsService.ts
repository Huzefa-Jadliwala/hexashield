import { Conversation } from '@app/conversations/types/conversation.types';
import { privateClient } from '@app/axios.client';
import { BaseQueryParams } from '@app/base.types';

export interface ConversationQueryParams extends BaseQueryParams {
  user_id?: string;         // Filter by associated user ID
  title?: string;           // Optional filter by title
}

// Fetch all conversations
export const fetchConversations = async (): Promise<Conversation[]> => {
  const response = await privateClient.get("/conversations");
  return response.data;
};

// Create a new conversation
export const createConversation = async (id: string, title: string, type: string, created_by: string, standard: string): Promise<Conversation> => {
  const response = await privateClient.post("/conversations", { id, title, created_by, type, standard });
  return response.data;
};

// Update an existing conversation
export const updateConversation = async (
  conversationId: string,
  updatedFields: Partial<Conversation>
): Promise<Conversation> => {
  const response = await privateClient.put(`/conversations/${conversationId}`, updatedFields);
  return response.data;
};

// Query conversations with filters and pagination
export const queryConversations = async (params: ConversationQueryParams): Promise<Conversation[]> => {
  const response = await privateClient.get("/conversations/query", { params });
  return response.data.data;
};

// Query conversations with filters and pagination
export const generateConversationReport = async (conversationId: string): Promise<any> => {
  const response = await privateClient.get(`/conversations/${conversationId}/generate/report`);
  return response.data;
};
