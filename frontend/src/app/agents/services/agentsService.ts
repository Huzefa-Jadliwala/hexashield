import { BaseQueryParams } from "@app/base.types";
import { Agent } from "../types/agent.types";
import { privateClient } from "@app/axios.client";

export interface AgentQueryParams extends BaseQueryParams {
  user_id?: string; // Filter by associated user ID
}

export const fetchAgents = async (
  params: AgentQueryParams
): Promise<Agent[]> => {
  const response = await privateClient.get("/agents", { params });
  return response.data;
};
