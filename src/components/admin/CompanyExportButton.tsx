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
import { useLanguage } from '@/contexts/LanguageContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanyWithDetails } from '@/types/database';

interface CompanyExportButtonProps {
  companies: CompanyWithDetails[];
  selectedCompanies?: Set<string>;
}

export function CompanyExportButton({ companies, selectedCompanies }: CompanyExportButtonProps) {
  const { t } = useLanguage();
  const [exporting, setExporting] = useState(false);

  const getExportData = () => {
    const companiesToExport = selectedCompanies && selectedCompanies.size > 0
      ? companies.filter(c => selectedCompanies.has(c.id))
      : companies;

    return companiesToExport.map(company => ({
      'Nombre': company.name,
      'Direccion': company.address,
      'Parroquia': company.parroquia,
      'Oficina': company.oficina || '',
      'Telefono': (company as any).phone || '',
      'Email': (company as any).email || '',
      'Web': (company as any).website || '',
      'NRT/CIF': (company as any).tax_id || '',
      'BP': (company as any).bp || '',
      'CNAE': company.cnae || '',
      'Sector': (company as any).sector || '',
      'Empleados': (company as any).employees || '',
      'Facturacion': (company as any).turnover || '',
      'Tipo Cliente': (company as any).client_type || '',
      'Forma Juridica': (company as any).legal_form || '',
      'Estado': company.status?.status_name || '',
      'Gestor': company.gestor?.full_name || company.gestor?.email || '',
      'Vinculacion Creand': (company as any).vinculacion_entidad_1 || 0,
      'Vinculacion Morabanc': (company as any).vinculacion_entidad_2 || 0,
      'Vinculacion Andbank': (company as any).vinculacion_entidad_3 || 0,
      'Ultima Visita': company.fecha_ultima_visita || '',
      'Observaciones': company.observaciones || '',
      'Etiquetas': ((company as any).tags || []).join(', '),
      'Latitud': company.latitude,
      'Longitud': company.longitude,
    }));
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const data = getExportData();
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Empresas');
      
      // Auto-width columns
      const maxWidths: number[] = [];
      const headers = Object.keys(data[0] || {});
      headers.forEach((header, i) => {
        maxWidths[i] = Math.max(
          header.length,
          ...data.map(row => String(row[header as keyof typeof row] || '').length)
        );
      });
      worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }));
      
      const fileName = `empresas_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      toast.success(`Exportadas ${data.length} empresas a Excel`);
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
      const data = getExportData();
      const doc = new jsPDF({ orientation: 'landscape' });
      
      // Title
      doc.setFontSize(18);
      doc.text('Listado de Empresas', 14, 22);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 30);
      doc.text(`Total: ${data.length} empresas`, 14, 36);
      
      // Table with main columns
      const tableData = data.map(row => [
        row['Nombre'],
        row['Direccion'],
        row['Parroquia'],
        row['Telefono'],
        row['Email'],
        row['Estado'],
        row['Gestor'],
        `${row['Vinculacion Creand']}%`,
      ]);

      autoTable(doc, {
        head: [['Nombre', 'Direccion', 'Parroquia', 'Telefono', 'Email', 'Estado', 'Gestor', 'Vinc.']],
        body: tableData,
        startY: 42,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      const fileName = `empresas_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success(`Exportadas ${data.length} empresas a PDF`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al exportar a PDF');
    } finally {
      setExporting(false);
    }
  };

  const count = selectedCompanies && selectedCompanies.size > 0 
    ? selectedCompanies.size 
    : companies.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting || count === 0}>
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="ml-2">Exportar ({count})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar a Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar a PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
