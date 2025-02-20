import { Message, MessageRequest } from '@app/messages/types/message.types';
import { privateClient } from '@app/axios.client';
import { BaseQueryParams } from '@app/base.types';

export interface MessageQueryParams extends BaseQueryParams {
  conversation_id?: string;
}

// Fetch all messages
export const fetchMessages = async (): Promise<Message[]> => {
  const response = await privateClient.get("/messages");
  return response.data;
};

// Update the function
export const createMessage = async (data: MessageRequest): Promise<Message> => {
  const response = await privateClient.post("/messages", data);
  return response.data;
};

// Update an existing conversation
export const updateMessage = async (
  messageId: string,
  updatedFields: Partial<Message>
): Promise<Message> => {
  const response = await privateClient.put(`/messages/${messageId}`, updatedFields);
  return response.data;
};

// Query messages with filters and pagination
export const queryMessages = async (params: MessageQueryParams): Promise<Message[]> => {
  const response = await privateClient.get("/messages/query", { params });
  return response.data;
};
