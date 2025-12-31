/**
 * Wizard de Configuración Inicial del ERP
 * Se muestra cuando no hay empresas ni asignaciones configuradas
 */

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Building2, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Shield,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ERPInitialSetupProps {
  onComplete: () => void;
}

interface CompanyForm {
  name: string;
  legal_name: string;
  tax_id: string;
  country: string;
  currency: string;
  timezone: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  email: string;
}

const initialForm: CompanyForm = {
  name: '',
  legal_name: '',
  tax_id: '',
  country: 'ES',
  currency: 'EUR',
  timezone: 'Europe/Madrid',
  address: '',
  city: '',
  postal_code: '',
  phone: '',
  email: '',
};

export function ERPInitialSetup({ onComplete }: ERPInitialSetupProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [createdRoleId, setCreatedRoleId] = useState<string | null>(null);
  const [attemptedCompanySubmit, setAttemptedCompanySubmit] = useState(false);

  const companyNameRef = useRef<HTMLInputElement | null>(null);

  const handleCreateCompany = async () => {
    setAttemptedCompanySubmit(true);

    if (!form.name.trim()) {
      toast.error('El nombre de la empresa es obligatorio');
      companyNameRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // IMPORTANTE:
      // No pedimos RETURNING/SELECT aquí porque durante el setup inicial
      // el usuario todavía no está asignado a la empresa y la política SELECT
      // bloquearía la respuesta del INSERT.
      const companyId = crypto.randomUUID();

      const { error: companyError } = await supabase
        .from('erp_companies')
        .insert([
          {
            id: companyId,
            name: form.name,
            legal_name: form.legal_name || null,
            tax_id: form.tax_id || null,
            country: form.country,
            currency: form.currency,
            timezone: form.timezone,
            address: form.address || null,
            city: form.city || null,
            postal_code: form.postal_code || null,
            phone: form.phone || null,
            email: form.email || null,
            is_active: true,
          },
        ]);

      if (companyError) throw companyError;

      setCreatedCompanyId(companyId);
      toast.success('Empresa creada correctamente');
      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear la empresa';
      console.error('[ERPInitialSetup] Error creating company:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoleAndAssign = async () => {
    if (!createdCompanyId || !user?.id) {
      toast.error('Faltan datos necesarios');
      return;
    }

    setIsLoading(true);
    try {
      // 2. Crear rol de Administrador (sin RETURNING/SELECT por la misma razón del setup inicial)
      const roleId = crypto.randomUUID();

      const { error: roleError } = await supabase
        .from('erp_roles')
        .insert([
          {
            id: roleId,
            company_id: createdCompanyId,
            name: 'Administrador',
            description: 'Acceso completo al sistema ERP',
            is_system: true,
          },
        ]);

      if (roleError) throw roleError;

      setCreatedRoleId(roleId);

      // 3. Obtener todos los permisos y asignarlos al rol
      const { data: permissions, error: permError } = await supabase
        .from('erp_permissions')
        .select('id');

      if (permError) throw permError;

      // 4. Asignar todos los permisos al rol admin
      if (permissions && permissions.length > 0) {
        const rolePermissions = permissions.map((p) => ({
          role_id: roleId,
          permission_id: p.id,
        }));

        const { error: rpError } = await supabase
          .from('erp_role_permissions')
          .insert(rolePermissions);

        if (rpError) throw rpError;
      }

      // 5. Asignar usuario a la empresa con rol admin
      const { error: ucError } = await supabase
        .from('erp_user_companies')
        .insert([
          {
            user_id: user.id,
            company_id: createdCompanyId,
            role_id: roleId,
            is_default: true,
            is_active: true,
          },
        ]);

      if (ucError) throw ucError;

      toast.success('Configuración completada');
      setStep(3);

      // Esperar un momento y completar
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al configurar rol y permisos';
      console.error('[ERPInitialSetup] Error setting up role:', err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Crear Empresa', icon: Building2 },
    { number: 2, title: 'Configurar Acceso', icon: Shield },
    { number: 3, title: 'Completado', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Configuración Inicial</span>
        </div>
        <h2 className="text-2xl font-bold mb-2">Bienvenido al ERP Modular</h2>
        <p className="text-muted-foreground">
          Configura tu primera empresa para comenzar a utilizar el sistema
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = s.number === step;
          const isCompleted = s.number < step;
          
          return (
            <React.Fragment key={s.number}>
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all",
                isActive && "bg-primary text-primary-foreground",
                isCompleted && "bg-green-500 text-white",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
              </div>
              {idx < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="flex-1">
        <CardContent className="pt-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-lg font-semibold">Datos de la Empresa</h3>
                <p className="text-sm text-muted-foreground">
                  Introduce los datos básicos de tu empresa
                </p>
              </div>

              <div className="grid gap-4 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre comercial <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      ref={companyNameRef}
                      id="name"
                      required
                      aria-required="true"
                      aria-invalid={attemptedCompanySubmit && !form.name.trim()}
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Mi Empresa S.L."
                      className={cn(
                        attemptedCompanySubmit && !form.name.trim() && "border-destructive focus-visible:ring-destructive"
                      )}
                    />
                    {attemptedCompanySubmit && !form.name.trim() && (
                      <p className="text-xs text-destructive">Este campo es obligatorio</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Razón social</Label>
                    <Input
                      id="legal_name"
                      value={form.legal_name}
                      onChange={(e) => setForm({ ...form, legal_name: e.target.value })}
                      placeholder="Mi Empresa Sociedad Limitada"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">CIF/NIF</Label>
                    <Input
                      id="tax_id"
                      value={form.tax_id}
                      onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      País <span className="text-destructive">*</span>
                    </Label>
                    <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ES">España</SelectItem>
                        <SelectItem value="PT">Portugal</SelectItem>
                        <SelectItem value="FR">Francia</SelectItem>
                        <SelectItem value="DE">Alemania</SelectItem>
                        <SelectItem value="IT">Italia</SelectItem>
                        <SelectItem value="MX">México</SelectItem>
                        <SelectItem value="CO">Colombia</SelectItem>
                        <SelectItem value="AR">Argentina</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">
                      Moneda <span className="text-destructive">*</span>
                    </Label>
                    <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="GBP">GBP - Libra</SelectItem>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Calle Principal 123"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                      id="postal_code"
                      value={form.postal_code}
                      onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                      placeholder="28001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+34 912 345 678"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email de la empresa</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@empresa.com"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleCreateCompany} disabled={isLoading} className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Crear Empresa
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <Shield className="h-16 w-16 mx-auto text-primary" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Configurar Acceso</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Se creará automáticamente un rol de <strong>Administrador</strong> con todos los permisos 
                  y se te asignará a la empresa que acabas de crear.
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="font-medium">Tu configuración:</span>
                </div>
                <ul className="text-sm text-left space-y-2 ml-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Rol: Administrador
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Permisos: Acceso completo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Empresa por defecto: Sí
                  </li>
                </ul>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={handleCreateRoleAndAssign} disabled={isLoading} size="lg" className="gap-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Completar Configuración
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center py-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
                <CheckCircle2 className="h-20 w-20 mx-auto text-green-500 relative" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">¡Configuración Completada!</h3>
                <p className="text-muted-foreground">
                  El ERP está listo. Serás redirigido al dashboard...
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ERPInitialSetup;
