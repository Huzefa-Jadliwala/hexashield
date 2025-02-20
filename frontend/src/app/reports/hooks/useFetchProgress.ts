import useSWR from 'swr';
import { privateClient } from '@app/axios.client';

const fetcher = (reportId: string) => {
  const requestURL = `${BASE_URL}/webhex/scans/${reportId}/progress`
  return privateClient.get(requestURL).then(res => res.data);
}

const BASE_URL = import.meta.env.VITE_WEB_API_URL as string;
const useFetchProgress = (reportId: string) => {
  const { data: progressData, error } = useSWR<any>(
    reportId,
    fetcher,
    {
      keepPreviousData: true,
      refreshInterval: 10000, // Refresh every 10 seconds
    }
  );

  return { progressData, loading: !error && !progressData, error };
};

export default useFetchProgress;
