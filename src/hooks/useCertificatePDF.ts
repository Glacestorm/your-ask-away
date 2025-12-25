/**
 * useCertificatePDF - Hook para generar certificados PDF profesionales
 */

import { useCallback } from 'react';
import jsPDF from 'jspdf';
import { CertificateData } from './useTrainingCertificates';

export function useCertificatePDF() {
  const generatePDF = useCallback((data: CertificateData): Blob => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Background gradient effect (simulated with rectangles)
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative border
    doc.setDrawColor(59, 130, 246); // primary blue
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 3, 3, 'S');

    // Inner decorative border
    doc.setDrawColor(100, 116, 139); // slate-500
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 5, margin + 5, pageWidth - margin * 2 - 10, pageHeight - margin * 2 - 10, 2, 2, 'S');

    // Header section
    doc.setTextColor(59, 130, 246); // primary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('ACADEMIA', pageWidth / 2, 35, { align: 'center' });

    // Main title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFICADO', pageWidth / 2, 50, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('DE FINALIZACIÓN', pageWidth / 2, 60, { align: 'center' });

    // Decorative line
    doc.setDrawColor(59, 130, 246);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 40, 68, pageWidth / 2 + 40, 68);

    // "Se certifica que" text
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(11);
    doc.text('Se certifica que', pageWidth / 2, 82, { align: 'center' });

    // Student name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(data.studentName, pageWidth / 2, 95, { align: 'center' });

    // "ha completado satisfactoriamente" text
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('ha completado satisfactoriamente el curso', pageWidth / 2, 108, { align: 'center' });

    // Course name
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    
    // Handle long course names
    const courseName = data.courseName;
    if (courseName.length > 50) {
      const lines = doc.splitTextToSize(courseName, pageWidth - 80);
      doc.text(lines, pageWidth / 2, 122, { align: 'center' });
    } else {
      doc.text(courseName, pageWidth / 2, 122, { align: 'center' });
    }

    // Score and grade (if available)
    let yPosition = 138;
    if (data.score !== undefined) {
      doc.setTextColor(34, 197, 94); // green-500
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Calificación: ${data.score}%`, pageWidth / 2 - 30, yPosition, { align: 'center' });
      
      if (data.grade) {
        doc.text(`(${data.grade})`, pageWidth / 2 + 30, yPosition, { align: 'center' });
      }
      yPosition += 10;
    }

    // Skills section (if available)
    if (data.skills && data.skills.length > 0) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Competencias adquiridas:', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 6;
      doc.setTextColor(203, 213, 225); // slate-300
      const skillsText = data.skills.slice(0, 5).join(' • ');
      doc.text(skillsText, pageWidth / 2, yPosition, { align: 'center' });
    }

    // Footer section
    const footerY = pageHeight - 40;

    // Date
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Fecha de emisión:', margin + 30, footerY, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    const formattedDate = new Date(data.completionDate).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(formattedDate, margin + 30, footerY + 6, { align: 'center' });

    // Certificate number
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.text('Número de certificado:', pageWidth / 2, footerY, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('courier', 'normal');
    doc.text(data.certificateNumber, pageWidth / 2, footerY + 6, { align: 'center' });

    // Verification code
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(10);
    doc.text('Código de verificación:', pageWidth - margin - 30, footerY, { align: 'center' });
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(11);
    doc.setFont('courier', 'bold');
    doc.text(data.verificationCode, pageWidth - margin - 30, footerY + 6, { align: 'center' });

    // Verification URL
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const verifyUrl = `${window.location.origin}/academia/verificar/${data.verificationCode}`;
    doc.text(`Verificar en: ${verifyUrl}`, pageWidth / 2, pageHeight - 22, { align: 'center' });

    // Organization name
    if (data.organizationName) {
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text(`Emitido por ${data.organizationName}`, pageWidth / 2, pageHeight - 28, { align: 'center' });
    }

    return doc.output('blob');
  }, []);

  const downloadPDF = useCallback((data: CertificateData) => {
    const blob = generatePDF(data);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificado-${data.certificateNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [generatePDF]);

  return {
    generatePDF,
    downloadPDF,
  };
}

export default useCertificatePDF;
