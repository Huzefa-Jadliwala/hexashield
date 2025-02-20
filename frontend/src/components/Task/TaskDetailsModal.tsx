import React from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
import { CopyBlock, dracula } from "react-code-blocks";

interface TaskDetailsModalProps {
  open: boolean;
  onClose: () => void;
  task: any;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  open,
  onClose,
  task,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h5" align="center">
          Task Details
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {task ? (
          <>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              textAlign="center"
              mb={2}
            >
              <Typography
                variant="body1"
                gutterBottom
                sx={{ fontFamily: "monospace" }}
              >
                <strong>{task.conversation.title}</strong>
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <Typography variant="body1">
                <span style={{ fontFamily: "monospace" }}>
                  <strong>Started:</strong>
                </span>{" "}
                {new Date(task.created_at).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Typography>
              <Typography variant="body1">
                <span style={{ fontFamily: "monospace" }}>
                  <strong>Ended:</strong>
                </span>{" "}
                {new Date(task.completed_at).toLocaleString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Typography>
            </Box>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <Typography variant="body1" gutterBottom>
                <span style={{ fontFamily: "monospace" }}>
                  <strong>Execution Time:</strong>
                </span>{" "}
                {task.execution_time}
              </Typography>
            </Box>
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              gap={2}
              mb={2}
            >
              <Typography variant="body1" component="span">
                <span style={{ fontFamily: "monospace" }}>
                  <strong>Status:</strong>
                </span>{" "}
              </Typography>
              <Chip
                label={task.status.toUpperCase()}
                color={task.status === "failure" ? "error" : "success"}
                variant="outlined"
                sx={{
                  fontWeight: "bold",
                  fontSize: "0.875rem",
                }}
              />
            </Box>

            {/* Rendering the commands and outputs */}
            {task.outputs.length > 0 ? (
              task.outputs.map((cmd: any, index: number) => (
                <Box key={index} sx={{ mt: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                  >
                    COMMAND {index + 1}:
                  </Typography>
                  <CopyBlock
                    text={cmd.command
                      .split(";")
                      .map((line: string) => {
                        if (line.trim().startsWith("then")) {
                          return "  " + line.trim();
                        }
                        return line.trim();
                      })
                      .join(";\n")}
                    language="bash"
                    showLineNumbers={true}
                    theme={dracula}
                    codeBlock
                  />
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontFamily: "monospace",
                      marginTop: 2,
                      fontSize: "0.875rem",
                    }}
                  >
                    OUTPUT {index + 1}:
                  </Typography>
                  <CopyBlock
                    text={cmd.output
                      .split(";")
                      .map((line: string) => "  " + line.trim())
                      .join(";\n")}
                    language="text"
                    showLineNumbers={true}
                    theme={dracula}
                    codeBlock
                  />
                  <Divider sx={{ my: 2 }} />
                </Box>
              ))
            ) : (
              <Typography>No commands available for this task.</Typography>
            )}
          </>
        ) : (
          <Typography>No task details available</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDetailsModal;
