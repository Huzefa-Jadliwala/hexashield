import { Report } from '@app/reports/types/report.types';
import { Task } from '@app/tasks/types/task.types';

export interface Message {
    _id: string; // MongoDB ObjectId as a string
    conversation_id: string; // MongoDB ObjectId as a string, representing the conversation
    role: string; // "user" or "assistant"
    content: string; // Text content of the message
    type?: string; // Type of the message (e.g., "webhex")
    details?: {
        scanId?: string;
        url?: string;
        report?: Record<string, unknown>;
    }; // Additional optional details about the message
    report?: Report; // Associated report object
    created_at: string; // ISO string for the creation timestamp
    updated_at: string; // ISO string for the last updated timestamp
    task?: Task;
}

export interface MessageRequest {
    conversation_id: string;  // ID of the conversation this message belongs to
    role: string;   // Sender of the message
    content: string;          // Message content
}
