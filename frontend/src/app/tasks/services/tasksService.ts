import { getUserIdFromLocalStorage } from "utils/cookieValidation";
import { Task } from "../types/task.types"; // Adjust the import path as necessary
import { privateClient } from "@app/axios.client";

const BASE_URL = import.meta.env.VITE_WEB_API_URL as string;

export const fetchTasks = async ({
  agentId,
  status,
  page = 1,
  page_size = 10,
  sort_by = "created_at",
  sort_order = "desc",
}: {
  agentId: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}): Promise<{ data: Task[]; page: number; page_size: number; total_items: number; total_pages: number }> => {
  try {
    const userId = getUserIdFromLocalStorage();

    const response = await privateClient.get(`${BASE_URL}/tasks/query`, {
      params: {
        agent_id: agentId,
        created_by: userId,
        status,
        page,
        page_size,
        sort_by,
        sort_order,
      },
    });

    return {
      data: response.data.data,
      page: response.data.page,
      page_size: response.data.page_size,
      total_items: response.data.total_items,
      total_pages: response.data.total_pages,
    };
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error("Failed to fetch tasks. Please try again.");
  }
};
