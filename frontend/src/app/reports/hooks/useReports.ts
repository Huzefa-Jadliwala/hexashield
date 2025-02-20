import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@app/hook';
import { RootState } from '@app/store';
import { queryReportsThunk } from '@app/reports/slices/reportsSlice';
import { getUserIdFromLocalStorage } from 'utils/cookieValidation';
import { useLocation } from 'react-router-dom';

export const useReports = ({
    type,
    message_id,
    conversation_id,
    created_by = getUserIdFromLocalStorage(),
    page = 1,
    page_size = 100,
    sort_by = 'updated_at',
    sort_order = 'desc',
}: {
    type?: string;
    message_id?: string;
    conversation_id?: string;
    created_by?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
}) => {
    const dispatch = useAppDispatch();
    const location = useLocation(); // Track navigation changes

    // Extract state data
    const { reports, loading, error } = useAppSelector((state: RootState) => state.reports);

    // Query reports with filters, sort, and pagination
    const queryReports = useCallback(
        (filters: {
            type?: string;
            message_id?: string;
            conversation_id?: string;
            created_by?: string;
            page?: number;
            page_size?: number;
            sort_by?: string;
            sort_order?: string;
        }) => {
            return dispatch(queryReportsThunk(filters));
        },
        [dispatch]
    );

    // Load reports on component mount or when the tab is revisited
    useEffect(() => {
        const filters = {
            type,
            message_id,
            conversation_id,
            created_by,
            page,
            page_size,
            sort_by,
            sort_order,
        };

        queryReports(filters);
    }, [queryReports, location.pathname, type, message_id, conversation_id, created_by, page, page_size, sort_by, sort_order]); // Runs when any parameter changes

    return {
        reports,
        loading,
        error,
        queryReports,
    };
};

