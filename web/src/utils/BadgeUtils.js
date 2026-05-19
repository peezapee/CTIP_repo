// utils/BadgeUtils.js
// Utility to generate PDF badges

import jsPDF from 'jspdf';

export const generateBadgePDF = (badgeData, guideName) => {
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
    pdf.text('BADGE', 148.5, 50, { align: 'center' });

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
    pdf.text('This badge is awarded to', 148.5, 85, { align: 'center' });

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
    pdf.text(badgeData.title, 148.5, 135, { align: 'center' });

    // Badge details
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);

    const issuedDate = new Date(badgeData.issuedAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    const expiresDate = new Date(badgeData.expiresAt).toLocaleDateString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    );

    pdf.text(`Badge Number: ${badgeData.BadgeNumber}`, 30, 160);
    pdf.text(`Issued: ${issuedDate}`, 30, 167);
    pdf.text(`Expires: ${expiresDate}`, 30, 174);
    pdf.text(`Score: ${badgeData.score}%`, 30, 181);

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
      'Digital Park Guide Training & Badge System',
      148.5,
      200,
      { align: 'center' }
    );

    // Generate filename
    const filename = `Badge_${guideName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;

    // Download PDF
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating badge PDF:', error);
    return false;
  }
};
