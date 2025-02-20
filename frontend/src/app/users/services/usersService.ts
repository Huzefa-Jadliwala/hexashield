import { privateClient } from '@app/axios.client';
import { User } from '@app/users/types/users.types';
import { AxiosError } from 'axios'; // Import AxiosError for error typing

/**
 * Fetch the current user data.
 * @returns {Promise<User>}
 */

interface AxiosErrorResponse {
    message: string;
}

export const fetchCurrentUser = async (): Promise<User> => {
    const response = await privateClient.get<User>('/auth/current_user');
    return response.data;
};

/**
 * Update the user's data.
 * @param {string} userId - The ID of the user to be updated.
 * @param {FormData} data - The form data containing the updated user information.
 * @returns {Promise<User>} - The updated user data.
 */
export const updateUser = async (userId: string, data: FormData): Promise<User> => {
    try {
        const response = await privateClient.patch<User>(`/auth/user/${userId}/`, data, {
            headers: {
                'Content-Type': 'multipart/form-data', // Ensure multipart headers
            },
        });
        return response.data;
    } catch (error) {
        // Assert error to be of type AxiosError to get specific error data
        const axiosError = error as AxiosError;
        throw new Error((axiosError.response?.data as AxiosErrorResponse)?.message || 'Failed to update user');
    }
};
