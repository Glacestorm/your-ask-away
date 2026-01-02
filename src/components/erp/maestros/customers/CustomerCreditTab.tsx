/**
 * Tab de Política de Crédito del Cliente
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface CustomerCreditPolicy {
  customer_id: string;
  credit_limit: number;
  block_on_overdue: boolean;
  allow_override_with_permission: boolean;
}

interface CustomerCreditTabProps {
  customerId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

export const CustomerCreditTab: React.FC<CustomerCreditTabProps> = ({ customerId }) => {
  const [creditPolicy, setCreditPolicy] = useState<CustomerCreditPolicy | null>(null);
  const [creditForm, setCreditForm] = useState({
    credit_limit: 0,
    block_on_overdue: true,
    allow_override_with_permission: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCreditPolicy();
  }, [customerId]);

  const loadCreditPolicy = async () => {
    setIsLoading(true);
    try {
      const { data: creditData } = await supabase
        .from('customer_credit_policy')
        .select('*')
        .eq('customer_id', customerId)
        .single();
      
      if (creditData) {
        const policy = creditData as CustomerCreditPolicy;
        setCreditPolicy(policy);
        setCreditForm({
          credit_limit: policy.credit_limit || 0,
          block_on_overdue: policy.block_on_overdue ?? true,
          allow_override_with_permission: policy.allow_override_with_permission ?? false
        });
      } else {
        setCreditPolicy(null);
        setCreditForm({
          credit_limit: 0,
          block_on_overdue: true,
          allow_override_with_permission: false
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCreditPolicy = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('customer_credit_policy')
        .upsert({
          customer_id: customerId,
          credit_limit: creditForm.credit_limit,
          block_on_overdue: creditForm.block_on_overdue,
          allow_override_with_permission: creditForm.allow_override_with_permission
        } as any);

      if (error) throw error;

      toast.success('Política de crédito guardada');
      loadCreditPolicy();
    } catch {
      toast.error('Error al guardar política de crédito');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-900/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-amber-600" />
            Política de Crédito
          </CardTitle>
          <CardDescription>
            Configura el límite de crédito y condiciones para este cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Límite de Crédito</Label>
            <div className="relative">
              <Input
                type="number"
                step="100"
                min="0"
                value={creditForm.credit_limit}
                onChange={(e) => setCreditForm({ ...creditForm, credit_limit: parseFloat(e.target.value) || 0 })}
                className="pl-8"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Límite máximo de deuda pendiente permitida
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div>
                <Label>Bloquear si hay impagados</Label>
                <p className="text-xs text-muted-foreground">
                  Bloquea nuevos pedidos si tiene facturas vencidas
                </p>
              </div>
              <Switch
                checked={creditForm.block_on_overdue}
                onCheckedChange={(checked) => setCreditForm({ ...creditForm, block_on_overdue: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div>
                <Label>Permitir sobrepaso con autorización</Label>
                <p className="text-xs text-muted-foreground">
                  Permite sobrepasar el límite si un supervisor lo autoriza
                </p>
              </div>
              <Switch
                checked={creditForm.allow_override_with_permission}
                onCheckedChange={(checked) => setCreditForm({ ...creditForm, allow_override_with_permission: checked })}
              />
            </div>
          </div>

          <Button onClick={handleSaveCreditPolicy} className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Política de Crédito'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Status indicator */}
      {creditPolicy && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-lg border bg-muted/50"
        >
          <div className="flex items-center gap-2 mb-2">
            {creditPolicy.block_on_overdue ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <Check className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium">Estado actual del cliente</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Crédito disponible:</span>
              <span className="ml-2 font-mono">{formatCurrency(creditPolicy.credit_limit)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Bloqueo activo:</span>
              <span className="ml-2">{creditPolicy.block_on_overdue ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CustomerCreditTab;
