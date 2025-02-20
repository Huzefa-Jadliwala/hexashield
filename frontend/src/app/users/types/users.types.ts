export interface User {
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    profile: string; // Base64 image string or URL
  }
  
  export interface UserState {
    user: User | null;       // Holds the current user data or null if not loaded
    loading: boolean;        // Indicates if the user data is being loaded
    updateLoading: boolean;  // Indicates if the user data is being updated
    error: string | null;    // Holds the error message if any operation fails
    updateError: string | null; // Error message for the update operation
  }
  