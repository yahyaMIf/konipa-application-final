import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

class ExportService {
  // Export data to PDF
  static exportToPDF(data, filename, title = 'Rapport') {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      let yPosition = 30;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin, yPosition);
      yPosition += 20;

      // Date
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, margin, yPosition);
      yPosition += 20;

      // Content
      if (Array.isArray(data)) {
        // Table data
        data.forEach((item, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
          }

          doc.setFontSize(10);
          let text = '';
          if (typeof item === 'object') {
            text = Object.entries(item)
              .map(([key, value]) => `${key}: ${value}`)
              .join(' | ');
          } else {
            text = String(item);
          }

          // Split long text
          const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
          doc.text(lines, margin, yPosition);
          yPosition += lines.length * 5 + 5;
        });
      } else if (typeof data === 'object') {
        // Object data
        Object.entries(data).forEach(([key, value]) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
          }

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(`${key}:`, margin, yPosition);
          
          doc.setFont('helvetica', 'normal');
          const valueText = String(value);
          const lines = doc.splitTextToSize(valueText, pageWidth - 2 * margin - 30);
          doc.text(lines, margin + 30, yPosition);
          yPosition += Math.max(lines.length * 5, 10) + 5;
        });
      } else {
        // Simple text
        doc.setFontSize(12);
        const lines = doc.splitTextToSize(String(data), pageWidth - 2 * margin);
        doc.text(lines, margin, yPosition);
      }

      // Save the PDF
      doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      return true;
    } catch (error) {
      throw new Error('Erreur lors de l\'export PDF');
    }
  }

  // Export data to Excel
  static exportToExcel(data, filename, sheetName = 'Données') {
    try {
      let worksheetData;

      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === 'object') {
          // Array of objects - convert to table format
          worksheetData = data;
        } else {
          // Array of primitives
          worksheetData = data.map((item, index) => ({ 
            'Index': index + 1, 
            'Valeur': item 
          }));
        }
      } else if (typeof data === 'object') {
        // Single object - convert to key-value pairs
        worksheetData = Object.entries(data).map(([key, value]) => ({
          'Propriété': key,
          'Valeur': value
        }));
      } else {
        // Simple data
        worksheetData = [{ 'Données': data }];
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Save the file
      XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
      return true;
    } catch (error) {
      throw new Error('Erreur lors de l\'export Excel');
    }
  }

  // Export HTML element to PDF
  static async exportElementToPDF(elementId, filename, title = 'Rapport') {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Élément non trouvé');
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
      return true;
    } catch (error) {
      throw new Error('Erreur lors de l\'export PDF');
    }
  }

  // Generate financial report
  static generateFinancialReport(stats, unpaidData, filename = 'rapport-financier') {
    const reportData = {
      'Statistiques Générales': {
        'Chiffre d\'affaires': `${stats.totalRevenue?.toLocaleString() || 0} €`,
        'Utilisateurs actifs': stats.activeUsers || 0,
        'Produits': stats.totalProducts || 0,
        'Total impayés': `${stats.totalUnpaid?.toLocaleString() || 0} €`
      },
      'Détails des Impayés': unpaidData || [],
      'Date de génération': new Date().toLocaleDateString('fr-FR')
    };

    return this.exportToPDF(reportData, filename, 'Rapport Financier');
  }

  // Generate invoice report
  static generateInvoiceReport(invoices, filename = 'rapport-factures') {
    const reportData = invoices.map(invoice => ({
      'Facture': invoice.id || invoice.reference,
      'Client': invoice.client || invoice.customer,
      'Montant': `${invoice.amount?.toLocaleString() || 0} €`,
      'Statut': invoice.status,
      'Date': invoice.date,
      'Échéance': invoice.dueDate || invoice.date
    }));

    return this.exportToExcel(reportData, filename, 'Factures');
  }

  // Export detailed report to PDF with professional formatting
  static exportDetailedReportToPDF(reportData, filename) {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = 30;

      // Header with company logo area
      doc.setFillColor(41, 128, 185); // Blue header
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Company name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(reportData.company || 'Konipa', margin, 25);
      
      // Report title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      yPosition = 60;
      doc.text(reportData.title, margin, yPosition);
      
      // Date and generation info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      yPosition += 15;
      doc.text(`Date du rapport: ${reportData.date}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, yPosition);
      
      // Separator line
      yPosition += 15;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 20;

      // Process sections
      if (reportData.sections && Array.isArray(reportData.sections)) {
        reportData.sections.forEach((section, sectionIndex) => {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            doc.addPage();
            yPosition = 30;
          }

          // Section title
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(41, 128, 185);
          doc.text(`${sectionIndex + 1}. ${section.title}`, margin, yPosition);
          yPosition += 15;

          // Section content
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          if (Array.isArray(section.content)) {
            section.content.forEach((item, itemIndex) => {
              // Check if we need a new page
              if (yPosition > pageHeight - 40) {
                doc.addPage();
                yPosition = 30;
              }

              // Bullet point
              doc.text('•', margin + 5, yPosition);
              
              // Content text with proper wrapping
              const lines = doc.splitTextToSize(item, pageWidth - margin - 30);
              doc.text(lines, margin + 15, yPosition);
              yPosition += lines.length * 6 + 3;
            });
          } else if (typeof section.content === 'string') {
            const lines = doc.splitTextToSize(section.content, pageWidth - 2 * margin);
            doc.text(lines, margin, yPosition);
            yPosition += lines.length * 6;
          }

          yPosition += 10; // Space between sections
        });
      }

      // Footer on each page
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
        
        // Footer text
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`${reportData.company || 'Konipa'} - Rapport confidentiel`, margin, pageHeight - 15);
        doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin - 30, pageHeight - 15);
      }

      // Save the PDF
      doc.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default ExportService;