import {
  Modal,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  TablePagination,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LaunchIcon from "@mui/icons-material/Launch";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useState } from "react";
import useFetchProgress from "../../app/reports/hooks/useFetchProgress";
import { generatePDF } from "../Reports/generatePDF";
import { riskLevels } from "../../app/base.types";

const ReportProgressModal = ({
  open,
  onClose,
  reportId,
}: {
  open: boolean;
  onClose: () => void;
  reportId: string;
}) => {
  const { progressData, error, loading } = useFetchProgress(reportId);

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string>("");

  if (loading) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            p: 3,
            borderRadius: 2,
            boxShadow: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            bgcolor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading...</Typography>
        </Box>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal open={open} onClose={onClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
          }}
        >
          <Typography color="error">
            {error.message || "An unexpected error occurred."}
          </Typography>
        </Box>
      </Modal>
    );
  }

  if (!progressData) {
    return null;
  }

  type StatusKey = keyof typeof status;

  const isInProgress = progressData.progress < 100;

  const getStatusStyle = (statusKey: StatusKey) => {
    if (status[statusKey]) {
      return status[statusKey];
    } else if (!isNaN(Number(statusKey.replace("%", "")))) {
      return status.Default;
    }
    return { bgcolor: "transparent", color: "black" };
  };

  const renderProgressContent = () => (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "60%",
        maxWidth: 1000,
        maxHeight: "80vh",
        overflowY: "auto",
        bgcolor: "background.paper",
        boxShadow: 24,
        borderRadius: 2,
        p: 3,
      }}
    >
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
        <Typography id="progress-modal-title" variant="h4" component="h2">
          Web Hex Scan Progress
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{
            color: "text.secondary",
            "&:hover": { color: "error.main" },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box id="progress-modal-description">
        <Typography variant="body1" gutterBottom>
          Current Progress: {progressData.progress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressData.progress}
          sx={{
            mb: 2,
            height: 10,
            borderRadius: 5,
            overflow: "hidden",
            backgroundColor: "rgba(0, 0, 0, 0.1)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              background: `linear-gradient(90deg, #4caf50, #81c784)`,
              transition: "width 0.5s ease-in-out",
            },
          }}
        />
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Plugin</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {progressData?.scan_progress?.HostProcess.map(
                (process: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{process.Plugin[0]}</TableCell>
                    <TableCell>
                      <Chip
                        label={process.Plugin[3]}
                        style={{
                          backgroundColor: getStatusStyle(process.Plugin[3])
                            .bgcolor,
                          color: getStatusStyle(process.Plugin[3]).color,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
  
  const renderReportContent = () => {
    const reportData = progressData.report;
  
    const removeDuplicates = (data: any[]) => {
      const uniqueItems = new Map();
      if (data) {
        data.forEach((item) => {
          if (!uniqueItems.has(item.alertRef)) {
            uniqueItems.set(item.alertRef, item);
          }
        });
      }
      return Array.from(uniqueItems.values());
    };
  
    const filteredReportData = removeDuplicates(reportData);
  
    const riskSummary = filteredReportData.reduce(
      (acc: { [key in keyof typeof riskLevels]?: number }, item) => {
        acc[item.risk] = (acc[item.risk] || 0) + 1;
        return acc;
      },
      {}
    );
  
    const alertSummary = filteredReportData.reduce(
      (acc: { [key: string]: number }, item) => {
        acc[item.name] = (acc[item.name] || 0) + 1;
        return acc;
      },
      {}
    );
  
    const handleGeneratePDF = () => {
      generatePDF(filteredReportData, riskSummary, alertSummary);
    };
  
    const toggleExpanded = (id: string) => {
      setExpanded((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    };
  
    const handleChangePage = (event: unknown, newPage: number) => {
      setPage(newPage);
    };
  
    const handleChangeRowsPerPage = (
      event: React.ChangeEvent<HTMLInputElement>
    ) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };
  
    const handleRiskLevelChange = (event: SelectChangeEvent<string>) => {
      setSelectedRiskLevel(event.target.value as string);
      setPage(0);
    };
  
    const filteredData = selectedRiskLevel
      ? filteredReportData.filter((item) => item.risk === selectedRiskLevel)
      : filteredReportData;
  
    const currentPageData = filteredData.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  
    return (
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "65%",
          maxWidth: 1000,
          maxHeight: "80vh",
          overflowY: "auto",
          bgcolor: "background.paper",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
        }}
      >
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
          <Typography id="report-modal-title" variant="h4" component="h2">
            Web Hex Report
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { color: "error.main" },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "16px",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<FileDownloadIcon />}
                onClick={handleGeneratePDF}
              >
                Export PDF
              </Button>
            </div>
          </Grid>
  
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Risk Summary" />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Risk Level</TableCell>
                        <TableCell>Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(riskSummary).map(([risk, count]) => {
                        const riskKey = risk as keyof typeof riskLevels;
                        return (
                          <TableRow key={risk}>
                            <TableCell>
                              <Chip
                                label={risk}
                                style={{
                                  backgroundColor: riskLevels[riskKey].bgcolor,
                                  color: riskLevels[riskKey].color,
                                }}
                              />
                            </TableCell>
                            <TableCell>{count}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
  
          <Grid item xs={12} md={6}>
            <Card>
              <CardHeader title="Alert Types" />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Alert Name</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(alertSummary).map(([name, count]) => (
                        <TableRow key={name}>
                          <TableCell style={{ maxWidth: "300px" }}>
                            <Typography noWrap>{name}</Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
  
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Detailed Findings"
                action={
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <TablePagination
                      component="div"
                      count={filteredData.length}
                      page={page}
                      onPageChange={handleChangePage}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      rowsPerPageOptions={[5, 10, 25]}
                    />
                    <FormControl
                      variant="outlined"
                      style={{ minWidth: 140, marginLeft: "16px" }}
                    >
                      <InputLabel>Risk Level</InputLabel>
                      <Select
                        value={selectedRiskLevel}
                        onChange={handleRiskLevelChange}
                        label="Risk Level"
                      >
                        <MenuItem value="">
                          <em>All</em>
                        </MenuItem>
                        {Object.keys(riskLevels).map((risk) => (
                          <MenuItem key={risk} value={risk}>
                            {risk}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                }
              />
              <CardContent>
                {currentPageData.map((finding, index) => (
                  <Accordion
                    key={finding.id || index}
                    expanded={expanded[finding.id]}
                    onChange={() => toggleExpanded(finding.id)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Grid container alignItems="center" spacing={2}>
                        <Grid item xs>
                          <Typography variant="subtitle1">
                            {finding.name}
                          </Typography>
                        </Grid>
                        <Grid item>
                          <Chip
                            label={finding.risk}
                            style={{
                              backgroundColor: riskLevels[finding.risk].bgcolor,
                              color: riskLevels[finding.risk].color,
                            }}
                          />
                        </Grid>
                      </Grid>
                    </AccordionSummary>
                    <AccordionDetails>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <div>
                          <Typography variant="h6" gutterBottom>
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {finding.description}
                          </Typography>
                        </div>
  
                        <div>
                          <Typography variant="h6" gutterBottom>
                            Solution
                          </Typography>
                          <Typography variant="body2">
                            {finding.solution}
                          </Typography>
                        </div>
  
                        <div>
                          <Typography variant="h6" gutterBottom>
                            References
                          </Typography>
                          {finding.reference.split("\n").map((ref, idx) => (
                            <Link
                              key={idx}
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              display="flex"
                              alignItems="center"
                              style={{ marginBottom: "4px" }}
                            >
                              <LaunchIcon
                                style={{ fontSize: "1rem", marginRight: "4px" }}
                              />
                              <Typography variant="body2">{ref}</Typography>
                            </Link>
                          ))}
                        </div>
  
                        {finding.tags && (
                          <div>
                            <Typography variant="h6" gutterBottom>
                              Related Standards
                            </Typography>
                            {Object.entries(finding.tags).map(([key, url]) => (
                              <Link
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                display="flex"
                                alignItems="center"
                                style={{ marginBottom: "4px" }}
                              >
                                <LaunchIcon
                                  style={{
                                    fontSize: "1rem",
                                    marginRight: "4px",
                                  }}
                                />
                                <Typography variant="body2">{key}</Typography>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="progress-modal-title"
      aria-describedby="progress-modal-description"
    >
      {isInProgress ? renderProgressContent() : renderReportContent()}
    </Modal>
  );
};

export default ReportProgressModal;

const status = {
  Complete: {
    bgcolor: "green",
    color: "white",
  },
  Pending: {
    bgcolor: "#ffeb3b",
    color: "black",
  },
  Default: {
    bgcolor: "#2196f3",
    color: "white",
  },
};
