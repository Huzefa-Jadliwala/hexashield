import { riskLevels } from "@app/base.types";
import { useReports } from "@app/reports/hooks/useReports"; // Custom hook to fetch reports
import { Report } from "@app/reports/types/report.types";
import { generatePDF } from "@components/Reports/generatePDF";
import {
  Box,
  CircularProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TableSortLabel,
  Button,
} from "@mui/material";
import React, { useState } from "react";
import ReportProgressModal from "@components/Conversation/ReportProgressModal";

export default function WebhexReportListingPage() {
  // State for pagination & sorting
  const [page, setPage] = React.useState(1); // API uses 1-based index
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [order, setOrder] = React.useState<"asc" | "desc">("desc");
  const [orderBy, setOrderBy] = React.useState<string>("created_at");
  const [open, setOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string>("");

  // Fetch reports with pagination & sorting
  const { reports, loading, error, queryReports } = useReports({
    type: "webhex",
    page,
    page_size: rowsPerPage,
    sort_by: orderBy,
    sort_order: order,
  });

  const reportData = reports?.data || [];
  const totalItems = reports?.total_items || 0;

  // Handlers for pagination
  const handleChangePage = (
    _: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage + 1); // Adjust to API's 1-based index
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to the first page when changing page size
  };

  // Handle sorting by column
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  function handleViewClick(id: string) {
    console.log("report id", id);
    setSelectedReportId(id);
    setOpen(true);
  }

  function handleDownloadClick(report: Report) {
    const riskSummary = report?.details?.alerts?.reduce(
      (acc: { [key in keyof typeof riskLevels]?: number }, item) => {
        acc[item.risk] = (acc[item.risk] || 0) + 1;
        return acc;
      },
      {}
    );

    const alertSummary = report.details?.alerts?.reduce(
      (acc: { [key: string]: number }, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
        return acc;
      },
      {}
    );

    generatePDF(report.details.alerts, riskSummary, alertSummary);
  }

  return (
    <Box
      component="main"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "background.default",
        p: { xs: 2, sm: 4 },
      }}
    >
      {/* Reports Table */}
      <Paper elevation={2} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Table Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h6">WebHex Reports</Typography>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: "calc(100vh - 180px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "details.url"}
                    direction={orderBy === "details.url" ? order : "asc"}
                    onClick={() => handleRequestSort("details.url")}
                  >
                    URL
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "created_at"}
                    direction={orderBy === "created_at" ? order : "asc"}
                    onClick={() => handleRequestSort("created_at")}
                  >
                    Created At
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" color="error">
                    Failed to load reports
                  </TableCell>
                </TableRow>
              ) : reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No reports available
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((report: Report) => (
                  <TableRow key={report._id}>
                    <TableCell>
                      <Typography variant="body2">
                        <a
                          href={report.details?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "white" }}
                        >
                          {report.details?.url}
                        </a>
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(report?.created_at || "").toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell sx={{ display: "flex", gap: 2 }}>
                      <Button variant="contained" color="secondary" onClick={() => handleViewClick(report._id)}>
                        View
                      </Button>
                      <Button variant="contained" color="secondary" onClick={() => handleDownloadClick(report)}>
                        Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page - 1} // Adjust for zero-based pagination in MUI
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <ReportProgressModal open={open} onClose={() => setOpen(false)} reportId={selectedReportId} />
    </Box>
  );
}
