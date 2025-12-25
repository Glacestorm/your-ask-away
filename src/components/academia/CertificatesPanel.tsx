/**
 * CertificatesPanel - Panel de certificados con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Award,
  Download,
  Share2,
  CheckCircle,
  XCircle,
  Search,
  ExternalLink,
  Linkedin,
  Twitter,
  Mail,
  RefreshCw,
  Sparkles,
  Clock,
  BookOpen
} from 'lucide-react';
import { useAcademiaCertificatesAI, CertificateData, CertificateVerification } from '@/hooks/academia/useAcademiaCertificatesAI';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CertificatesPanelProps {
  className?: string;
}

export function CertificatesPanel({ className }: CertificatesPanelProps) {
  const [activeTab, setActiveTab] = useState('my-certificates');
  const [verifyCode, setVerifyCode] = useState('');
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const {
    isLoading,
    certificates,
    fetchCertificates,
    verifyCertificate,
    shareCertificate,
    downloadPdf
  } = useAcademiaCertificatesAI();

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setIsVerifying(true);
    const result = await verifyCertificate(verifyCode.trim());
    setVerification(result);
    setIsVerifying(false);
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Certificados</CardTitle>
              <p className="text-xs text-muted-foreground">
                {certificates.length} certificados obtenidos
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCertificates()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="my-certificates" className="text-xs">
              Mis Certificados
            </TabsTrigger>
            <TabsTrigger value="verify" className="text-xs">
              Verificar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-certificates" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {certificates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No tienes certificados aún</p>
                    <p className="text-xs">Completa cursos para obtenerlos</p>
                  </div>
                ) : (
                  certificates.map((cert) => (
                    <CertificateCard
                      key={cert.id}
                      certificate={cert}
                      onShare={(platform) => shareCertificate(cert.id, platform)}
                      onDownload={() => downloadPdf(cert.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="verify" className="mt-0">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa el código del certificado..."
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={isVerifying}>
                  <Search className="h-4 w-4 mr-1" />
                  Verificar
                </Button>
              </div>

              {verification && (
                <Card className={cn(
                  "border-2",
                  verification.valid 
                    ? "border-green-500/30 bg-green-500/5" 
                    : "border-red-500/30 bg-red-500/5"
                )}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      {verification.valid ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-700">Certificado Válido</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="font-medium text-red-700">Certificado No Válido</span>
                        </>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {verification.message}
                    </p>

                    {verification.valid && verification.certificate && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Curso:</span>
                          <span className="font-medium">{verification.certificate.courseName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estudiante:</span>
                          <span className="font-medium">{verification.certificate.userName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha:</span>
                          <span className="font-medium">
                            {format(new Date(verification.certificate.issuedAt), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horas:</span>
                          <span className="font-medium">{verification.certificate.hoursCompleted}h</span>
                        </div>
                        {verification.certificate.skills.length > 0 && (
                          <div className="pt-2">
                            <span className="text-muted-foreground block mb-1">Habilidades:</span>
                            <div className="flex flex-wrap gap-1">
                              {verification.certificate.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-3">
                      Verificado: {format(new Date(verification.verifiedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="text-center text-xs text-muted-foreground pt-4">
                <p>Los certificados tienen un código único que puede ser verificado</p>
                <p>para comprobar su autenticidad.</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// === Certificate Card Component ===
function CertificateCard({
  certificate,
  onShare,
  onDownload
}: {
  certificate: CertificateData;
  onShare: (platform: 'linkedin' | 'twitter' | 'email') => void;
  onDownload: () => void;
}) {
  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-white">
            <Award className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{certificate.courseName}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{certificate.hoursCompleted}h completadas</span>
              {certificate.grade && (
                <>
                  <span>•</span>
                  <Sparkles className="h-3 w-3" />
                  <span>{certificate.grade}</span>
                </>
              )}
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {certificate.skills.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {certificate.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{certificate.skills.length - 3}
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(certificate.issuedAt), { locale: es, addSuffix: true })}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShare('linkedin')}
                  className="h-7 w-7"
                  title="Compartir en LinkedIn"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShare('twitter')}
                  className="h-7 w-7"
                  title="Compartir en Twitter"
                >
                  <Twitter className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onShare('email')}
                  className="h-7 w-7"
                  title="Compartir por email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                {certificate.pdfUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDownload}
                    className="h-7 w-7"
                    title="Descargar PDF"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Ver certificado"
                  asChild
                >
                  <a href={certificate.verificationUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CertificatesPanel;
