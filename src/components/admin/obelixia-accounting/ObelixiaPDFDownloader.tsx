/**
 * ObelixIA PDF Downloader Component
 * Permite descargar PDFs y exportar Excel de Plan de Negocio, Estudio de Viabilidad y NDA
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
  Lock,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  downloadObelixiaBusinessPlanPDF, 
  downloadObelixiaViabilityStudyPDF,
  downloadObelixiaNDAPDF,
  downloadAllObelixiaPDFs 
} from '@/lib/obelixiaPDFGenerator';
import {
  exportBusinessPlanToExcel,
  exportViabilityStudyToExcel,
  exportAllFinancialsToExcel
} from '@/lib/obelixiaExcelExport';

export function ObelixiaPDFDownloader() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'business' | 'viability' | 'nda' | 'all' | 'excel-business' | 'excel-viability' | 'excel-all') => {
    setDownloading(type);
    try {
      switch (type) {
        case 'business':
          downloadObelixiaBusinessPlanPDF();
          toast.success('Plan de Negocio PDF descargado');
          break;
        case 'viability':
          downloadObelixiaViabilityStudyPDF();
          toast.success('Estudio de Viabilidad PDF descargado');
          break;
        case 'nda':
          downloadObelixiaNDAPDF();
          toast.success('Contrato NDA descargado');
          break;
        case 'all':
          downloadAllObelixiaPDFs();
          toast.success('Todos los PDFs descargados');
          break;
        case 'excel-business':
          exportBusinessPlanToExcel();
          toast.success('Cifras Plan de Negocio exportadas a Excel');
          break;
        case 'excel-viability':
          exportViabilityStudyToExcel();
          toast.success('Cifras Estudio Viabilidad exportadas a Excel');
          break;
        case 'excel-all':
          exportAllFinancialsToExcel();
          toast.success('Datos financieros completos exportados a Excel');
          break;
      }
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error('Error al descargar');
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Documentos ObelixIA</h2>
          <p className="text-muted-foreground">
            Plan de Negocio, Estudio de Viabilidad, NDA y exportación Excel
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleDownload('excel-all')} disabled={downloading !== null} variant="outline" className="gap-2">
            {downloading === 'excel-all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel Completo
          </Button>
          <Button onClick={() => handleDownload('all')} disabled={downloading !== null} className="gap-2">
            {downloading === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Todos los PDFs
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Plan de Negocio */}
        <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <Badge variant="secondary">+25 pag</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Plan de Negocio</CardTitle>
            <CardDescription className="text-xs">Estrategia y proyecciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Resumen ejecutivo</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Analisis mercado</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleDownload('business')} disabled={downloading !== null} className="flex-1 gap-1.5 text-xs h-8" variant="outline" size="sm">
                {downloading === 'business' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                PDF
              </Button>
              <Button onClick={() => handleDownload('excel-business')} disabled={downloading !== null} className="flex-1 gap-1.5 text-xs h-8" variant="secondary" size="sm">
                {downloading === 'excel-business' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estudio de Viabilidad */}
        <Card className="relative overflow-hidden border-2 hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-emerald-500/10">
                <BarChart3 className="h-6 w-6 text-emerald-500" />
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">82%</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Estudio Viabilidad</CardTitle>
            <CardDescription className="text-xs">Analisis financiero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Target className="h-3.5 w-3.5 text-emerald-500" />
                <span>VAN: 1.85M EUR | TIR: 42.5%</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>DAFO y riesgos</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleDownload('viability')} disabled={downloading !== null} className="flex-1 gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700" size="sm">
                {downloading === 'viability' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                PDF
              </Button>
              <Button onClick={() => handleDownload('excel-viability')} disabled={downloading !== null} className="flex-1 gap-1.5 text-xs h-8" variant="secondary" size="sm">
                {downloading === 'excel-viability' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contrato NDA */}
        <Card className="relative overflow-hidden border-2 hover:border-amber-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 text-xs">Legal</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Contrato NDA</CardTitle>
            <CardDescription className="text-xs">Confidencialidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-3.5 w-3.5 text-amber-500" />
                <span>13 clausulas legales</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-amber-500" />
                <span>RGPD compliant</span>
              </div>
            </div>
            <Button onClick={() => handleDownload('nda')} disabled={downloading !== null} className="w-full gap-1.5 text-xs h-8 bg-amber-600 hover:bg-amber-700" size="sm">
              {downloading === 'nda' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Descargar PDF
            </Button>
          </CardContent>
        </Card>

        {/* Excel Financiero */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent" />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <FileSpreadsheet className="h-6 w-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 text-xs">Cifras</Badge>
            </div>
            <CardTitle className="mt-3 text-base">Datos Financieros</CardTitle>
            <CardDescription className="text-xs">Exportacion completa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                <span>Proyecciones 5 anos</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-blue-500" />
                <span>Metricas y ratios</span>
              </div>
            </div>
            <Button onClick={() => handleDownload('excel-all')} disabled={downloading !== null} className="w-full gap-1.5 text-xs h-8 bg-blue-600 hover:bg-blue-700" size="sm">
              {downloading === 'excel-all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Exportar Excel
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
              <p className="font-medium">Documentos generados con datos del sistema</p>
              <p className="text-sm text-muted-foreground">
                PDFs con margenes corregidos y fuentes compatibles. Excel con cifras financieras exportables.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ObelixiaPDFDownloader;
