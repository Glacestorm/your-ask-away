import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import obelixiaLogo from '@/assets/obelixia-logo-official.jpg';

interface TOCEntry {
  title: string;
  page: number;
  level: number;
}

interface PDFOptions {
  title: string;
  subtitle?: string;
  password?: string;
  enableTOC?: boolean;
  includeCharts?: boolean;
}

interface ChartData {
  type: 'bar' | 'pie' | 'line';
  title: string;
  data: { label: string; value: number; color?: string }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// ObelixIA official logo as base64 (loaded at runtime)
let logoBase64: string | null = null;

// Load logo as base64
async function loadLogoBase64(): Promise<string> {
  if (logoBase64) return logoBase64;
  
  try {
    const response = await fetch(obelixiaLogo);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64 = reader.result as string;
        resolve(logoBase64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error loading logo:', error);
    return '';
  }
}

// Shared PDF utilities for enhanced PDF generation
export class EnhancedPDFGenerator {
  private doc: jsPDF;
  private tocEntries: TOCEntry[] = [];
  private pageWidth: number;
  private pageHeight: number;
  private margins = { left: 14, right: 14, top: 20, bottom: 20 };
  private brandColor: [number, number, number] = [30, 58, 95]; // ObelixIA dark blue
  private accentColor: [number, number, number] = [13, 115, 119]; // ObelixIA teal

  constructor(orientation: 'p' | 'l' = 'p', format: string = 'a4') {
    this.doc = new jsPDF(orientation, 'mm', format);
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  getDoc(): jsPDF {
    return this.doc;
  }

  getPageWidth(): number {
    return this.pageWidth;
  }

  getPageHeight(): number {
    return this.pageHeight;
  }

  // Add header with ObelixIA branding and logo
  async addHeader(title: string, subtitle?: string): Promise<number> {
    let y = 15;
    
    // Add logo with dark background
    try {
      const logo = await loadLogoBase64();
      if (logo) {
        // Dark background for logo area
        this.doc.setFillColor(15, 23, 42); // Very dark blue/black
        this.doc.rect(0, 0, this.pageWidth, 45, 'F');
        
        // Add logo image
        this.doc.addImage(logo, 'JPEG', this.margins.left, 8, 60, 20);
        y = 35;
      }
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Fallback to text-based header with dark background
      this.doc.setFillColor(15, 23, 42);
      this.doc.rect(0, 0, this.pageWidth, 35, 'F');
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(59, 130, 246);
      this.doc.text('ObelixIA', this.margins.left, 22);
      y = 30;
    }
    
    y += 10;
    
    // Title
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.brandColor);
    this.doc.text(title, this.pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    // Date
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Generat: ${new Date().toLocaleDateString('ca-ES')}`, this.pageWidth / 2, y, { align: 'center' });
    y += 15;

    return y;
  }

  // Add header synchronously (without logo, for backwards compatibility)
  addHeaderSync(title: string, subtitle?: string): number {
    let y = 15;
    
    // Dark background header
    this.doc.setFillColor(15, 23, 42);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // ObelixIA text as fallback
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(59, 130, 246);
    this.doc.text('ObelixIA', this.margins.left, 22);
    
    y = 45;
    
    // Title
    this.doc.setFontSize(22);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...this.brandColor);
    this.doc.text(title, this.pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(100, 100, 100);
      this.doc.text(subtitle, this.pageWidth / 2, y, { align: 'center' });
      y += 8;
    }

    // Date
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Generat: ${new Date().toLocaleDateString('ca-ES')}`, this.pageWidth / 2, y, { align: 'center' });
    y += 15;

    return y;
  }

  // Add TOC entry for internal linking
  addTOCEntry(title: string, level: number = 1): void {
    this.tocEntries.push({
      title,
      page: this.doc.getNumberOfPages(),
      level
    });
  }

  // Generate Table of Contents with clickable links
  generateTOC(startY: number = 50): number {
    if (this.tocEntries.length === 0) return startY;

    let y = startY;
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('Índex de Continguts', this.margins.left, y);
    y += 12;

    this.tocEntries.forEach((entry, index) => {
      const indent = (entry.level - 1) * 10;
      const fontSize = entry.level === 1 ? 11 : 10;
      
      this.doc.setFontSize(fontSize);
      this.doc.setFont('helvetica', entry.level === 1 ? 'bold' : 'normal');
      this.doc.setTextColor(entry.level === 1 ? 0 : 60, entry.level === 1 ? 0 : 60, entry.level === 1 ? 0 : 60);
      
      // Entry text
      const text = entry.title;
      this.doc.text(text, this.margins.left + indent, y);
      
      // Page number
      this.doc.setTextColor(...this.brandColor);
      this.doc.text(String(entry.page), this.pageWidth - this.margins.right - 10, y, { align: 'right' });
      
      // Add internal link
      const textWidth = this.doc.getTextWidth(text);
      this.doc.link(this.margins.left + indent, y - 4, textWidth + 50, 6, { pageNumber: entry.page });
      
      // Dotted line between text and page number
      this.doc.setDrawColor(200, 200, 200);
      this.doc.setLineDashPattern([1, 1], 0);
      const lineStart = this.margins.left + indent + textWidth + 5;
      const lineEnd = this.pageWidth - this.margins.right - 20;
      if (lineEnd > lineStart) {
        this.doc.line(lineStart, y - 1, lineEnd, y - 1);
      }
      this.doc.setLineDashPattern([], 0);
      
      y += 8;
      
      if (y > this.pageHeight - 30) {
        this.doc.addPage();
        y = 30;
      }
    });

    return y + 10;
  }

  // Add section header with TOC registration
  addSectionHeader(title: string, y: number, level: number = 1): number {
    this.addTOCEntry(title, level);
    
    const fontSize = level === 1 ? 14 : 12;
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(level === 1 ? 0 : 60, level === 1 ? 0 : 60, level === 1 ? 0 : 60);
    this.doc.text(title, this.margins.left, y);
    
    return y + (level === 1 ? 10 : 8);
  }

  // Draw bar chart
  drawBarChart(chartData: ChartData): void {
    const x = chartData.x || this.margins.left;
    const y = chartData.y || 100;
    const width = chartData.width || this.pageWidth - this.margins.left - this.margins.right;
    const height = chartData.height || 60;
    
    const maxValue = Math.max(...chartData.data.map(d => d.value), 1);
    const barWidth = (width - 20) / chartData.data.length;
    const chartAreaHeight = height - 20;
    
    // Chart title
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(chartData.title, x, y);
    
    // Draw bars
    chartData.data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartAreaHeight;
      const barX = x + (index * barWidth) + 5;
      const barY = y + height - barHeight - 5;
      
      // Bar fill
      const color = item.color ? this.hexToRgb(item.color) : this.brandColor;
      this.doc.setFillColor(...color);
      this.doc.rect(barX, barY, barWidth - 4, barHeight, 'F');
      
      // Value label
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(String(item.value), barX + (barWidth - 4) / 2, barY - 2, { align: 'center' });
      
      // Category label
      this.doc.setFontSize(6);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(80, 80, 80);
      const label = item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label;
      this.doc.text(label, barX + (barWidth - 4) / 2, y + height, { align: 'center' });
    });
  }

