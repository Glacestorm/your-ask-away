/**
 * Executive Summary Generator
 * Generador de resumen ejecutivo con IA
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Sparkles, 
  Download,
  Copy,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  DollarSign,
  Users,
  Activity,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface MetricHighlight {
  name: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'positive' | 'negative' | 'neutral';
}

interface ExecutiveSummary {
  period: string;
  generatedAt: string;
  highlights: MetricHighlight[];
  narrative: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
}

const mockSummary: ExecutiveSummary = {
  period: 'Q4 2025',
  generatedAt: new Date().toISOString(),
  highlights: [
    { name: 'NRR', value: '118%', change: 8, trend: 'up', status: 'positive' },
    { name: 'Churn', value: '2.3%', change: -15, trend: 'down', status: 'positive' },
    { name: 'NPS', value: '72', change: 12, trend: 'up', status: 'positive' },
    { name: 'Health Score', value: '78', change: 5, trend: 'up', status: 'positive' },
    { name: 'Expansion MRR', value: '€145K', change: 22, trend: 'up', status: 'positive' },
    { name: 'At-Risk Accounts', value: '12', change: 25, trend: 'up', status: 'negative' },
  ],
  narrative: `El Q4 2025 ha sido un trimestre excepcional para Customer Success, con mejoras significativas en las métricas clave de retención y satisfacción.

**Retención y Revenue:**
Net Revenue Retention alcanzó 118%, superando nuestro objetivo de 110% y posicionándonos en el top quartile de la industria SaaS. La combinación de reducción de churn (2.3%, -15% QoQ) y aumento de expansión (€145K, +22% QoQ) ha sido el principal driver.

**Satisfacción del Cliente:**
NPS mejoró a 72 (+12 puntos), impulsado principalmente por mejoras en el proceso de onboarding y la introducción del programa proactivo de Customer Success. CSAT post-soporte se mantiene en 4.6/5.

**Health Score y Riesgo:**
El Health Score promedio subió a 78 (+5 puntos). Sin embargo, identificamos un aumento del 25% en cuentas at-risk, principalmente en el segmento Mid-Market debido a cambios organizacionales en clientes clave.

**Outlook:**
Con la base actual de clientes saludables y los programas de retención en marcha, proyectamos mantener NRR >115% en Q1 2026.`,
  risks: [
    'Aumento de cuentas at-risk en Mid-Market (+25%)',
    'Dependencia de 3 cuentas Enterprise que representan 18% del ARR',
    'Tiempo de onboarding sigue por encima del benchmark (14 días vs 10)',
    'Competidor X lanzó feature similar a precio inferior',
  ],
  opportunities: [
    '€320K en pipeline de expansion identificado (45 cuentas)',
    '15 cuentas con NPS 9-10 sin testimonial/case study',
    'Potencial de automatización en soporte reduciría CTS 20%',
    'Nuevo módulo de analytics tiene 60% interest rate en base existente',
  ],
  recommendations: [
    'Priorizar intervención inmediata en las 12 cuentas at-risk (€180K ARR)',
    'Implementar programa de advocacy para convertir promotores en referrals',
    'Reducir tiempo de onboarding a 10 días con nuevo playbook automatizado',
    'Lanzar campaña de expansion para nuevo módulo de analytics',
    'Revisar pricing de segmento afectado por competidor',
  ],
};

export function ExecutiveSummaryGenerator() {
  const [period, setPeriod] = useState('q4-2025');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<ExecutiveSummary>(mockSummary);
  const [customNotes, setCustomNotes] = useState('');

  const generateSummary = useCallback(async () => {
    setIsGenerating(true);
    // Simular generación con IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSummary({
      ...mockSummary,
      generatedAt: new Date().toISOString(),
    });
    setIsGenerating(false);
    toast.success('Resumen ejecutivo generado con IA');
  }, []);

  const copyToClipboard = useCallback(() => {
    const text = `
CS Executive Summary - ${summary.period}
Generated: ${new Date(summary.generatedAt).toLocaleString()}

${summary.narrative}

RISKS:
${summary.risks.map(r => `• ${r}`).join('\n')}

OPPORTUNITIES:
${summary.opportunities.map(o => `• ${o}`).join('\n')}

RECOMMENDATIONS:
${summary.recommendations.map(r => `• ${r}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  }, [summary]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`CS Executive Summary - ${summary.period}`, 14, 22);
    doc.setFontSize(9);
    doc.text(`Generado: ${new Date(summary.generatedAt).toLocaleString('es-ES')}`, 14, 30);
    
    doc.setTextColor(0, 0, 0);
    let yPos = 50;
    
    // Key Metrics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Métricas Clave', 14, yPos);
    yPos += 10;
    
    summary.highlights.forEach((h, i) => {
      const xPos = 14 + (i % 3) * 62;
      const boxY = yPos + Math.floor(i / 3) * 20;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(h.name, xPos, boxY);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(h.value, xPos, boxY + 7);
      
      const changeText = `${h.change >= 0 ? '+' : ''}${h.change}%`;
      doc.setFontSize(9);
      doc.setTextColor(h.status === 'positive' ? 16 : 239, h.status === 'positive' ? 185 : 68, h.status === 'positive' ? 129 : 68);
      doc.text(changeText, xPos + 30, boxY + 7);
      doc.setTextColor(0, 0, 0);
    });
    
    yPos += 50;
    
    // Narrative (simplified)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Narrativo', 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(summary.narrative.replace(/\*\*/g, '').substring(0, 800), pageWidth - 28);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 5 + 10;
    
    // Risks
    if (yPos < 240) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('Riesgos Identificados', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      summary.risks.slice(0, 3).forEach(r => {
        doc.text(`• ${r}`, 16, yPos);
        yPos += 6;
      });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado por CS Metrics Hub con IA', 14, 285);
    
    doc.save(`cs-executive-summary-${summary.period}.pdf`);
    toast.success('PDF exportado');
  }, [summary]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Executive Summary Generator</CardTitle>
              <p className="text-sm text-muted-foreground">
                Genera resúmenes ejecutivos con IA para stakeholders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="q4-2025">Q4 2025</SelectItem>
                <SelectItem value="q3-2025">Q3 2025</SelectItem>
                <SelectItem value="q2-2025">Q2 2025</SelectItem>
                <SelectItem value="ytd-2025">YTD 2025</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateSummary} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {summary.highlights.map((metric) => (
            <div
              key={metric.name}
              className={cn(
                "p-3 rounded-lg border",
                metric.status === 'positive' && "bg-emerald-500/10 border-emerald-500/30",
                metric.status === 'negative' && "bg-red-500/10 border-red-500/30",
                metric.status === 'neutral' && "bg-muted/50"
              )}
            >
              <p className="text-xs text-muted-foreground mb-1">{metric.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold">{metric.value}</span>
                <span className={cn(
                  "text-xs font-medium flex items-center",
                  metric.status === 'positive' && "text-emerald-500",
                  metric.status === 'negative' && "text-red-500"
                )}>
                  {metric.trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                  {metric.trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                  {metric.change >= 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Narrative */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Resumen Narrativo
            </h4>
            <ScrollArea className="h-[400px] rounded-lg border p-4 bg-muted/30">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {summary.narrative.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 text-sm leading-relaxed">
                    {paragraph.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                  </p>
                ))}
              </div>
            </ScrollArea>

            {/* Custom Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Notas adicionales para el reporte</label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Añade contexto adicional o comentarios para el ejecutivo..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Risks */}
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                Riesgos
              </h4>
              <ul className="space-y-2 text-sm">
                {summary.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Target className="h-4 w-4" />
                Oportunidades
              </h4>
              <ul className="space-y-2 text-sm">
                {summary.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Recomendaciones
              </h4>
              <ul className="space-y-2 text-sm">
                {summary.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <Separator className="my-6" />
        <div className="flex flex-wrap gap-3 justify-end">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button onClick={generateSummary} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Regenerar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ExecutiveSummaryGenerator;
