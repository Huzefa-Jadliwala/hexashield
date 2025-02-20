import { Conversation } from '@app/conversations/types/conversation.types';

export interface Task {
  _id: string; // MongoDB ObjectId as a string
  agent_id: string; // ID of the agent that executed the task
  conversation_id: string; // MongoDB ObjectId as a string
  conversation: Conversation; // MongoDB ObjectId as a string
  status: "success" | "failure"; // Task status
  outputs: TaskOutput[]; // Array of task output objects
  priority: "low" | "medium" | "high"; // Priority level of the task
  execution_time: string; // Time taken to execute the task (e.g., "0.08s")
  created_at: string; // ISO string for task creation timestamp
  completed_at: string; // ISO string for task completion timestamp
}

export interface TaskOutput {
  type: "precondition_test" | "precondition_solve" | "cleanup"; // Step type
  command: string; // Command executed during this step
  output: string; // Output of the command
  status: "success" | "failure"; // Status of the step
}

