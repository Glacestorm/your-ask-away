/**
 * LicenseGenerator - Generador de licencias con firma Ed25519
 * Fase 3 del Sistema de Licencias Enterprise
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Copy, 
  CheckCircle, 
  Loader2,
  Mail,
  Building,
  Users,
  Laptop,
  Calendar,
  Sparkles,
  Download
} from 'lucide-react';
import { useLicenseManager, type LicensePlan, type GenerateLicenseParams } from '@/hooks/admin/enterprise/useLicenseManager';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LicenseGeneratorProps {
  plans: LicensePlan[];
  onGenerated?: () => void;
}

export function LicenseGenerator({ plans, onGenerated }: LicenseGeneratorProps) {
  const [formData, setFormData] = useState<Partial<GenerateLicenseParams>>({
    licenseeEmail: '',
    licenseeName: '',
    planId: '',
    licenseType: 'subscription',
    maxUsers: 5,
    maxDevices: 3,
    validDays: 365,
    features: {}
  });
  
  const [generatedLicense, setGeneratedLicense] = useState<{
    licenseKey: string;
    expiresAt: string;
  } | null>(null);
  
  const [copied, setCopied] = useState(false);
  
  const { generateLicense, isLoading } = useLicenseManager();

  const selectedPlan = plans.find(p => p.id === formData.planId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.licenseeEmail || !formData.planId) {
      toast.error('Email y plan son requeridos');
      return;
    }

    const result = await generateLicense(formData as GenerateLicenseParams);
    
    if (result) {
      setGeneratedLicense({
        licenseKey: result.licenseKey,
        expiresAt: (result as any).expiresAt || (result.license?.expires_at) || ''
      });
      toast.success('Licencia generada exitosamente');
      onGenerated?.();
    }
  };

  const handleCopy = async () => {
    if (generatedLicense?.licenseKey) {
      await navigator.clipboard.writeText(generatedLicense.licenseKey);
      setCopied(true);
      toast.success('Licencia copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!generatedLicense) return;
    
    const content = `
OBELIXIA LICENSE KEY
====================

License Key: ${generatedLicense.licenseKey}
Expires At: ${generatedLicense.expiresAt ? new Date(generatedLicense.expiresAt).toLocaleDateString() : 'Never'}
Generated: ${new Date().toISOString()}

Licensee: ${formData.licenseeName || formData.licenseeEmail}
Email: ${formData.licenseeEmail}
Plan: ${selectedPlan?.name || 'N/A'}

IMPORTANT: Keep this license key secure. Do not share it publicly.

© ${new Date().getFullYear()} Obelixia - Enterprise SaaS Platform
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obelixia-license-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Generar Nueva Licencia
          </CardTitle>
          <CardDescription>
            Crea licencias firmadas con Ed25519 para tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email del Licenciatario *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@empresa.com"
                value={formData.licenseeEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, licenseeEmail: e.target.value }))}
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Nombre/Empresa
              </Label>
              <Input
                id="name"
                placeholder="Empresa S.L."
                value={formData.licenseeName}
                onChange={(e) => setFormData(prev => ({ ...prev, licenseeName: e.target.value }))}
              />
            </div>

            {/* Plan */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Plan de Licencia *
              </Label>
              <Select 
                value={formData.planId} 
                onValueChange={(v) => {
                  const plan = plans.find(p => p.id === v);
                  setFormData(prev => ({ 
                    ...prev, 
                    planId: v,
                    maxUsers: plan?.max_users_default || 5,
                    maxDevices: plan?.max_devices_default || 3,
                    features: plan?.features as Record<string, boolean> || {}
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un plan" />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  side="bottom" 
                  align="start"
                  sideOffset={4}
                  className="max-h-[300px] overflow-y-auto"
                >
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      <span className="inline-flex w-full items-center justify-between gap-2">
                        <span className="truncate">{plan.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          €{plan.price_yearly}/año
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* License Type */}
            <div className="space-y-2">
              <Label>Tipo de Licencia</Label>
              <Select 
                value={formData.licenseType} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, licenseType: v as GenerateLicenseParams['licenseType'] }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  side="bottom" 
                  align="start"
                  sideOffset={4}
                >
                  <SelectItem value="trial">Trial (14 días)</SelectItem>
                  <SelectItem value="subscription">Suscripción</SelectItem>
                  <SelectItem value="perpetual">Perpetua</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUsers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Máx. Usuarios
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  min={1}
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: parseInt(e.target.value) || 5 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDevices" className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  Máx. Dispositivos
                </Label>
                <Input
                  id="maxDevices"
                  type="number"
                  min={1}
                  value={formData.maxDevices}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDevices: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="space-y-2">
              <Label htmlFor="validDays" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Días de Validez
              </Label>
              <Input
                id="validDays"
                type="number"
                min={1}
                value={formData.validDays}
                onChange={(e) => setFormData(prev => ({ ...prev, validDays: parseInt(e.target.value) || 365 }))}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !formData.licenseeEmail || !formData.planId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Generar Licencia
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Generated License */}
      <Card className={cn(
        "transition-all duration-300",
        generatedLicense ? "border-primary/50 bg-primary/5" : "border-dashed"
      )}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className={cn(
              "h-5 w-5",
              generatedLicense ? "text-primary" : "text-muted-foreground"
            )} />
            Licencia Generada
          </CardTitle>
          <CardDescription>
            {generatedLicense 
              ? "Tu licencia está lista para entregar al cliente"
              : "Completa el formulario para generar una licencia"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {generatedLicense ? (
            <div className="space-y-4">
              {/* License Key Display */}
              <div className="p-4 bg-background rounded-lg border">
                <Label className="text-xs text-muted-foreground">CLAVE DE LICENCIA</Label>
                <div className="mt-2 font-mono text-lg break-all select-all">
                  {generatedLicense.licenseKey}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Plan:</span>
                  <p className="font-medium">{selectedPlan?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Expira:</span>
                  <p className="font-medium">
                    {generatedLicense.expiresAt 
                      ? new Date(generatedLicense.expiresAt).toLocaleDateString()
                      : 'Nunca'
                    }
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Usuarios:</span>
                  <p className="font-medium">{formData.maxUsers}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dispositivos:</span>
                  <p className="font-medium">{formData.maxDevices}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" className="flex-1">
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setGeneratedLicense(null);
                  setFormData({
                    licenseeEmail: '',
                    licenseeName: '',
                    planId: '',
                    licenseType: 'subscription',
                    maxUsers: 5,
                    maxDevices: 3,
                    validDays: 365,
                    features: {}
                  });
                }}
              >
                Generar Otra Licencia
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Key className="h-12 w-12 mb-4 opacity-50" />
              <p>Tu licencia aparecerá aquí</p>
              <p className="text-sm">Firmada criptográficamente con Ed25519</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default LicenseGenerator;
