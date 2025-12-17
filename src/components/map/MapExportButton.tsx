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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CompanyWithDetails, StatusColor } from '@/types/database';
import { Download, FileSpreadsheet, FileText, Map, Loader2, Lock, BarChart3, List, Settings } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { createEnhancedPDF } from '@/lib/pdfUtils';

interface MapExportButtonProps {
  companies: CompanyWithDetails[];
  filteredCompanies: CompanyWithDetails[];
  statusColors: StatusColor[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface PDFOptions {
  includeCharts: boolean;
  includeTOC: boolean;
  addWatermark: boolean;
  password: string;
}

export function MapExportButton({
  companies,
  filteredCompanies,
  statusColors,
  isOpen,
  onOpenChange,
}: MapExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [pendingExport, setPendingExport] = useState<{ data: CompanyWithDetails[]; filename: string } | null>(null);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    includeCharts: true,
    includeTOC: true,
    addWatermark: false,
    password: '',
  });

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

  const openPDFOptions = (data: CompanyWithDetails[], filename: string) => {
    setPendingExport({ data, filename });
    setShowOptions(true);
  };

  const exportToPDF = async () => {
    if (!pendingExport) return;
    
    const { data, filename } = pendingExport;
    setExporting(true);
    
    try {
      const pdf = createEnhancedPDF('l', 'a4');
      
      // Header
      let y = pdf.addHeaderSync('Informe de Mapa Empresarial', `${data.length} empreses`);

      // Statistics section
      if (pdfOptions.includeTOC) {
        pdf.addTOCEntry('Estadístiques', 1);
      }
      y = pdf.addSectionHeader('Estadístiques Generals', y, 1);
      
      const withGeo = data.filter(c => c.latitude && c.longitude).length;
      const avgVinculacion = data.reduce((sum, c) => {
        const v = ((c.vinculacion_entidad_1 || 0) + (c.vinculacion_entidad_2 || 0) + (c.vinculacion_entidad_3 || 0)) / 3;
        return sum + v;
      }, 0) / (data.length || 1);
      const totalFacturacion = data.reduce((sum, c) => sum + (c.turnover || 0), 0);
      
      const doc = pdf.getDoc();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`Total empreses: ${data.length}`, 14, y);
      doc.text(`Geolocalitzades: ${withGeo} (${((withGeo / data.length) * 100).toFixed(1)}%)`, 100, y);
      doc.text(`Vinculació mitjana: ${avgVinculacion.toFixed(1)}%`, 180, y);
      y += 6;
      doc.text(`Facturació total: ${formatCurrency(totalFacturacion)}`, 14, y);
      y += 15;

      // Charts
      if (pdfOptions.includeCharts) {
        if (pdfOptions.includeTOC) {
          pdf.addTOCEntry('Gràfics', 1);
        }
        y = pdf.addSectionHeader('Distribució per Parròquia', y, 1);
        
        const parroquiaCount = data.reduce((acc, c) => {
          acc[c.parroquia] = (acc[c.parroquia] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const chartData = Object.entries(parroquiaCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([label, value]) => ({ label, value }));
        
        pdf.drawBarChart({
          type: 'bar',
          title: 'Empreses per Parròquia',
          data: chartData,
          y: y,
          height: 50
        });
        y += 65;

        // Status distribution pie chart
        const statusCount = data.reduce((acc, c) => {
          const status = getStatusName(c.status_id);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const pieData = Object.entries(statusCount)
          .slice(0, 6)
          .map(([label, value], i) => ({
            label,
            value,
            color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][i]
          }));
        
        y = pdf.checkPageBreak(y, 80);
        pdf.drawPieChart({
          type: 'pie',
          title: 'Distribució per Estat',
          data: pieData,
          x: pdf.getPageWidth() / 4,
          y: y + 40,
          width: 30
        });
        y += 100;
      }

      // Table
      if (pdfOptions.includeTOC) {
        pdf.addTOCEntry('Llistat d\'Empreses', 1);
      }
      y = pdf.checkPageBreak(y, 50);
      y = pdf.addSectionHeader('Llistat d\'Empreses', y, 1);
      
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

      pdf.addTable(
        ['Nom', 'Estat', 'Parròquia', 'Sector', 'Tipus', 'Facturació', 'Vinc.', 'Geo'],
        tableData,
        y
      );

      // Generate TOC
      if (pdfOptions.includeTOC) {
        pdf.generateTOC(50);
      }

      // Apply watermark if enabled
      if (pdfOptions.addWatermark) {
        pdf.addWatermark('CONFIDENCIAL');
      }

      // Apply protection if password provided
      if (pdfOptions.password) {
        pdf.applyProtection(pdfOptions.password);
      }

      // Footer
      pdf.addFooter();

      pdf.save(`${filename}.pdf`);
      toast.success(`Informe PDF generat amb ${data.length} empreses`);
      setShowOptions(false);
      setPendingExport(null);
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
    <>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
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
          <DropdownMenuItem onClick={() => openPDFOptions(filteredCompanies, `informe_mapa_${new Date().toISOString().split('T')[0]}`)}>
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            PDF (Visibles)
            <Settings className="h-3 w-3 ml-auto text-muted-foreground" />
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
          <DropdownMenuItem onClick={() => openPDFOptions(companies, `informe_complet_${new Date().toISOString().split('T')[0]}`)}>
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            PDF (Totes)
            <Settings className="h-3 w-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportGeoJSON(companies, `totes_empreses_geo_${new Date().toISOString().split('T')[0]}`)}>
            <Map className="mr-2 h-4 w-4 text-blue-600" />
            GeoJSON (Totes)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showOptions} onOpenChange={setShowOptions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Opcions d'Exportació PDF
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mapIncludeCharts"
                checked={pdfOptions.includeCharts}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, includeCharts: checked as boolean })
                }
              />
              <Label htmlFor="mapIncludeCharts" className="font-normal flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Incloure gràfics
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mapIncludeTOC"
                checked={pdfOptions.includeTOC}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, includeTOC: checked as boolean })
                }
              />
              <Label htmlFor="mapIncludeTOC" className="font-normal flex items-center gap-1">
                <List className="h-4 w-4" />
                Taula de continguts interactiva
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mapAddWatermark"
                checked={pdfOptions.addWatermark}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, addWatermark: checked as boolean })
                }
              />
              <Label htmlFor="mapAddWatermark" className="font-normal">
                Afegir marca d'aigua "CONFIDENCIAL"
              </Label>
            </div>

            <div className="space-y-2 border-t pt-3">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Lock className="h-4 w-4" />
                Protecció del Document
              </Label>
              <Input
                type="password"
                placeholder="Contrasenya (opcional)"
                value={pdfOptions.password}
                onChange={(e) => setPdfOptions({ ...pdfOptions, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Deixa en blanc per no protegir el document
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOptions(false)}>
              Cancel·lar
            </Button>
            <Button onClick={exportToPDF} disabled={exporting}>
              {exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
