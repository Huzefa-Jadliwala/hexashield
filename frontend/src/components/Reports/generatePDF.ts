import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { ReportData, riskLevels } from "../../app/base.types";
import hexalayerLogo from "./logo.png";

export const generatePDF = async (
  reportData: ReportData[],
  riskSummary: Record<string, number>,
  alertSummary: Record<string, number>
) => {
  const doc = new jsPDF();
  const currentDateTime = new Date().toLocaleString('de-DE');

  // Add logo
  doc.addImage(hexalayerLogo, "PNG", 180, 9, 20, 20); // x, y, width, height

  // Title
  doc.setFontSize(20);
  if(reportData[0]?.url){
    doc.text("WEB HEX Report", 14, 18);
    doc.setFontSize(10);
    doc.text("URL: " + reportData[0].url, 14, 25); 
    doc.text(`Generated on: ${currentDateTime}`, 14, 30);
  }
  else{
    doc.text("Hexashield  Report", 14, 25);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDateTime}`, 14, 30);
  }
  
  // Risk Summary Table
  doc.setFontSize(14);
  doc.text("Risk Summary", 14, 40);

  const riskData = Object.entries(riskSummary).map(([risk, count]) => [
    risk,
    count.toString(),
  ]);

  doc.autoTable({
    startY: 45,
    head: [["Risk Level", "Count"]],
    body: riskData.map(([risk, count]) => [
      {
        content: risk,
        styles: {
          fillColor: riskLevels[risk].bgcolor,
          textColor: riskLevels[risk].color,
        },
      },
      count,
    ]),
    theme: "grid",
    headStyles: { fillColor: [69, 69, 69] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
    },
  });

  // Alert Summary Table
  doc.setFontSize(14);
  doc.text("Alert Summary", 14, doc.lastAutoTable.finalY + 15);

  const alertData = Object.entries(alertSummary).map(([name]) => [
    name,
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [["Alert Name"]],
    body: alertData,
    theme: "grid",
    headStyles: { fillColor: [69, 69, 69] },
    columnStyles: {
      0: { cellWidth: 180 },
    },
  });

  // Detailed Findings
  doc.setFontSize(14);
  doc.text("Detailed Findings", 14, doc.lastAutoTable.finalY + 15);

  const findingsData = reportData.map((finding) => [
    finding.name,
    finding.risk,
    finding.description,
    finding.solution,
    finding.cweid === '-1' ? "N/A" : finding.cweid, // Replace `None` with a valid value
  ]);

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    head: [["CWE", "Name", "Risk Level", "Description", "Solution"]],
    body: findingsData.map(([name, risk, description, solution, cweid]) => [
      cweid,
      name,
      {
        content: risk,
        styles: {
          fillColor: riskLevels[risk].bgcolor,
          textColor: riskLevels[risk].color,
        },
      },
      description,
      solution,
    ]),
    theme: "grid",
    headStyles: { fillColor: [69, 69, 69] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 30 },
      2: { cellWidth: 20 },
      3: { cellWidth: 60 },
      4: { cellWidth: 50 },
    },
    styles: { overflow: "linebreak" },
  });

  // Save the PDF
  doc.save("security-report.pdf");
};
