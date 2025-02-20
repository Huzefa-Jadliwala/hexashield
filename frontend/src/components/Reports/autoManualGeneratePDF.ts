import { jsPDF } from "jspdf";
import "jspdf-autotable";
import hexalayerLogo from "./logo.png";

interface ReportData {
  findings: string;
  description: string;
  solutions: string;
  references: string;
}

export const autoManualGeneratePDF = async (reportType: "auto" | "manual", reportData: ReportData[]) => {
  const doc = new jsPDF();
  const currentDateTime = new Date().toLocaleString("de-DE");
  const sanitizedDateTime = currentDateTime.replace(/[:\s]/g, "_");
  const totalFindings = reportData.length;

  // Set margins and page dimensions
  const marginLeft = 14;
  const marginTop = 20;
  const marginRight = 14;
  const marginBottom = 20;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const effectivePageHeight = pageHeight - marginBottom;

  // Helper function to clean duplicate numbers in list items
  const cleanDuplicateNumbers = (text: string): string => {
    const lines = text.split('\n');
    return lines.map(line => 
      line.replace(/^(\d+\.\s*)+(\d+\.)/, '$2')
    ).join('\n');
  };

  // Keep track of current Y position
  let yPosition = marginTop + 24;

  const addNewPageIfNeeded = (requiredSpace: number): boolean => {
    if (yPosition + requiredSpace > effectivePageHeight) {
      doc.addPage();
      yPosition = marginTop;
      return true;
    }
    return false;
  };

  const calculateTextHeight = (text: string, fontSize: number, maxWidth: number): number => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    return lines.length * fontSize * 0.3527777778; // Convert points to mm
  };

  try {
    // Add logo
    doc.addImage(hexalayerLogo, "PNG", pageWidth - 40, 9, 20, 20);
  } catch (error) {
    console.error("Error adding logo:", error);
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0);
  doc.text(reportType === "auto" ? "Auto Report" : "Manual Report", marginLeft, marginTop);

  // Generated date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${currentDateTime}`, marginLeft, marginTop + 8);

  // Total Findings
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 255);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Findings: ${totalFindings}`, marginLeft, marginTop + 16);

  // Iterate over report data
  reportData.forEach((item, index) => {
    // Clean up any duplicate numbers in solutions and references
    const cleanedSolutions = cleanDuplicateNumbers(item.solutions);
    const cleanedReferences = cleanDuplicateNumbers(item.references);

    // Calculate required height for the current finding
    const titleHeight = 10;
    const descriptionHeight = calculateTextHeight(
      item.description,
      12,
      pageWidth - marginLeft - marginRight
    );
    const solutionsHeight = calculateTextHeight(
      cleanedSolutions,
      12,
      pageWidth - marginLeft - marginRight
    );
    const referencesHeight = calculateTextHeight(
      cleanedReferences,
      12,
      pageWidth - marginLeft - marginRight
    );

    const totalRequiredHeight = titleHeight + descriptionHeight + solutionsHeight + 
      referencesHeight + 40; // Additional padding

    // Check if we need a new page
    addNewPageIfNeeded(totalRequiredHeight);

    // Add title for each finding
    doc.setFontSize(14);
    doc.setTextColor(255, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Finding ${index + 1}: ${item.findings}`, marginLeft, yPosition);
    yPosition += 10;

    // Add description
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Description:", marginLeft, yPosition);
    yPosition += 6;
    const descriptionLines = doc.splitTextToSize(
      item.description,
      pageWidth - marginLeft - marginRight
    );
    doc.text(descriptionLines, marginLeft, yPosition);
    yPosition += descriptionLines.length * 6 + 6;

    // Check for page break before solutions
    if (addNewPageIfNeeded(solutionsHeight + 20)) {
      yPosition = marginTop;
    }

    // Add solutions
    doc.setTextColor(0, 128, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Solutions:", marginLeft, yPosition);
    yPosition += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    const solutionsLines = doc.splitTextToSize(
      cleanedSolutions,
      pageWidth - marginLeft - marginRight
    );
    doc.text(solutionsLines, marginLeft, yPosition);
    yPosition += solutionsLines.length * 6 + 6;

    // Check for page break before references
    if (addNewPageIfNeeded(referencesHeight + 20)) {
      yPosition = marginTop;
    }

    // Add standard references
    doc.setTextColor(0, 0, 128);
    doc.setFont("helvetica", "bold");
    doc.text("Standard References:", marginLeft, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "italic");
    const referencesLines = doc.splitTextToSize(
      cleanedReferences,
      pageWidth - marginLeft - marginRight
    );
    doc.text(referencesLines, marginLeft, yPosition);
    yPosition += referencesLines.length * 6 + 10;

    // Add spacing between findings
    yPosition += 10;
  });

  const reportName = `${reportType === "auto" ? "Auto-Report" : "Manual-Report"}_${sanitizedDateTime}.pdf`;
  doc.save(reportName);
};