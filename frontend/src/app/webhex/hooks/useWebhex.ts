import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hook';
import { RootState } from '@app/store';
import { scanProgressThunk } from '../slices/webhexSlice';

export const useWebHex = () => {
    const dispatch = useAppDispatch();

    // Extract state data
    const { progress, loading, error } = useAppSelector((state: RootState) => state.webhex);

    // Fetch scan progress
    const fetchScanProgress = useCallback(
        (report_id: string) => {
            return dispatch(scanProgressThunk({ report_id }));
        },
        [dispatch]
    );

    return {
        progress,
        loading,
        error,
        fetchScanProgress,
    };
};
