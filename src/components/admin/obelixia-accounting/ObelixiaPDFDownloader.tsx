/**
 * ObelixIA PDF Downloader Component
 * Permite descargar PDFs pre-generados de Plan de Negocio y Estudio de Viabilidad
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  downloadObelixiaBusinessPlanPDF, 
  downloadObelixiaViabilityStudyPDF,
  downloadAllObelixiaPDFs 
} from '@/lib/obelixiaPDFGenerator';

export function ObelixiaPDFDownloader() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadBusinessPlan = async () => {
    setDownloading('business');
    try {
      downloadObelixiaBusinessPlanPDF();
      toast.success('Plan de Negocio descargado correctamente');
    } catch (error) {
      console.error('Error downloading business plan:', error);
      toast.error('Error al descargar el Plan de Negocio');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handleDownloadViabilityStudy = async () => {
    setDownloading('viability');
    try {
      downloadObelixiaViabilityStudyPDF();
      toast.success('Estudio de Viabilidad descargado correctamente');
    } catch (error) {
      console.error('Error downloading viability study:', error);
      toast.error('Error al descargar el Estudio de Viabilidad');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading('all');
    try {
      downloadAllObelixiaPDFs();
      toast.success('Ambos documentos descargados correctamente');
    } catch (error) {
      console.error('Error downloading PDFs:', error);
      toast.error('Error al descargar los documentos');
    } finally {
      setTimeout(() => setDownloading(null), 1500);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentos ObelixIA</h2>
          <p className="text-muted-foreground">
            Plan de Negocio y Estudio de Viabilidad generados automáticamente
          </p>
        </div>
        <Button 
          onClick={handleDownloadAll}
          disabled={downloading !== null}
          className="gap-2"
        >
          {downloading === 'all' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar Ambos
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan de Negocio */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary">PDF</Badge>
            </div>
            <CardTitle className="mt-4">Plan de Negocio</CardTitle>
            <CardDescription>
              Documento completo con estrategia, análisis de mercado, modelo de negocio y proyecciones financieras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Resumen ejecutivo completo</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis de mercado y competencia</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Modelo de negocio SaaS</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Plan financiero y marketing</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis de riesgos</span>
              </div>
            </div>
            
            <Button 
              onClick={handleDownloadBusinessPlan}
              disabled={downloading !== null}
              className="w-full gap-2"
              variant="outline"
            >
              {downloading === 'business' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar Plan de Negocio
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
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                Viabilidad: 82%
              </Badge>
            </div>
            <CardTitle className="mt-4">Estudio de Viabilidad</CardTitle>
            <CardDescription>
              Análisis exhaustivo de viabilidad técnica, financiera y comercial con métricas y proyecciones
            </CardDescription>
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
                <span>Métricas financieras detalladas</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Análisis de riesgos con mitigación</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span>Recomendaciones estratégicas</span>
              </div>
            </div>
            
            <Button 
              onClick={handleDownloadViabilityStudy}
              disabled={downloading !== null}
              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {downloading === 'viability' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar Estudio de Viabilidad
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Info adicional */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Documentos generados automáticamente</p>
              <p className="text-sm text-muted-foreground">
                Estos PDFs contienen información completa extraída del análisis del sistema ObelixIA, 
                incluyendo arquitectura técnica, modelo de negocio, proyecciones financieras y análisis estratégico.
                Los documentos se generan localmente en tu navegador.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ObelixiaPDFDownloader;
