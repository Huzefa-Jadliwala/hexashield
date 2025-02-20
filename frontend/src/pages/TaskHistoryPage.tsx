import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  TableSortLabel,
  TablePagination,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useTasks } from "@app/tasks/hooks";
import TaskDetailsModal from "../components/Task/TaskDetailsModal";

type Order = "asc" | "desc";

const TaskHistoryPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState("created_at");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [open, setOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks with pagination and sorting
  const { tasks, loading, error, fetchTasks } = useTasks({
    agentId: agentId!,
    page,
    page_size: rowsPerPage,
    sort_by: orderBy,
    sort_order: order,
  });

  // Refetch tasks when sorting or pagination changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, page, rowsPerPage, orderBy, order]);

  const handleRequestSort = (property: string) => {
    const isAscending = orderBy === property && order === "asc";
    setOrder(isAscending ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage + 1);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const handleOpenModal = (task: any) => {
    setSelectedTask(task);
    setOpen(true);
  };

  const handleCloseModal = () => {
    setOpen(false);
    setSelectedTask(null);
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", p: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        TASK HISTORY
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 4, borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    { id: "conversation.title", label: "Task Name" },
                    { id: "status", label: "Status" },
                    { id: "created_at", label: "Started" },
                    { id: "completed_at", label: "Ended" },
                    { id: "execution_time", label: "Execution Time" },
                    { id: "actions", label: "Actions" },
                  ].map((column) => (
                    <TableCell key={column.id}>
                      {column.id !== "actions" ? (
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : "asc"}
                          onClick={() => handleRequestSort(column.id)}
                          sx={{ "& .MuiTableSortLabel-icon": { color: orderBy === column.id ? "purple" : "black" } }}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks?.data?.map((task) => (
                  <TableRow key={task.id} sx={{ bgcolor: "background.paper", "&:hover": { bgcolor: "action.hover" } }}>
                    <TableCell>{task?.conversation?.title}</TableCell>
                    <TableCell sx={{ color: task?.status === "failure" ? "red" : "green", fontWeight: "bold" }}>
                      {task?.status}
                    </TableCell>
                    <TableCell>{new Date(task?.created_at).toLocaleString("de-DE")}</TableCell>
                    <TableCell>{new Date(task?.completed_at).toLocaleString("de-DE")}</TableCell>
                    <TableCell>{task?.execution_time}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ textTransform: "none", bgcolor: "primary.main", "&:hover": { bgcolor: "primary.dark" } }}
                        onClick={() => handleOpenModal(task)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={tasks?.total_items || 0}
            page={page - 1}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[15, 25, 50, 100]}
            sx={{ mt: 2, "& .MuiTablePagination-actions": { color: "primary.main" } }}
          />
        </>
      )}

      {/* Modal */}
      <TaskDetailsModal open={open} onClose={handleCloseModal} task={selectedTask} />
    </Box>
  );
};

export default TaskHistoryPage;
