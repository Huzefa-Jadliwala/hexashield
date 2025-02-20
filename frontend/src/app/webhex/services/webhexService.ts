import { publicClient } from '@app/axios.client';
import { WebhexRequest } from '../types/webhex.types';

// Get Scan Progress
export const scanProgress = async ({ report_id }: WebhexRequest): Promise<{ status: number }> => {
    const response = await publicClient.get(`/scans/${report_id}/progress`);
    return response.data;
};
