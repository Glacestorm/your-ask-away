import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { CompanyWithDetails, StatusColor } from '@/types/database';
import { Download, FileSpreadsheet, FileText, Map, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MapExportButtonProps {
  companies: CompanyWithDetails[];
  filteredCompanies: CompanyWithDetails[];
  statusColors: StatusColor[];
}

export function MapExportButton({
  companies,
  filteredCompanies,
  statusColors,
}: MapExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const getStatusName = (statusId: string | null) => {
    if (!statusId) return 'Sense estat';
    const status = statusColors.find(s => s.id === statusId);
    return status?.status_name || 'Desconegut';
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('ca-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const exportToExcel = async (data: CompanyWithDetails[], filename: string) => {
    setExporting(true);
    try {
      const exportData = data.map(company => ({
        'Nom': company.name,
        'Estat': getStatusName(company.status_id),
        'Parròquia': company.parroquia || '-',
        'Adreça': company.address || '-',
        'Telèfon': company.phone || '-',
        'Email': company.email || '-',
        'Web': company.website || '-',
        'Sector': company.sector || '-',
        'CNAE': company.cnae || '-',
        'Tipus Client': company.client_type === 'cliente' ? 'Client' : company.client_type === 'potencial_cliente' ? 'Potencial' : '-',
        'BP': company.bp || '-',
        'NRT': company.tax_id || '-',
        'Oficina': company.oficina || '-',
        'Facturació Anual': company.turnover || 0,
        'Beneficis': company.beneficios || 0,
        'P&L Banco': company.pl_banco || 0,
        'Vinculació Creand (%)': company.vinculacion_entidad_1 || 0,
        'Vinculació Morabanc (%)': company.vinculacion_entidad_2 || 0,
        'Vinculació Andbank (%)': company.vinculacion_entidad_3 || 0,
        'Empleats': company.employees || 0,
        'Latitud': company.latitude,
        'Longitud': company.longitude,
        'Última Visita': company.fecha_ultima_visita || '-',
        'Observacions': company.observaciones || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Empreses');

      // Auto-adjust column widths
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      XLSX.writeFile(wb, `${filename}.xlsx`);
      toast.success(`${data.length} empreses exportades a Excel`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Error en exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async (data: CompanyWithDetails[], filename: string) => {
    setExporting(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Informe de Mapa Empresarial', 14, 22);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data: ${new Date().toLocaleDateString('ca-ES')}`, 14, 30);
      doc.text(`Total empreses: ${data.length}`, 14, 36);

      // Statistics summary
      const withGeo = data.filter(c => c.latitude && c.longitude).length;
      const avgVinculacion = data.reduce((sum, c) => {
        const v = ((c.vinculacion_entidad_1 || 0) + (c.vinculacion_entidad_2 || 0) + (c.vinculacion_entidad_3 || 0)) / 3;
        return sum + v;
      }, 0) / (data.length || 1);
      const totalFacturacion = data.reduce((sum, c) => sum + (c.turnover || 0), 0);

      doc.text(`Geolocalitzades: ${withGeo} (${((withGeo / data.length) * 100).toFixed(1)}%)`, 100, 30);
      doc.text(`Vinculació mitjana: ${avgVinculacion.toFixed(1)}%`, 100, 36);
      doc.text(`Facturació total: ${formatCurrency(totalFacturacion)}`, 180, 30);

      // Table
      const tableData = data.map(company => [
        company.name?.substring(0, 25) || '-',
        getStatusName(company.status_id),
        company.parroquia || '-',
        company.sector?.substring(0, 15) || '-',
        company.client_type === 'cliente' ? 'Client' : company.client_type === 'potencial_cliente' ? 'Potencial' : '-',
        formatCurrency(company.turnover),
        `${(((company.vinculacion_entidad_1 || 0) + (company.vinculacion_entidad_2 || 0) + (company.vinculacion_entidad_3 || 0)) / 3).toFixed(0)}%`,
        company.latitude && company.longitude ? 'Sí' : 'No',
      ]);

      autoTable(doc, {
        head: [['Nom', 'Estat', 'Parròquia', 'Sector', 'Tipus', 'Facturació', 'Vinc.', 'Geo']],
        body: tableData,
        startY: 44,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`${filename}.pdf`);
      toast.success(`Informe PDF generat amb ${data.length} empreses`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error en generar el PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportGeoJSON = async (data: CompanyWithDetails[], filename: string) => {
    setExporting(true);
    try {
      const geoJson = {
        type: 'FeatureCollection',
        features: data
          .filter(c => c.latitude && c.longitude)
          .map(company => ({
            type: 'Feature',
            properties: {
              id: company.id,
              name: company.name,
              status: getStatusName(company.status_id),
              parroquia: company.parroquia,
              address: company.address,
              phone: company.phone,
              email: company.email,
              sector: company.sector,
              cnae: company.cnae,
              client_type: company.client_type,
              turnover: company.turnover,
              vinculacion_creand: company.vinculacion_entidad_1,
              vinculacion_morabanc: company.vinculacion_entidad_2,
              vinculacion_andbank: company.vinculacion_entidad_3,
            },
            geometry: {
              type: 'Point',
              coordinates: [company.longitude, company.latitude],
            },
          })),
      };

      const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.geojson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`GeoJSON exportat amb ${geoJson.features.length} empreses`);
    } catch (error) {
      console.error('Error exporting GeoJSON:', error);
      toast.error('Error en exportar GeoJSON');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          className="h-7 text-xs"
        >
          {exporting ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Download className="mr-1 h-3 w-3" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card">
        <DropdownMenuLabel className="text-xs">Empreses Visibles ({filteredCompanies.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportToExcel(filteredCompanies, `mapa_empreses_filtrades_${new Date().toISOString().split('T')[0]}`)}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (Visibles)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(filteredCompanies, `informe_mapa_${new Date().toISOString().split('T')[0]}`)}>
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          PDF (Visibles)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportGeoJSON(filteredCompanies, `empreses_geo_${new Date().toISOString().split('T')[0]}`)}>
          <Map className="mr-2 h-4 w-4 text-blue-600" />
          GeoJSON (Visibles)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs">Totes les Empreses ({companies.length})</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => exportToExcel(companies, `totes_empreses_${new Date().toISOString().split('T')[0]}`)}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (Totes)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPDF(companies, `informe_complet_${new Date().toISOString().split('T')[0]}`)}>
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          PDF (Totes)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportGeoJSON(companies, `totes_empreses_geo_${new Date().toISOString().split('T')[0]}`)}>
          <Map className="mr-2 h-4 w-4 text-blue-600" />
          GeoJSON (Totes)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
