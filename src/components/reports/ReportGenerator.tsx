import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, FileDown, Loader2, Lock, BarChart3, List } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createEnhancedPDF } from '@/lib/pdfUtils';

interface ReportOptions {
  reportType: 'companies' | 'visits' | 'products';
  dateRange: {
    from: Date | null;
    to: Date | null;
  } | null;
  includeStats: boolean;
  includeCharts: boolean;
  includeTOC: boolean;
  password: string;
  addWatermark: boolean;
}

export function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ReportOptions>({
    reportType: 'companies',
    dateRange: null,
    includeStats: true,
    includeCharts: true,
    includeTOC: true,
    password: '',
    addWatermark: false,
  });

  const generatePDF = async () => {
    try {
      setLoading(true);
      
      const pdf = createEnhancedPDF('p', 'a4');
      const reportTitle = options.reportType === 'companies' ? 'Informe d\'Empreses' : 
                          options.reportType === 'visits' ? 'Informe de Visites' : 'Informe de Productes';
      
      // Cover page
      let y = pdf.addHeaderSync('Mapa Empresarial Andorra', reportTitle);

      // Fetch data based on report type
      if (options.reportType === 'companies') {
        const { data: companies, error } = await supabase
          .from('companies')
          .select(`
            name,
            address,
            parroquia,
            cnae,
            sector,
            fecha_ultima_visita,
            turnover,
            status:status_colors(status_name)
          `)
          .order('name');

        if (error) throw error;

        // Add TOC entry
        if (options.includeTOC) {
          pdf.addTOCEntry('Estadístiques Generals', 1);
        }

        if (options.includeStats && companies) {
          y = pdf.addSectionHeader('Estadístiques Generals', y, 1);
          
          const parroquias = [...new Set(companies.map(c => c.parroquia))];
          const sectors = [...new Set(companies.map(c => c.sector).filter(Boolean))];
          const totalTurnover = companies.reduce((sum, c) => sum + (c.turnover || 0), 0);
          
          pdf.getDoc().setFontSize(10);
          pdf.getDoc().setFont('helvetica', 'normal');
          pdf.getDoc().setTextColor(0, 0, 0);
          pdf.getDoc().text(`Total d'empreses: ${companies.length}`, 14, y);
          y += 6;
          pdf.getDoc().text(`Parròquies cobertes: ${parroquias.length}`, 14, y);
          y += 6;
          pdf.getDoc().text(`Sectors: ${sectors.length}`, 14, y);
          y += 6;
          pdf.getDoc().text(`Facturació total: ${new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(totalTurnover)}`, 14, y);
          y += 15;
        }

        // Charts
        if (options.includeCharts && companies) {
          if (options.includeTOC) {
            pdf.addTOCEntry('Gràfics', 1);
          }
          y = pdf.addSectionHeader('Distribució per Parròquia', y, 1);
          
          const parroquiaCount = companies.reduce((acc, c) => {
            acc[c.parroquia] = (acc[c.parroquia] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const chartData = Object.entries(parroquiaCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, value]) => ({ label, value }));
          
          pdf.drawBarChart({
            type: 'bar',
            title: 'Empreses per Parròquia',
            data: chartData,
            y: y,
            height: 70
          });
          y += 85;

          // Pie chart for status
          const statusCount = companies.reduce((acc, c) => {
            const status = (c.status as any)?.status_name || 'Sense estat';
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
          
          y = pdf.checkPageBreak(y, 100);
          pdf.drawPieChart({
            type: 'pie',
            title: 'Distribució per Estat',
            data: pieData,
            x: pdf.getPageWidth() / 2,
            y: y + 50,
            width: 35
          });
          y += 120;
        }

        // Table
        if (options.includeTOC) {
          pdf.addTOCEntry('Llistat d\'Empreses', 1);
        }
        y = pdf.checkPageBreak(y, 50);
        y = pdf.addSectionHeader('Llistat d\'Empreses', y, 1);
        
        y = pdf.addTable(
          ['Nom', 'Adreça', 'Parròquia', 'CNAE', 'Estat'],
          companies?.map(c => [
            c.name,
            c.address,
            c.parroquia,
            c.cnae || 'N/A',
            (c.status as any)?.status_name || 'N/A'
          ]) || [],
          y
        );

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

        if (options.includeTOC) {
          pdf.addTOCEntry('Estadístiques de Visites', 1);
        }

        if (options.includeStats && visits) {
          y = pdf.addSectionHeader('Estadístiques de Visites', y, 1);
          
          pdf.getDoc().setFontSize(10);
          pdf.getDoc().setFont('helvetica', 'normal');
          pdf.getDoc().setTextColor(0, 0, 0);
          pdf.getDoc().text(`Total de visites: ${visits.length}`, 14, y);
          y += 6;

          const uniqueCompanies = new Set(visits.map(v => (v.company as any)?.name)).size;
          pdf.getDoc().text(`Empreses visitades: ${uniqueCompanies}`, 14, y);
          y += 15;
        }

        // Charts for visits
        if (options.includeCharts && visits && visits.length > 0) {
          if (options.includeTOC) {
            pdf.addTOCEntry('Gràfics de Visites', 1);
          }
          y = pdf.addSectionHeader('Resultats de Visites', y, 1);
          
          const resultCount = visits.reduce((acc, v) => {
            const result = v.result || 'Sense resultat';
            acc[result] = (acc[result] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const pieData = Object.entries(resultCount)
            .slice(0, 6)
            .map(([label, value], i) => ({
              label,
              value,
              color: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'][i]
            }));
          
          pdf.drawPieChart({
            type: 'pie',
            title: 'Distribució per Resultat',
            data: pieData,
            x: pdf.getPageWidth() / 2,
            y: y + 50,
            width: 35
          });
          y += 120;
        }

        if (options.includeTOC) {
          pdf.addTOCEntry('Llistat de Visites', 1);
        }
        y = pdf.checkPageBreak(y, 50);
        y = pdf.addSectionHeader('Llistat de Visites', y, 1);
        
        y = pdf.addTable(
          ['Data', 'Empresa', 'Gestor', 'Resultat'],
          visits?.map(v => [
            format(new Date(v.visit_date), 'dd/MM/yyyy'),
            (v.company as any)?.name || 'N/A',
            (v.gestor as any)?.full_name || 'N/A',
            v.result || 'Sense resultat'
          ]) || [],
          y
        );

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

        if (options.includeTOC) {
          pdf.addTOCEntry('Estadístiques de Productes', 1);
        }

        if (options.includeStats && products) {
          y = pdf.addSectionHeader('Estadístiques de Productes', y, 1);
          
          pdf.getDoc().setFontSize(10);
          pdf.getDoc().setFont('helvetica', 'normal');
          pdf.getDoc().setTextColor(0, 0, 0);
          pdf.getDoc().text(`Total de productes: ${products.length}`, 14, y);
          y += 6;
          pdf.getDoc().text(`Productes actius: ${products.filter(p => p.active).length}`, 14, y);
          y += 15;
        }

        // Charts for products
        if (options.includeCharts && products && products.length > 0) {
          if (options.includeTOC) {
            pdf.addTOCEntry('Gràfics de Productes', 1);
          }
          y = pdf.addSectionHeader('Distribució per Categoria', y, 1);
          
          const categoryCount = products.reduce((acc, p) => {
            const cat = p.category || 'Sense categoria';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          const chartData = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, value]) => ({ label, value }));
          
          pdf.drawBarChart({
            type: 'bar',
            title: 'Productes per Categoria',
            data: chartData,
            y: y,
            height: 70
          });
          y += 85;
        }

        if (options.includeTOC) {
          pdf.addTOCEntry('Llistat de Productes', 1);
        }
        y = pdf.checkPageBreak(y, 50);
        y = pdf.addSectionHeader('Llistat de Productes', y, 1);
        
        y = pdf.addTable(
          ['Nom', 'Categoria', 'Preu', 'Estat'],
          products?.map(p => [
            p.name,
            p.category || 'N/A',
            p.price ? `€${p.price}` : 'N/A',
            p.active ? 'Actiu' : 'Inactiu'
          ]) || [],
          y
        );
      }

      // Generate TOC on first page if enabled
      if (options.includeTOC) {
        // Insert TOC page after cover
        const doc = pdf.getDoc();
        const totalPages = doc.getNumberOfPages();
        
        // Move to page 1 and add TOC
        doc.setPage(1);
        pdf.generateTOC(y > 200 ? 50 : y + 20);
      }

      // Apply watermark if enabled
      if (options.addWatermark) {
        pdf.addWatermark('CONFIDENCIAL');
      }

      // Apply protection if password provided
      if (options.password) {
        pdf.applyProtection(options.password);
      }

      // Add footer
      pdf.addFooter();

      // Save PDF
      const fileName = `informe_${options.reportType}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      toast.success('Informe generat correctament');
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error('Error al generar l\'informe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Generar Informe PDF
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Tipus d'Informe</Label>
          <Select
            value={options.reportType}
            onValueChange={(value: any) => setOptions({ ...options, reportType: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="companies">Empreses</SelectItem>
              <SelectItem value="visits">Visites</SelectItem>
              <SelectItem value="products">Productes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {options.reportType === 'visits' && (
          <div className="space-y-2">
            <Label>Rang de Dates</Label>
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
                    <span>Seleccionar rang</span>
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

        <div className="space-y-3 border-t pt-3">
          <Label className="text-sm font-medium">Opcions del PDF</Label>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeStats"
              checked={options.includeStats}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeStats: checked as boolean })
              }
            />
            <Label htmlFor="includeStats" className="font-normal text-sm">
              Incloure estadístiques
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCharts"
              checked={options.includeCharts}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeCharts: checked as boolean })
              }
            />
            <Label htmlFor="includeCharts" className="font-normal text-sm flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Incloure gràfics
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeTOC"
              checked={options.includeTOC}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeTOC: checked as boolean })
              }
            />
            <Label htmlFor="includeTOC" className="font-normal text-sm flex items-center gap-1">
              <List className="h-3 w-3" />
              Taula de continguts interactiva
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="addWatermark"
              checked={options.addWatermark}
              onCheckedChange={(checked) =>
                setOptions({ ...options, addWatermark: checked as boolean })
              }
            />
            <Label htmlFor="addWatermark" className="font-normal text-sm">
              Afegir marca d'aigua "CONFIDENCIAL"
            </Label>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <Label className="text-sm font-medium flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Protecció del Document
          </Label>
          <Input
            type="password"
            placeholder="Contrasenya (opcional)"
            value={options.password}
            onChange={(e) => setOptions({ ...options, password: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Deixa en blanc per no protegir el document
          </p>
        </div>

        <Button
          onClick={generatePDF}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generant...
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
