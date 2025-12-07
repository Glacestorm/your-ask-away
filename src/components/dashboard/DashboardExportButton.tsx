import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  title: string;
  stats: Record<string, number | string>;
  tableData?: Array<Record<string, any>>;
  tableHeaders?: string[];
}

interface DashboardExportButtonProps {
  data: ExportData;
  fileName?: string;
}

export function DashboardExportButton({ data, fileName = 'dashboard-export' }: DashboardExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Stats sheet
      const statsData = Object.entries(data.stats).map(([key, value]) => ({
        'Mètrica': key,
        'Valor': value
      }));
      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Resum');

      // Table data sheet if available
      if (data.tableData && data.tableData.length > 0) {
        const tableSheet = XLSX.utils.json_to_sheet(data.tableData);
        XLSX.utils.book_append_sheet(workbook, tableSheet, 'Detall');
      }

      XLSX.writeFile(workbook, `${fileName}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Excel exportat correctament');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(data.title, pageWidth / 2, 20, { align: 'center' });

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generat: ${new Date().toLocaleDateString('ca-ES')}`, pageWidth / 2, 28, { align: 'center' });

      // Stats section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Resum de Metriques', 14, 42);

      const statsRows = Object.entries(data.stats).map(([key, value]) => [key, String(value)]);
      
      autoTable(doc, {
        startY: 48,
        head: [['Metrica', 'Valor']],
        body: statsRows,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
      });

      // Table data if available
      if (data.tableData && data.tableData.length > 0 && data.tableHeaders) {
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Detall', 14, finalY + 15);

        const tableRows = data.tableData.map(row => 
          data.tableHeaders!.map(header => String(row[header] ?? ''))
        );

        autoTable(doc, {
          startY: finalY + 22,
          head: [data.tableHeaders],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Pagina ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportat correctament');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al exportar a PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} className="gap-2">
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}