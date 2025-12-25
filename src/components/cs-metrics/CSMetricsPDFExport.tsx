import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { FileDown, FileText, Loader2, CheckCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface CSMetricsData {
  nps: number;
  csat: number;
  ces: number;
  churnRate: number;
  nrr: number;
  grr: number;
  healthScore: number;
  clv: number;
  cac: number;
}

interface CSMetricsPDFExportProps {
  metrics: CSMetricsData;
  companyName?: string;
  period?: { start: string; end: string };
  className?: string;
}

interface ExportOptions {
  includeExecutiveSummary: boolean;
  includeMetricsTable: boolean;
  includeCharts: boolean;
  includeCorrelations: boolean;
  includeAIRecommendations: boolean;
  includeBenchmarks: boolean;
  includeAlerts: boolean;
  password?: string;
}

const METRIC_DEFINITIONS: Record<string, { name: string; unit: string; benchmark: string }> = {
  nps: { name: 'Net Promoter Score', unit: 'puntos', benchmark: '>50 excelente, >20 bueno' },
  csat: { name: 'Customer Satisfaction', unit: '%', benchmark: '>85% excelente' },
  ces: { name: 'Customer Effort Score', unit: 'puntos', benchmark: '<3 excelente' },
  churnRate: { name: 'Tasa de Churn', unit: '%', benchmark: '<5% SaaS típico' },
  nrr: { name: 'Net Revenue Retention', unit: '%', benchmark: '>110% excelente' },
  grr: { name: 'Gross Revenue Retention', unit: '%', benchmark: '>90% saludable' },
  healthScore: { name: 'Health Score', unit: 'puntos', benchmark: '>70 saludable' },
  clv: { name: 'Customer Lifetime Value', unit: '€', benchmark: 'CLV:CAC > 3:1' },
  cac: { name: 'Customer Acquisition Cost', unit: '€', benchmark: 'Payback < 12 meses' },
};

export function CSMetricsPDFExport({ 
  metrics, 
  companyName = 'Mi Empresa',
  period,
  className 
}: CSMetricsPDFExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);
  const [options, setOptions] = useState<ExportOptions>({
    includeExecutiveSummary: true,
    includeMetricsTable: true,
    includeCharts: true,
    includeCorrelations: true,
    includeAIRecommendations: true,
    includeBenchmarks: true,
    includeAlerts: false,
    password: '',
  });

  const fetchAIRecommendations = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cs-metrics-assistant', {
        body: {
          action: 'generate_recommendations',
          metrics,
          context: { companyName, period }
        }
      });

      if (error) throw error;
      return data?.recommendations || [];
    } catch (err) {
      console.error('Error fetching AI recommendations:', err);
      return [
        `Con un NPS de ${metrics.nps}, enfócate en convertir pasivos a promotores mediante seguimiento personalizado.`,
        `Tu NRR de ${metrics.nrr}% ${metrics.nrr > 100 ? 'indica expansión saludable' : 'sugiere oportunidades de upselling'}.`,
        `El Health Score de ${metrics.healthScore} ${metrics.healthScore > 70 ? 'muestra clientes saludables' : 'requiere atención en cuentas en riesgo'}.`,
        `Considera reducir el CAC optimizando canales de adquisición con mejor conversión.`,
        `Implementa alertas proactivas para detectar señales de churn tempranamente.`,
      ];
    }
  }, [metrics, companyName, period]);

  const generatePDF = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPos = 20;

      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('Informe de Métricas CS', 15, 25);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(companyName, 15, 35);
      
      const dateText = period 
        ? `${period.start} - ${period.end}` 
        : new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.text(dateText, pageWidth - 15, 35, { align: 'right' });
      
      yPos = 55;
      doc.setTextColor(0, 0, 0);
      setProgress(10);

      // Executive Summary
      if (options.includeExecutiveSummary) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Resumen Ejecutivo', 15, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        const overallHealth = metrics.healthScore > 70 ? 'saludable' : metrics.healthScore > 50 ? 'moderado' : 'requiere atención';
        const summaryText = [
          `El estado general de Customer Success es ${overallHealth} con un Health Score de ${metrics.healthScore}/100.`,
          `La retención neta de ingresos (NRR) es del ${metrics.nrr}%, ${metrics.nrr > 100 ? 'indicando crecimiento por expansión' : 'con oportunidades de mejora'}.`,
          `El NPS actual de ${metrics.nps} puntos posiciona a la empresa ${metrics.nps > 50 ? 'como líder en satisfacción' : metrics.nps > 20 ? 'en un rango competitivo' : 'con áreas de mejora'}.`,
        ];
        
        summaryText.forEach(text => {
          const lines = doc.splitTextToSize(text, pageWidth - 30);
          doc.text(lines, 15, yPos);
          yPos += lines.length * 5 + 3;
        });
        
        yPos += 10;
        setProgress(25);
      }

      // Metrics Table
      if (options.includeMetricsTable) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Métricas Detalladas', 15, yPos);
        yPos += 5;

        const tableData = Object.entries(metrics).map(([key, value]) => {
          const def = METRIC_DEFINITIONS[key];
          const status = getMetricStatus(key, value);
          return [
            def?.name || key,
            `${typeof value === 'number' ? value.toFixed(1) : value} ${def?.unit || ''}`,
            status,
            def?.benchmark || '-'
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['Métrica', 'Valor', 'Estado', 'Benchmark']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [99, 102, 241] },
          styles: { fontSize: 9 },
          columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'center' },
          },
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
        setProgress(45);
      }

      // AI Recommendations
      if (options.includeAIRecommendations) {
        setProgress(50);
        const recommendations = await fetchAIRecommendations();
        setAiRecommendations(recommendations);
        setProgress(70);

        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Recomendaciones IA', 15, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        recommendations.forEach((rec, i) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text(`${i + 1}.`, 15, yPos);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(rec, pageWidth - 35);
          doc.text(lines, 22, yPos);
          yPos += lines.length * 5 + 5;
        });

        yPos += 10;
        setProgress(85);
      }

      // Benchmarks
      if (options.includeBenchmarks) {
        if (yPos > 220) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Comparativa con Benchmarks SaaS', 15, yPos);
        yPos += 5;

        const benchmarkData = [
          ['NPS', metrics.nps.toString(), '30-50', metrics.nps > 50 ? 'Excelente' : metrics.nps > 30 ? 'Bueno' : 'Mejorar'],
          ['CSAT', `${metrics.csat}%`, '80-90%', metrics.csat > 85 ? 'Excelente' : 'Bueno'],
          ['Churn Rate', `${metrics.churnRate}%`, '3-7%', metrics.churnRate < 5 ? 'Excelente' : 'Normal'],
          ['NRR', `${metrics.nrr}%`, '100-120%', metrics.nrr > 110 ? 'Excelente' : metrics.nrr > 100 ? 'Bueno' : 'Mejorar'],
          ['GRR', `${metrics.grr}%`, '85-95%', metrics.grr > 90 ? 'Saludable' : 'Atención'],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Métrica', 'Tu Valor', 'Benchmark', 'Posición']],
          body: benchmarkData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 9 },
        });

        setProgress(95);
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages?.() || 1;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generado el ${new Date().toLocaleDateString('es-ES')} | Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      setProgress(100);

      // Save PDF
      const fileName = `informe-cs-${companyName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      toast.success('Informe PDF generado correctamente', {
        description: fileName,
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  const getMetricStatus = (key: string, value: number): string => {
    const thresholds: Record<string, { good: number; excellent: number; higher: boolean }> = {
      nps: { good: 20, excellent: 50, higher: true },
      csat: { good: 75, excellent: 85, higher: true },
      ces: { good: 4, excellent: 2, higher: false },
      churnRate: { good: 7, excellent: 5, higher: false },
      nrr: { good: 100, excellent: 110, higher: true },
      grr: { good: 85, excellent: 92, higher: true },
      healthScore: { good: 60, excellent: 75, higher: true },
    };

    const t = thresholds[key];
    if (!t) return '—';

    if (t.higher) {
      return value >= t.excellent ? '🟢 Excelente' : value >= t.good ? '🟡 Bueno' : '🔴 Mejorar';
    } else {
      return value <= t.excellent ? '🟢 Excelente' : value <= t.good ? '🟡 Bueno' : '🔴 Mejorar';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={cn("gap-2", className)}>
          <FileDown className="h-4 w-4" />
          Exportar Informe PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Configurar Informe PDF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Secciones a incluir</Label>
            
            {[
              { key: 'includeExecutiveSummary', label: 'Resumen ejecutivo' },
              { key: 'includeMetricsTable', label: 'Tabla de métricas' },
              { key: 'includeAIRecommendations', label: 'Recomendaciones IA', icon: Sparkles },
              { key: 'includeBenchmarks', label: 'Comparativa con benchmarks' },
              { key: 'includeCorrelations', label: 'Análisis de correlaciones' },
              { key: 'includeAlerts', label: 'Alertas activas' },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-3">
                <Checkbox
                  id={key}
                  checked={options[key as keyof ExportOptions] as boolean}
                  onCheckedChange={(checked) => 
                    setOptions(prev => ({ ...prev, [key]: checked }))
                  }
                />
                <Label htmlFor={key} className="text-sm flex items-center gap-2 cursor-pointer">
                  {label}
                  {Icon && <Icon className="h-3 w-3 text-primary" />}
                </Label>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm">
              Contraseña PDF (opcional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Dejar vacío para sin protección"
              value={options.password}
              onChange={(e) => setOptions(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generando informe...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {progress >= 50 && progress < 85 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Generando recomendaciones con IA...
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
            Cancelar
          </Button>
          <Button onClick={generatePDF} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Generar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CSMetricsPDFExport;
