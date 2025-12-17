import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
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
import { Download, FileSpreadsheet, FileText, Loader2, Settings, Lock, BarChart3, List } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { createEnhancedPDF } from '@/lib/pdfUtils';

interface ExportData {
  title: string;
  stats: Record<string, number | string>;
  tableData?: Array<Record<string, any>>;
  tableHeaders?: string[];
  chartData?: { label: string; value: number }[];
}

interface DashboardExportButtonProps {
  data: ExportData;
  fileName?: string;
}

interface PDFOptions {
  includeCharts: boolean;
  includeTOC: boolean;
  addWatermark: boolean;
  password: string;
}

export function DashboardExportButton({ data, fileName = 'dashboard-export' }: DashboardExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
    includeCharts: true,
    includeTOC: true,
    addWatermark: false,
    password: '',
  });

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
      const pdf = createEnhancedPDF('p', 'a4');
      
      // Header
      let y = pdf.addHeaderSync(data.title, 'Informe del Dashboard');

      // Stats section with TOC
      if (pdfOptions.includeTOC) {
        pdf.addTOCEntry('Resum de Mètriques', 1);
      }
      y = pdf.addSectionHeader('Resum de Mètriques', y, 1);

      const statsRows = Object.entries(data.stats).map(([key, value]) => [key, String(value)]);
      y = pdf.addTable(['Mètrica', 'Valor'], statsRows, y);
      y += 15;

      // Charts section
      if (pdfOptions.includeCharts && data.chartData && data.chartData.length > 0) {
        if (pdfOptions.includeTOC) {
          pdf.addTOCEntry('Gràfics', 1);
        }
        y = pdf.checkPageBreak(y, 100);
        y = pdf.addSectionHeader('Visualització de Dades', y, 1);
        
        pdf.drawBarChart({
          type: 'bar',
          title: 'Distribució de Mètriques',
          data: data.chartData.slice(0, 10),
          y: y,
          height: 70
        });
        y += 85;
      } else if (pdfOptions.includeCharts && Object.keys(data.stats).length > 0) {
        // Create chart from stats if no chartData provided
        if (pdfOptions.includeTOC) {
          pdf.addTOCEntry('Gràfics', 1);
        }
        y = pdf.checkPageBreak(y, 100);
        y = pdf.addSectionHeader('Visualització de Mètriques', y, 1);
        
        const numericStats = Object.entries(data.stats)
          .filter(([_, value]) => typeof value === 'number')
          .map(([label, value]) => ({ label, value: value as number }))
          .slice(0, 8);
        
        if (numericStats.length > 0) {
          pdf.drawBarChart({
            type: 'bar',
            title: 'Mètriques Principals',
            data: numericStats,
            y: y,
            height: 70
          });
          y += 85;
        }
      }

      // Table data if available
      if (data.tableData && data.tableData.length > 0 && data.tableHeaders) {
        if (pdfOptions.includeTOC) {
          pdf.addTOCEntry('Detall', 1);
        }
        y = pdf.checkPageBreak(y, 50);
        y = pdf.addSectionHeader('Detall', y, 1);

        const tableRows = data.tableData.map(row => 
          data.tableHeaders!.map(header => String(row[header] ?? ''))
        );

        y = pdf.addTable(data.tableHeaders, tableRows, y, { styles: { fontSize: 8 } });
      }

      // Generate TOC if enabled
      if (pdfOptions.includeTOC) {
        pdf.generateTOC(y > 200 ? 50 : y + 20);
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

      pdf.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exportat correctament');
      setShowOptions(false);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Error al exportar a PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
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
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs">Format d'Exportació</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exportar a Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowOptions(true)} className="gap-2">
            <FileText className="h-4 w-4 text-red-600" />
            Exportar a PDF
            <Settings className="h-3 w-3 ml-auto text-muted-foreground" />
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
                id="includeCharts"
                checked={pdfOptions.includeCharts}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, includeCharts: checked as boolean })
                }
              />
              <Label htmlFor="includeCharts" className="font-normal flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Incloure gràfics
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeTOC"
                checked={pdfOptions.includeTOC}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, includeTOC: checked as boolean })
                }
              />
              <Label htmlFor="includeTOC" className="font-normal flex items-center gap-1">
                <List className="h-4 w-4" />
                Taula de continguts interactiva
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="addWatermark"
                checked={pdfOptions.addWatermark}
                onCheckedChange={(checked) =>
                  setPdfOptions({ ...pdfOptions, addWatermark: checked as boolean })
                }
              />
              <Label htmlFor="addWatermark" className="font-normal">
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
