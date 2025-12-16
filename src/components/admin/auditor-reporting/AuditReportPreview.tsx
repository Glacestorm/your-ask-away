import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Send, Download, Eye, Mail, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AuditReportPreviewProps {
  report: any;
  onRefresh: () => void;
}

export function AuditReportPreview({ report, onRefresh }: AuditReportPreviewProps) {
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [auditorEmails, setAuditorEmails] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sectorNames: Record<string, string> = {
    banking: 'Banca',
    health: 'Salud',
    industry: 'Industria',
    retail: 'Retail',
    technology: 'Tecnología',
  };

  const reportTypeNames: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    quarterly: 'Trimestral',
    annual: 'Anual',
  };

  const findings = report.findings_summary || {};

  const handleSendReport = async () => {
    if (!auditorEmails.trim()) {
      toast.error('Introduce al menos un email');
      return;
    }

    const emails = auditorEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (emails.some(e => !e.includes('@'))) {
      toast.error('Algunos emails no son válidos');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-audit-report', {
        body: {
          reportId: report.id,
          auditorEmails: emails,
          message: emailMessage,
        },
      });

      if (error) throw error;

      toast.success(`Informe enviado a ${data.emails_sent} auditores`);
      setShowSendDialog(false);
      onRefresh();
    } catch (error: any) {
      console.error('Error sending report:', error);
      toast.error('Error al enviar', { description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(30, 58, 95);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Informe de Auditoría', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${reportTypeNames[report.report_type]} - Sector ${sectorNames[report.sector_key]}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Período: ${format(new Date(report.report_period_start), 'dd/MM/yyyy')} - ${format(new Date(report.report_period_end), 'dd/MM/yyyy')}`, pageWidth / 2, 38, { align: 'center' });

    y = 55;
    doc.setTextColor(0, 0, 0);

    // Compliance Score
    doc.setFontSize(14);
    doc.text('Puntuación de Cumplimiento', 20, y);
    y += 10;
    
    const score = report.compliance_score || 0;
    const scoreColor = score >= 80 ? [16, 185, 129] : score >= 60 ? [245, 158, 11] : [239, 68, 68];
    doc.setFillColor(...scoreColor as [number, number, number]);
    doc.roundedRect(20, y, 40, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`${score}/100`, 40, y + 10, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    y += 30;

    // Summary Table
    doc.setFontSize(14);
    doc.text('Resumen de Hallazgos', 20, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [['Métrica', 'Valor']],
      body: [
        ['Preguntas Totales', String(findings.total_questions || 0)],
        ['Preguntas Respondidas', String(findings.answered_questions || 0)],
        ['Preguntas Pendientes', String(findings.pending_questions || 0)],
        ['Críticas Pendientes', String(findings.critical_pending || 0)],
        ['Incidentes del Período', String(findings.incidents_count || 0)],
        ['Incidentes Resueltos', String(findings.incidents_resolved || 0)],
        ['Backups Verificados', String(findings.backups_verified || 0)],
        ['Backups Exitosos', String(findings.backups_successful || 0)],
        ['Stress Tests Pasados', `${findings.stress_tests_passed || 0}/${findings.stress_tests_total || 0}`],
        ['Eventos de Auditoría', String(findings.audit_events_count || 0)],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 95] },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Sections
    if (report.sections_data && report.sections_data.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(14);
      doc.text('Secciones del Informe', 20, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Sección', 'Preguntas', 'Respondidas', '% Cumplimiento']],
        body: report.sections_data.map((section: any) => [
          section.title,
          String(section.questions_count || 0),
          String(section.answered_count || 0),
          `${section.compliance_percentage || 0}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 95] },
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Generado por ObelixIA - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    doc.save(`informe_auditoria_${report.sector_key}_${report.report_period_end}.pdf`);
    toast.success('PDF descargado');
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
              report.compliance_score >= 80
                ? 'bg-green-500'
                : report.compliance_score >= 60
                ? 'bg-amber-500'
                : 'bg-red-500'
            }`}
          >
            {report.compliance_score || 0}
          </div>
        </div>
        <div>
          <h4 className="font-medium">
            Informe {reportTypeNames[report.report_type]} - {sectorNames[report.sector_key]}
          </h4>
          <p className="text-sm text-muted-foreground">
            {format(new Date(report.report_period_start), 'dd MMM', { locale: es })} - {' '}
            {format(new Date(report.report_period_end), 'dd MMM yyyy', { locale: es })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right text-sm">
          <p className="text-muted-foreground">
            {findings.answered_questions || 0}/{findings.total_questions || 0} preguntas
          </p>
          {report.sent_to_auditors ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span>Enviado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Pendiente envío</span>
            </div>
          )}
        </div>

        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa del Informe</DialogTitle>
              <DialogDescription>
                Informe {reportTypeNames[report.report_type]} para sector {sectorNames[report.sector_key]}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Score */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Puntuación de Cumplimiento</p>
                <div
                  className={`inline-block px-6 py-2 rounded-full text-white font-bold text-xl ${
                    report.compliance_score >= 80
                      ? 'bg-green-500'
                      : report.compliance_score >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                >
                  {report.compliance_score || 0}/100
                </div>
              </div>

              {/* Progress bars for key metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Preguntas Respondidas</span>
                    <span>{findings.answered_questions || 0}/{findings.total_questions || 0}</span>
                  </div>
                  <Progress 
                    value={findings.total_questions ? (findings.answered_questions / findings.total_questions) * 100 : 0} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Incidentes Resueltos</span>
                    <span>{findings.incidents_resolved || 0}/{findings.incidents_count || 0}</span>
                  </div>
                  <Progress 
                    value={findings.incidents_count ? (findings.incidents_resolved / findings.incidents_count) * 100 : 100} 
                  />
                </div>
              </div>

              {/* Findings */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Resumen de Hallazgos</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Preguntas Críticas Pendientes</span>
                    <Badge variant={findings.critical_pending > 0 ? 'destructive' : 'default'}>
                      {findings.critical_pending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Backups Verificados</span>
                    <Badge variant="outline">
                      {findings.backups_successful || 0}/{findings.backups_verified || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Stress Tests Pasados</span>
                    <Badge variant="outline">
                      {findings.stress_tests_passed || 0}/{findings.stress_tests_total || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Eventos de Auditoría</span>
                    <Badge variant="secondary">{findings.audit_events_count || 0}</Badge>
                  </div>
                </div>
              </div>

              {/* Sections */}
              {report.sections_data && report.sections_data.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Secciones del Informe</h4>
                  <div className="space-y-3">
                    {report.sections_data.map((section: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{section.title}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={section.compliance_percentage || 0} className="w-24" />
                          <span className="text-xs text-muted-foreground w-10">
                            {section.compliance_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="outline" onClick={generatePDF}>
          <Download className="h-4 w-4" />
        </Button>

        <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant={report.sent_to_auditors ? 'secondary' : 'default'}>
              <Send className="h-4 w-4 mr-1" />
              {report.sent_to_auditors ? 'Reenviar' : 'Enviar'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Informe a Auditores</DialogTitle>
              <DialogDescription>
                Envía el informe por email a los auditores externos
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Emails de Auditores</Label>
                <Input
                  placeholder="auditor1@ejemplo.com, auditor2@ejemplo.com"
                  value={auditorEmails}
                  onChange={(e) => setAuditorEmails(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Separa múltiples emails con comas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Mensaje Adicional (opcional)</Label>
                <Textarea
                  placeholder="Mensaje para los auditores..."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleSendReport}
                disabled={isSending}
              >
                {isSending ? (
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Enviar Informe
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
