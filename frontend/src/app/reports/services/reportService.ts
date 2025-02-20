import { Report } from '@app/reports/types/report.types';
import { privateClient } from '@app/axios.client';
import { BaseQueryParams } from '@app/base.types';

export interface ReportQueryParams extends BaseQueryParams {
    conversation_id?: string;
    message_id?: string;
    user_id?: string;
    type?: string;
}

// Query reports with filters and pagination
export const queryReports = async (params: ReportQueryParams): Promise<{ data: Report[] }> => {
    const response = await privateClient.get("/reports/query", { params });
    return response.data;
};
