import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FileDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportOptions {
  reportType: 'companies' | 'visits' | 'products';
  dateRange: {
    from: Date | null;
    to: Date | null;
  } | null;
  includeStats: boolean;
  includeCharts: boolean;
}

export function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    reportType: 'companies',
    dateRange: null,
    includeStats: true,
    includeCharts: false,
  });

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text('Mapa Empresarial Andorra', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Informe de ${options.reportType === 'companies' ? 'Empresas' : options.reportType === 'visits' ? 'Visitas' : 'Productos'}`, pageWidth / 2, 28, { align: 'center' });
      doc.text(`Generado: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es })}`, pageWidth / 2, 35, { align: 'center' });
      
      let yPosition = 45;

      // Fetch data based on report type
      if (options.reportType === 'companies') {
        const { data: companies, error } = await supabase
          .from('companies')
          .select(`
            name,
            address,
            parroquia,
            cnae,
            fecha_ultima_visita,
            status:status_colors(status_name)
          `)
          .order('name');

        if (error) throw error;

        if (options.includeStats && companies) {
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Estadísticas Generales', 14, yPosition);
          yPosition += 10;

          doc.setFontSize(10);
          doc.text(`Total de empresas: ${companies.length}`, 14, yPosition);
          yPosition += 6;

          const parroquias = [...new Set(companies.map(c => c.parroquia))];
          doc.text(`Parroquias cubiertas: ${parroquias.length}`, 14, yPosition);
          yPosition += 10;
        }

        // Table
        autoTable(doc, {
          startY: yPosition,
          head: [['Nombre', 'Dirección', 'Parroquia', 'CNAE', 'Estado']],
          body: companies?.map(c => [
            c.name,
            c.address,
            c.parroquia,
            c.cnae || 'N/A',
            (c.status as any)?.status_name || 'N/A'
          ]) || [],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });

      } else if (options.reportType === 'visits') {
        let query = supabase
          .from('visits')
          .select(`
            visit_date,
            result,
            notes,
            company:companies(name),
            gestor:profiles(full_name)
          `)
          .order('visit_date', { ascending: false });

        if (options.dateRange?.from) {
          query = query.gte('visit_date', format(options.dateRange.from, 'yyyy-MM-dd'));
        }
        if (options.dateRange?.to) {
          query = query.lte('visit_date', format(options.dateRange.to, 'yyyy-MM-dd'));
        }

        const { data: visits, error } = await query;
        if (error) throw error;

        if (options.includeStats && visits) {
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Estadísticas de Visitas', 14, yPosition);
          yPosition += 10;

          doc.setFontSize(10);
          doc.text(`Total de visitas: ${visits.length}`, 14, yPosition);
          yPosition += 6;

          const uniqueCompanies = new Set(visits.map(v => (v.company as any)?.name)).size;
          doc.text(`Empresas visitadas: ${uniqueCompanies}`, 14, yPosition);
          yPosition += 10;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [['Fecha', 'Empresa', 'Gestor', 'Resultado']],
          body: visits?.map(v => [
            format(new Date(v.visit_date), 'dd/MM/yyyy'),
            (v.company as any)?.name || 'N/A',
            (v.gestor as any)?.full_name || 'N/A',
            v.result || 'Sin resultado'
          ]) || [],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });

      } else if (options.reportType === 'products') {
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            name,
            category,
            price,
            active
          `)
          .order('name');

        if (error) throw error;

        if (options.includeStats && products) {
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text('Estadísticas de Productos', 14, yPosition);
          yPosition += 10;

          doc.setFontSize(10);
          doc.text(`Total de productos: ${products.length}`, 14, yPosition);
          yPosition += 6;
          doc.text(`Productos activos: ${products.filter(p => p.active).length}`, 14, yPosition);
          yPosition += 10;
        }

        autoTable(doc, {
          startY: yPosition,
          head: [['Nombre', 'Categoría', 'Precio', 'Estado']],
          body: products?.map(p => [
            p.name,
            p.category || 'N/A',
            p.price ? `€${p.price}` : 'N/A',
            p.active ? 'Activo' : 'Inactivo'
          ]) || [],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      const fileName = `informe_${options.reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast.success('Informe generado correctamente');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el informe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generar Informe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipo de Informe</Label>
          <Select
            value={options.reportType}
            onValueChange={(value: any) => setOptions({ ...options, reportType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="companies">Empresas</SelectItem>
              <SelectItem value="visits">Visitas</SelectItem>
              <SelectItem value="products">Productos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {options.reportType === 'visits' && (
          <div className="space-y-2">
            <Label>Rango de Fechas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !options.dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {options.dateRange?.from ? (
                    options.dateRange.to ? (
                      <>
                        {format(options.dateRange.from, "dd MMM yyyy", { locale: es })} -{" "}
                        {format(options.dateRange.to, "dd MMM yyyy", { locale: es })}
                      </>
                    ) : (
                      format(options.dateRange.from, "dd MMM yyyy", { locale: es })
                    )
                  ) : (
                    <span>Seleccionar rango</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: options.dateRange?.from || undefined,
                    to: options.dateRange?.to || undefined,
                  }}
                  onSelect={(range) => {
                    setOptions({
                      ...options,
                      dateRange: range ? { from: range.from || null, to: range.to || null } : null,
                    });
                  }}
                  locale={es}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeStats"
              checked={options.includeStats}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeStats: checked as boolean })
              }
            />
            <Label htmlFor="includeStats" className="font-normal">
              Incluir estadísticas
            </Label>
          </div>
        </div>

        <Button
          onClick={generatePDF}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Generar PDF
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
