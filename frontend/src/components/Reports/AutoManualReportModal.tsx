import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { autoManualGeneratePDF } from "@components/Reports/autoManualGeneratePDF";

const AutoManualReportModal = ({
  reportType,
  reportData,
}: {
  reportType: "auto" | "manual";
  reportData: {
    findings: string;
    description: string;
    solutions: string;
    references: string;
  }[];
}) => {
  const handleGeneratePDF = () => {
    autoManualGeneratePDF(reportType, reportData);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        padding: 4,
        borderRadius: 2,
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <Grid item xs={12}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleGeneratePDF}
          >
            Export PDF
          </Button>
        </Box>
      </Grid>
      {reportData.map((item, index) => (
        <Box
          key={index}
          padding={2}
          gap={1}
          sx={{ border: "1px solid #e0e0e0", borderRadius: 1, mb: 2 }}
        >
          <Typography variant="subtitle1" fontWeight="bold" color="error" gutterBottom>
            Finding {index + 1}: {item.findings}
          </Typography>
          <Typography variant="body1" gutterBottom>
            <strong>Description:</strong> {item.description}
          </Typography>
          <Typography variant="body1" color="success.main" gutterBottom>
            <strong>Solutions:</strong>
          </Typography>
          <List>
            {item.solutions.split("\n").map((solution, solutionIndex) => (
              <ListItem key={solutionIndex}>{solution}</ListItem>
            ))}
          </List>
          <Typography variant="body1" color="secondary" gutterBottom>
            <strong>Standard References:</strong>
          </Typography>
          <List>
            {item.references.split("\n").map((reference, referenceIndex) => (
              <ListItem key={referenceIndex}>{reference}</ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Paper>
  );
};

export default AutoManualReportModal;
