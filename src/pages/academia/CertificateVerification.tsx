/**
 * CertificateVerification - Página pública de verificación de certificados
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Award,
  Calendar,
  User,
  BookOpen,
  Shield,
  ExternalLink,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTrainingCertificates } from '@/hooks/useTrainingCertificates';
import { cn } from '@/lib/utils';

interface VerificationResult {
  isValid: boolean;
  certificate?: {
    id: string;
    certificate_number: string;
    verification_code: string;
    issued_at: string;
    expires_at: string | null;
    score: number | null;
    skills_acquired: string[] | null;
    training_courses?: {
      title: { es: string; en: string } | string;
      description?: { es: string; en: string } | string;
    };
    profiles?: {
      full_name: string;
    };
  };
  message?: string;
}

const CertificateVerification: React.FC = () => {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const codeFromQuery = searchParams.get('code');
  const verificationCode = code || codeFromQuery || '';

  const [inputCode, setInputCode] = useState(verificationCode);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { verifyCertificate } = useTrainingCertificates();

  const handleVerify = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    
    try {
      const verificationResult = await verifyCertificate(codeToVerify.trim());
      // Transform to our interface with safe type casting
      const cert = verificationResult.certificate as any;
      setResult({
        isValid: verificationResult.valid,
        message: verificationResult.message,
        certificate: cert ? {
          id: cert.id || '',
          certificate_number: cert.certificate_number,
          verification_code: cert.verification_code,
          issued_at: cert.issued_at,
          expires_at: cert.expires_at,
          score: cert.score,
          skills_acquired: cert.skills_acquired,
          training_courses: cert.training_courses,
          profiles: cert.profiles,
        } : undefined,
      });
    } catch (error) {
      setResult({
        isValid: false,
        message: 'Error al verificar el certificado',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify if code is provided
  useEffect(() => {
    if (verificationCode) {
      setInputCode(verificationCode);
      handleVerify(verificationCode);
    }
  }, [verificationCode]);

  const getCourseTitle = (trainingCourses: VerificationResult['certificate']): string => {
    if (!trainingCourses?.training_courses?.title) return 'Curso';
    const title = trainingCourses.training_courses.title;
    if (typeof title === 'string') return title;
    return title.es || title.en || 'Curso';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link to="/academia" className="flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              <span className="font-semibold text-white">Academia ObelixIA</span>
            </Link>
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              <Shield className="w-3 h-3 mr-1" />
              Verificación de Certificados
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Verificación de Certificados
          </h1>
          <p className="text-slate-400">
            Introduce el código de verificación para comprobar la autenticidad del certificado
          </p>
        </motion.div>

        {/* Search Form */}
        <Card className="bg-slate-900/50 border-slate-800 mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Código de verificación (ej: CERT-XXXXX)"
                className="flex-1 bg-slate-800 border-slate-700 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify(inputCode)}
              />
              <Button 
                onClick={() => handleVerify(inputCode)}
                disabled={loading || !inputCode.trim()}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Verificar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && !loading && result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {result.isValid && result.certificate ? (
              <Card className="bg-gradient-to-br from-green-900/20 to-slate-900 border-green-500/30 overflow-hidden">
                {/* Success Header */}
                <div className="bg-green-500/10 p-6 text-center border-b border-green-500/20">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4"
                  >
                    <CheckCircle className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-green-400 mb-1">
                    Certificado Válido
                  </h2>
                  <p className="text-green-300/70">
                    Este certificado ha sido verificado correctamente
                  </p>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Certificate Details */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50">
                      <User className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Otorgado a</p>
                        <p className="font-medium text-white">
                          {result.certificate.profiles?.full_name || 'Estudiante'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50">
                      <BookOpen className="w-5 h-5 text-slate-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Curso completado</p>
                        <p className="font-medium text-white">
                          {getCourseTitle(result.certificate)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
                        <Calendar className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-400">Fecha de emisión</p>
                          <p className="font-medium text-white">
                            {new Date(result.certificate.issued_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>

                      {result.certificate.score && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50">
                          <Award className="w-5 h-5 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-slate-400">Calificación</p>
                            <p className="font-medium text-white">
                              {result.certificate.score}%
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {result.certificate.skills_acquired && result.certificate.skills_acquired.length > 0 && (
                      <div className="p-4 rounded-lg bg-slate-800/50">
                        <p className="text-sm text-slate-400 mb-2">Competencias adquiridas</p>
                        <div className="flex flex-wrap gap-2">
                          {result.certificate.skills_acquired.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-300">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Certificate ID */}
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Número de certificado:</span>
                      <code className="text-primary font-mono">
                        {result.certificate.certificate_number}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/30">
                <CardContent className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4"
                  >
                    <XCircle className="w-10 h-10 text-red-400" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-red-400 mb-2">
                    Certificado No Encontrado
                  </h2>
                  <p className="text-slate-400 mb-4">
                    {result.message || 'El código de verificación no corresponde a ningún certificado válido'}
                  </p>
                  <div className="p-4 rounded-lg bg-slate-800/50 text-left">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="text-sm text-slate-400">
                        <p className="font-medium text-slate-300 mb-1">Posibles causas:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>El código de verificación es incorrecto</li>
                          <li>El certificado ha expirado</li>
                          <li>El certificado ha sido revocado</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Help Section */}
        {!hasSearched && (
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="p-6">
              <h3 className="font-medium text-white mb-3">¿Cómo verificar un certificado?</h3>
              <ol className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Localiza el código de verificación en el certificado PDF
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Introduce el código en el campo de búsqueda
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Haz clic en "Verificar" para comprobar la autenticidad
                </li>
              </ol>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Academia ObelixIA. 
            Sistema de verificación de certificados digitales.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CertificateVerification;
