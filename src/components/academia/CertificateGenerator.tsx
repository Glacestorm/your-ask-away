/**
 * CertificateGenerator - Genera certificados PDF con QR de verificación
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  Award,
  Download,
  Share2,
  Linkedin,
  QrCode,
  CheckCircle,
  Calendar,
  User,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useCelebration } from '@/hooks/useCelebration';
import { cn } from '@/lib/utils';

interface CertificateData {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  studentName: string;
  courseName: string;
  courseDescription?: string;
  completionDate: string;
  issuedAt: string;
  score?: number;
  grade?: string;
  skills?: string[];
  instructorName?: string;
  organizationName?: string;
}

interface CertificateGeneratorProps {
  certificate: CertificateData;
  onShare?: (platform: string) => void;
  className?: string;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  certificate,
  onShare,
  className,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { fireCelebration } = useCelebration();

  const verificationUrl = `${window.location.origin}/academia/verificar/${certificate.verificationCode}`;

  // Generate PDF Certificate
  const generatePDF = useCallback(async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Background gradient effect (simulated with rectangles)
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Decorative border
      doc.setDrawColor(59, 130, 246); // blue-500
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      // Inner border
      doc.setDrawColor(147, 197, 253); // blue-300
      doc.setLineWidth(0.5);
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

      // Corner decorations
      const cornerSize = 15;
      doc.setFillColor(59, 130, 246);
      [[20, 20], [pageWidth - 20 - cornerSize, 20], [20, pageHeight - 20 - cornerSize], [pageWidth - 20 - cornerSize, pageHeight - 20 - cornerSize]].forEach(([x, y]) => {
        doc.triangle(x, y, x + cornerSize, y, x, y + cornerSize, 'F');
      });

      // Header - Organization
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(12);
      doc.text(certificate.organizationName || 'Academia de Formación', pageWidth / 2, 35, { align: 'center' });

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(36);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICADO', pageWidth / 2, 55, { align: 'center' });

      // Subtitle
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('DE FINALIZACIÓN', pageWidth / 2, 65, { align: 'center' });

      // Award icon placeholder (decorative line)
      doc.setDrawColor(250, 204, 21); // yellow-400
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 30, 75, pageWidth / 2 + 30, 75);

      // This certifies text
      doc.setTextColor(203, 213, 225); // slate-300
      doc.setFontSize(11);
      doc.text('Este certificado se otorga a', pageWidth / 2, 90, { align: 'center' });

      // Student name
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(certificate.studentName, pageWidth / 2, 105, { align: 'center' });

      // Underline for name
      const nameWidth = doc.getTextWidth(certificate.studentName);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - nameWidth / 2, 108, pageWidth / 2 + nameWidth / 2, 108);

      // Course completion text
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('por completar exitosamente el curso', pageWidth / 2, 120, { align: 'center' });

      // Course name
      doc.setTextColor(96, 165, 250); // blue-400
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(certificate.courseName, pageWidth / 2, 135, { align: 'center' });

      // Score and grade (if available)
      if (certificate.score || certificate.grade) {
        doc.setTextColor(34, 197, 94); // green-500
        doc.setFontSize(12);
        const scoreText = certificate.score 
          ? `Calificación: ${certificate.score}% - ${certificate.grade || 'Aprobado'}`
          : `Calificación: ${certificate.grade}`;
        doc.text(scoreText, pageWidth / 2, 148, { align: 'center' });
      }

      // Skills (if available)
      if (certificate.skills && certificate.skills.length > 0) {
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        const skillsText = `Competencias: ${certificate.skills.slice(0, 4).join(' • ')}`;
        doc.text(skillsText, pageWidth / 2, 158, { align: 'center' });
      }

      // Date and certificate info
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.text(`Fecha de emisión: ${new Date(certificate.issuedAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`, 40, pageHeight - 40);

      // Certificate number
      doc.text(`Número: ${certificate.certificateNumber}`, 40, pageHeight - 33);

      // Verification code
      doc.setTextColor(59, 130, 246);
      doc.text(`Código de verificación: ${certificate.verificationCode}`, 40, pageHeight - 26);

      // QR Code placeholder (text for now)
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text('Escanea para verificar', pageWidth - 50, pageHeight - 40, { align: 'center' });
      
      // QR box placeholder
      doc.setDrawColor(100, 116, 139);
      doc.setLineWidth(0.3);
      doc.rect(pageWidth - 65, pageHeight - 55, 30, 30);
      doc.setFontSize(6);
      doc.text('QR', pageWidth - 50, pageHeight - 38, { align: 'center' });

      // Signature line
      doc.setDrawColor(100, 116, 139);
      doc.line(pageWidth - 100, pageHeight - 35, pageWidth - 40, pageHeight - 35);
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text(certificate.instructorName || 'Director Académico', pageWidth - 70, pageHeight - 30, { align: 'center' });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Verificar en: ${verificationUrl}`, pageWidth / 2, pageHeight - 18, { align: 'center' });

      // Download
      doc.save(`Certificado_${certificate.certificateNumber}.pdf`);
      
      toast.success('Certificado descargado');
      fireCelebration();
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar certificado');
    } finally {
      setIsGenerating(false);
    }
  }, [certificate, verificationUrl, fireCelebration]);

  // Share on LinkedIn
  const shareOnLinkedIn = useCallback(() => {
    const issueDate = new Date(certificate.issuedAt);
    const params = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: certificate.courseName,
      organizationName: certificate.organizationName || 'Academia',
      issueYear: String(issueDate.getFullYear()),
      issueMonth: String(issueDate.getMonth() + 1),
      certUrl: verificationUrl,
      certId: certificate.certificateNumber,
    });

    window.open(`https://www.linkedin.com/profile/add?${params.toString()}`, '_blank');
    onShare?.('linkedin');
  }, [certificate, verificationUrl, onShare]);

  // Copy verification URL
  const copyVerificationUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      toast.success('Enlace copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar');
    }
  }, [verificationUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("", className)}
    >
      <Card className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700">
        {/* Certificate Preview */}
        <div className="relative p-6 bg-gradient-to-br from-blue-950/50 to-slate-900 border-b border-slate-700">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-blue-500/30 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-blue-500/30 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-blue-500/30 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-blue-500/30 rounded-br-lg" />

          <div className="text-center space-y-4 py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/25">
              <Award className="w-8 h-8 text-white" />
            </div>

            <div>
              <p className="text-sm text-slate-400 uppercase tracking-wider">Certificado de Finalización</p>
              <h2 className="text-2xl font-bold text-white mt-1">{certificate.courseName}</h2>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-300">
              <User className="w-4 h-4" />
              <span className="font-medium">{certificate.studentName}</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(certificate.issuedAt).toLocaleDateString('es-ES')}</span>
              </div>
              {certificate.score && (
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {certificate.score}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Skills */}
          {certificate.skills && certificate.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Competencias Adquiridas
              </h4>
              <div className="flex flex-wrap gap-2">
                {certificate.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-slate-800 text-slate-300">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Verification Info */}
          <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-start gap-3">
              <QrCode className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-300">Verificación del Certificado</p>
                <p className="text-xs text-slate-500 mt-1">Código: {certificate.verificationCode}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={verificationUrl}
                    readOnly
                    className="text-xs bg-slate-900 border-slate-700 text-slate-400"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyVerificationUrl}
                    className="shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generando...' : 'Descargar PDF'}
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Compartir Certificado</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    onClick={shareOnLinkedIn}
                    className="w-full gap-2 bg-[#0A66C2] hover:bg-[#004182]"
                  >
                    <Linkedin className="w-5 h-5" />
                    Añadir a LinkedIn
                  </Button>

                  <Button
                    variant="outline"
                    onClick={copyVerificationUrl}
                    className="w-full gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Copiar enlace de verificación
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => window.open(verificationUrl, '_blank')}
                    className="w-full gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver página de verificación
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CertificateGenerator;
