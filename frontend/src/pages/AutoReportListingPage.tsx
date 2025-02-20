import { useReports } from "@app/reports/hooks/useReports"; // Custom hook to fetch reports
import { Report } from "@app/reports/types/report.types";
import AutoManualReportModal from "@components/Reports/AutoManualReportModal";
import { autoManualGeneratePDF } from "@components/Reports/autoManualGeneratePDF";
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
  Modal,
  IconButton,
} from "@mui/material";
import React, { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";

export default function AutoReportListingPage() {
  // State for pagination & sorting
  const [page, setPage] = React.useState(1); // Page state for pagination (starts from 1)
  const [rowsPerPage, setRowsPerPage] = React.useState(10); // Rows per page state
  const [order, setOrder] = React.useState<"asc" | "desc">("desc"); // Sorting order
  const [orderBy, setOrderBy] = React.useState<string>("created_at"); // Default sort by "created_at"
  const [open, setOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports with pagination & sorting
  const { reports, loading, error, queryReports } = useReports({
    type: "auto",
    page,
    page_size: rowsPerPage,
    sort_by: orderBy,
    sort_order: order,
  });

  const reportData = reports?.data || []; // Access reports from 'data' if available
  const totalItems = reports?.total_items || 0; // Total reports count

  // Handlers for pagination
  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage + 1); // Adjust to API-based pagination (1-based index)
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

  function handleDownloadClick(reportData: Report) {
    autoManualGeneratePDF("auto", reportData);
  }

  function handleViewClick(data: Report) {
    setSelectedReport(data);
    setOpen(true);
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
          <Typography variant="h6">Reports</Typography>
        </Box>

        {/* Table */}
        <TableContainer sx={{ maxHeight: "calc(100vh - 180px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Conversation</TableCell>
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
                    <TableCell>{report.conversation_name}</TableCell>
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
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleViewClick(report)}
                      >
                        View
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDownloadClick(report)}
                      >
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

      {/* Report Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 1000,
            maxHeight: "80vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #ddd",
              pb: 2,
              mb: 3,
            }}
          >
            <Typography id="modal-title" variant="h4">
              HexaShield Report
            </Typography>
            <IconButton onClick={() => setOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box id="modal-description">
            <AutoManualReportModal
              reportType="manual"
              reportData={selectedReport?.data ?? []}
            />
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
