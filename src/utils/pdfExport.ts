import { jsPDF } from 'jspdf';
import type { AssessmentResult } from '../types';

/**
 * Export an assessment to PDF format
 */
export function exportToPDF(result: AssessmentResult): void {
  // Create a new PDF document (letter size)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  // Set up fonts and styling
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 14;
  let yPosition = margin;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(result.templateName, margin, yPosition);
  yPosition += 25;

  // Metadata
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const formattedDate = new Date(result.createdAt).toLocaleString();
  doc.text(`Generated: ${formattedDate}`, margin, yPosition);
  yPosition += 15;

  if (result.prompt) {
    checkPageBreak(30);
    doc.text(`Prompt: ${result.prompt}`, margin, yPosition);
    yPosition += 20;
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 20;

  // Content - main assessment text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Split content into lines and wrap text
  const lines = doc.splitTextToSize(result.content, contentWidth);
  
  for (const line of lines) {
    checkPageBreak(lineHeight + 5);
    doc.text(line, margin, yPosition);
    yPosition += lineHeight;
  }

  // Save the PDF
  const fileName = `${result.templateName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Export multiple assessments to a single PDF
 */
export function exportMultipleToPDF(results: AssessmentResult[]): void {
  if (results.length === 0) return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - 2 * margin;
  const lineHeight = 14;
  let yPosition = margin;
  let isFirstAssessment = true;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  for (const result of results) {
    // Add page break between assessments (except the first one)
    if (!isFirstAssessment) {
      doc.addPage();
      yPosition = margin;
    }
    isFirstAssessment = false;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(result.templateName, margin, yPosition);
    yPosition += 20;

    // Metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const formattedDate = new Date(result.createdAt).toLocaleString();
    doc.text(`Generated: ${formattedDate}`, margin, yPosition);
    yPosition += 12;

    if (result.prompt) {
      const promptLines = doc.splitTextToSize(`Prompt: ${result.prompt}`, contentWidth);
      for (const line of promptLines) {
        checkPageBreak(12);
        doc.text(line, margin, yPosition);
        yPosition += 12;
      }
    }
    yPosition += 8;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;

    // Content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    const lines = doc.splitTextToSize(result.content, contentWidth);
    for (const line of lines) {
      checkPageBreak(lineHeight + 2);
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    }
  }

  // Save the PDF
  const fileName = `assessments_${Date.now()}.pdf`;
  doc.save(fileName);
}
