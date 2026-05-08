// utils/certificateUtils.js
// Utility to generate PDF certificates

import jsPDF from 'jspdf';

export const generateCertificatePDF = (certificateData, guideName) => {
  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    // Set background color (light cream)
    pdf.setFillColor(245, 245, 240);
    pdf.rect(0, 0, 297, 210, 'F');

    // Add decorative border
    pdf.setDrawColor(46, 106, 79); // Dark green
    pdf.setLineWidth(3);
    pdf.rect(10, 10, 277, 190);

    // Add secondary border
    pdf.setLineWidth(1);
    pdf.rect(12, 12, 273, 186);

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(48);
    pdf.setTextColor(46, 106, 79);
    pdf.text('CERTIFICATE', 148.5, 50, { align: 'center' });

    // Subtitle
    pdf.setFontSize(14);
    pdf.setTextColor(100, 100, 100);
    pdf.text('OF COMPLETION', 148.5, 62, { align: 'center' });

    // Decorative line
    pdf.setDrawColor(58, 134, 255);
    pdf.setLineWidth(2);
    pdf.line(60, 70, 237, 70);

    // Main text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('This certifies that', 148.5, 85, { align: 'center' });

    // Guide name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(46, 106, 79);
    pdf.text(guideName, 148.5, 105, { align: 'center' });

    // Achievement text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('has successfully completed the training module:', 148.5, 120, {
      align: 'center',
    });

    // Module title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(58, 134, 255);
    pdf.text(certificateData.title, 148.5, 135, { align: 'center' });

    // Certificate details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);

    const issuedDate = new Date(certificateData.issuedAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const expiresDate = new Date(certificateData.expiresAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    pdf.text(`Certificate Number: ${certificateData.certificateNumber}`, 30, 160);
    pdf.text(`Issued: ${issuedDate}`, 30, 167);
    pdf.text(`Expires: ${expiresDate}`, 30, 174);
    pdf.text(`Score: ${certificateData.score}%`, 30, 181);

    // Seal/Badge
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(40);
    pdf.setTextColor(230, 57, 70);
    pdf.text('🎖️', 220, 165);

    // Footer
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'Digital Park Guide Training & Certification System',
      148.5,
      200,
      { align: 'center' }
    );

    // Generate filename
    const filename = `Certificate_${guideName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    // Download PDF
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    return false;
  }
};