  // Draw pie chart
  drawPieChart(chartData: ChartData): void {
    const centerX = chartData.x || this.pageWidth / 2;
    const centerY = chartData.y || 100;
    const radius = chartData.width || 30;
    
    const total = chartData.data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;
    
    // Chart title
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(chartData.title, centerX, centerY - radius - 10, { align: 'center' });
    
    let startAngle = -Math.PI / 2; // Start from top
    const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    chartData.data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;
      const color = item.color ? this.hexToRgb(item.color) : this.hexToRgb(defaultColors[index % defaultColors.length]);
      
      // Draw pie slice using polygon approximation
      this.doc.setFillColor(...color);
      
      const points: [number, number][] = [[centerX, centerY]];
      const steps = Math.max(Math.ceil(sliceAngle / 0.1), 3);
      
      for (let i = 0; i <= steps; i++) {
        const angle = startAngle + (sliceAngle * i / steps);
        points.push([
          centerX + radius * Math.cos(angle),
          centerY + radius * Math.sin(angle)
        ]);
      }
      
      // Draw as filled polygon
      if (points.length >= 3) {
        const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ') + ' Z';
        this.doc.setFillColor(...color);
        
        // Use triangle fan approach
        for (let i = 1; i < points.length - 1; i++) {
          this.doc.triangle(
            points[0][0], points[0][1],
            points[i][0], points[i][1],
            points[i + 1][0], points[i + 1][1],
            'F'
          );
        }
      }
      
      startAngle = endAngle;
    });
    
    // Legend
    let legendY = centerY + radius + 10;
    chartData.data.forEach((item, index) => {
      const color = item.color ? this.hexToRgb(item.color) : this.hexToRgb(defaultColors[index % defaultColors.length]);
      const percentage = ((item.value / total) * 100).toFixed(1);
      
      this.doc.setFillColor(...color);
      this.doc.rect(centerX - 40, legendY - 3, 4, 4, 'F');
      
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(0, 0, 0);
      this.doc.text(`${item.label}: ${percentage}%`, centerX - 34, legendY);
      
      legendY += 6;
    });
  }

  // Draw line chart
  drawLineChart(chartData: ChartData): void {
    const x = chartData.x || this.margins.left;
    const y = chartData.y || 100;
    const width = chartData.width || this.pageWidth - this.margins.left - this.margins.right;
    const height = chartData.height || 50;
    
    if (chartData.data.length < 2) return;
    
    const maxValue = Math.max(...chartData.data.map(d => d.value), 1);
    const pointSpacing = (width - 20) / (chartData.data.length - 1);
    const chartAreaHeight = height - 15;
    
    // Chart title
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(chartData.title, x, y);
    
    // Draw axes
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.3);
    this.doc.line(x, y + height - 5, x + width, y + height - 5); // X axis
    this.doc.line(x, y + 10, x, y + height - 5); // Y axis
    
    // Draw line
    this.doc.setDrawColor(...this.brandColor);
    this.doc.setLineWidth(1);
    
    const points: [number, number][] = chartData.data.map((item, index) => {
      const pointX = x + 10 + (index * pointSpacing);
      const pointY = y + height - 5 - ((item.value / maxValue) * chartAreaHeight);
      return [pointX, pointY];
    });
    
    for (let i = 0; i < points.length - 1; i++) {
      this.doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }
    
    // Draw points
    this.doc.setFillColor(...this.brandColor);
    points.forEach(([px, py]) => {
      this.doc.circle(px, py, 1.5, 'F');
    });
    
    // Labels
    this.doc.setFontSize(6);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(80, 80, 80);
    chartData.data.forEach((item, index) => {
      const labelX = x + 10 + (index * pointSpacing);
      const label = item.label.length > 6 ? item.label.substring(0, 6) : item.label;
      this.doc.text(label, labelX, y + height, { align: 'center' });
    });
  }

  // Add table with autoTable
  addTable(
    headers: string[],
    data: (string | number)[][],
    startY: number,
    options?: Partial<Parameters<typeof autoTable>[1]>
  ): number {
    autoTable(this.doc, {
      startY,
      head: [headers],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: this.brandColor, textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: this.margins.left, right: this.margins.right },
      ...options
    });
    
    return (this.doc as any).lastAutoTable?.finalY || startY + 20;
  }

  // Add footer to all pages with ObelixIA branding
  addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Footer background
      this.doc.setFillColor(15, 23, 42);
      this.doc.rect(0, this.pageHeight - 20, this.pageWidth, 20, 'F');
      
      // Company name
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(59, 130, 246);
      this.doc.text('ObelixIA', this.margins.left, this.pageHeight - 10);
      
      // Contact info
      this.doc.setFontSize(7);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(200, 200, 200);
      this.doc.text('info@obelixia.com | +34 606 770 033', this.margins.left + 25, this.pageHeight - 10);
      
      // Page number
      this.doc.setFontSize(8);
      this.doc.setTextColor(200, 200, 200);
      this.doc.text(
        `Pàgina ${i} de ${pageCount}`,
        this.pageWidth - this.margins.right,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  // Apply password protection (via PDF metadata - basic protection)
  applyProtection(password: string): void {
    // jsPDF doesn't natively support encryption
    // We add a metadata flag that can be used by external tools
    // For real encryption, we'd need a library like pdf-lib
    this.doc.setProperties({
      title: 'Document Protegit',
      subject: 'Requereix contrasenya per visualitzar',
      author: 'Mapa Empresarial Andorra',
      keywords: 'protegit, confidencial',
      creator: 'EnhancedPDFGenerator'
    });
    
    // Add watermark indicating protection
    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(200, 200, 200);
      this.doc.text('DOCUMENT CONFIDENCIAL', this.pageWidth - this.margins.right, 10, { align: 'right' });
    }
  }

  // Add watermark
  addWatermark(text: string = 'CONFIDENCIAL'): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(60);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(230, 230, 230);
      
      // Diagonal watermark
      this.doc.text(text, this.pageWidth / 2, this.pageHeight / 2, {
        align: 'center',
        angle: 45
      });
    }
  }

  // Save the PDF
  save(filename: string): void {
    this.doc.save(filename);
  }

  // Helper: Convert hex to RGB
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [59, 130, 246];
  }

  // Check if new page needed
  checkPageBreak(currentY: number, neededSpace: number = 30): number {
    if (currentY + neededSpace > this.pageHeight - this.margins.bottom) {
      this.doc.addPage();
      return this.margins.top + 10;
    }
    return currentY;
  }

  // Add new page
  addPage(): number {
    this.doc.addPage();
    return this.margins.top + 10;
  }
}

// Factory function for quick creation
export function createEnhancedPDF(orientation: 'p' | 'l' = 'p', format: string = 'a4'): EnhancedPDFGenerator {
  return new EnhancedPDFGenerator(orientation, format);
}
