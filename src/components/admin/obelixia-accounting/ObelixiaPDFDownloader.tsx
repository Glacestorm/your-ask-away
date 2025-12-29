/**
 * ObelixIA PDF Downloader Component
 * Permite descargar PDFs pre-generados de Plan de Negocio, Estudio de Viabilidad y NDA
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  BarChart3, 
  Target,
  Loader2,
  Shield,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  downloadObelixiaBusinessPlanPDF, 
  downloadObelixiaViabilityStudyPDF,
  downloadObelixiaNDAPDF,
  downloadAllObelixiaPDFs 
} from '@/lib/obelixiaPDFGenerator';

export function ObelixiaPDFDownloader() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'business' | 'viability' | 'nda' | 'all') => {
    setDownloading(type);
    try {
      switch (type) {
        case 'business':
          downloadObelixiaBusinessPlanPDF();
          toast.success('Plan de Negocio descargado');
          break;
        case 'viability':
          downloadObelixiaViabilityStudyPDF();
          toast.success('Estudio de Viabilidad descargado');
          break;
        case 'nda':
          downloadObelixiaNDAPDF();
          toast.success('Contrato de Confidencialidad descargado');
          break;
        case 'all':
          downloadAllObelixiaPDFs();
          toast.success('Todos los documentos descargados');
          break;
      }
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Error al descargar');
    } finally {
      setTimeout(() => setDownloading(null), type === 'all' ? 1500 : 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos ObelixIA</h2>
          <p className="text-muted-foreground">
            Plan de Negocio, Estudio de Viabilidad y Contrato de Confidencialidad
          </p>
        </div>
        <Button onClick={() => handleDownload('all')} disabled={downloading !== null} className="gap-2">
          {downloading === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar Todos
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Plan de Negocio */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary">+25 páginas</Badge>
            </div>
            <CardTitle className="mt-4">Plan de Negocio</CardTitle>
            <CardDescription>Documento completo con estrategia, análisis y proyecciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Resumen ejecutivo extenso</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis de mercado y competencia</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Modelo de negocio detallado</span>
              </div>
            </div>
            <Button onClick={() => handleDownload('business')} disabled={downloading !== null} className="w-full gap-2" variant="outline">
              {downloading === 'business' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </CardContent>
        </Card>

        {/* Estudio de Viabilidad */}
        <Card className="relative overflow-hidden border-2 hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600">Viabilidad: 82%</Badge>
            </div>
            <CardTitle className="mt-4">Estudio de Viabilidad</CardTitle>
            <CardDescription>Análisis financiero exhaustivo con métricas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-4 w-4 text-emerald-500" />
                <span>VAN: €1.85M | TIR: 42.5%</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis DAFO completo</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis de riesgos detallado</span>
              </div>
            </div>
            <Button onClick={() => handleDownload('viability')} disabled={downloading !== null} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
              {downloading === 'viability' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </CardContent>
        </Card>

        {/* Contrato de Confidencialidad */}
        <Card className="relative overflow-hidden border-2 hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <Badge className="bg-amber-500/10 text-amber-600">Legal</Badge>
            </div>
            <CardTitle className="mt-4">Contrato NDA</CardTitle>
            <CardDescription>Acuerdo de confidencialidad completo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4 text-amber-500" />
                <span>13 cláusulas legales</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                <span>No competencia y no captación</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-amber-500" />
                <span>Protección de datos RGPD</span>
              </div>
            </div>
            <Button onClick={() => handleDownload('nda')} disabled={downloading !== null} className="w-full gap-2 bg-amber-600 hover:bg-amber-700">
              {downloading === 'nda' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Descargar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Documentos generados con análisis del código</p>
              <p className="text-sm text-muted-foreground">
                Los PDFs contienen información extraída del análisis exhaustivo del sistema ObelixIA.
                El contrato NDA incluye 13 cláusulas legales completas con protección de datos RGPD.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ObelixiaPDFDownloader;
