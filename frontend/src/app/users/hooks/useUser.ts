import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../hook';
import { AppDispatch, RootState } from '@app/store';
import { fetchUserThunk, updateUserThunk } from '@app/users/slices/usersSlice';

export const useUser = () => {
    const dispatch: AppDispatch = useAppDispatch();
    const { user, loading, error } = useAppSelector((state: RootState) => state.user);
    const { loading: updateLoading, error: updateError } = useAppSelector((state: RootState) => state.user); // For update state
    
    // Fetch the user on component mount if not already present
    useEffect(() => {
        if (!user) {
            dispatch(fetchUserThunk());
        }
    }, [dispatch, user]);

    const updateUser = useCallback(
        async (userId: string, data: FormData) => {
            try {
                await dispatch(updateUserThunk({ userId, data })).unwrap();
                dispatch(fetchUserThunk());
            } catch (err) {
                console.error('Failed to update user:', err);
            }
        },
        [dispatch]
    );
    
    return {
        user,
        loading,
        error,
        updateUser, // Expose update function
        updateLoading, // Track update loading state
        updateError, // Track update error state
    };
};
