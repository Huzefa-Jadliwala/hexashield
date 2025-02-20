export interface BaseQueryParams {
    page?: number;            // Pagination: page number
    page_size?: number;       // Pagination: number of items per page
    created_by?: string;      // Filter by creator ID
    updated_by?: string;      // Filter by updater ID
    created_at?: string;      // Filter by creation date (ISO8601)
    updated_at?: string;      // Filter by update date (ISO8601)
}

export interface ReportData {
    id?: string;
    name: string;
    risk: keyof typeof riskLevels;
    description: string;
    solution: string;
    cweid: string;
    reference: string;
    tags?: { [key: string]: string };
  }

  export const riskLevels = {
    High: {
      bgcolor: "#ff4444",
      color: "white",
    },
    Medium: {
      bgcolor: "#ffa726",
      color: "black",
    },
    Low: {
      bgcolor: "#ffeb3b",
      color: "black",
    },
    Informational: {
      bgcolor: "#2196f3",
      color: "white",
    },
  };
  