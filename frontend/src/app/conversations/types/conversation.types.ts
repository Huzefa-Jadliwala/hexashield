
export interface Conversation {
    _id: string;           // Unique identifier for the conversation
    title: string;         // Title of the conversation or meeting
    type: string;         // Title of the conversation or meeting
    standard: string;      // standard of the conversation or meeting
    user_id: string;       // ID of the user associated with the conversation
    created_by: string;    // ID of the user who created the conversation
    created_at: string;    // ISO8601 timestamp of when the conversation was created
    updated_at: string;    // ISO8601 timestamp of the last update to the conversation
}
