/**
 * CreateAccountDialog - Dialog para crear/editar cuentas contables
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useERPAccounting } from '@/hooks/erp/useERPAccounting';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getAccountTypeLabel } from '@/lib/erp/accounting-dictionaries';
import { Loader2 } from 'lucide-react';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingAccount?: any;
  countryCode: string;
  parentAccountId?: string;
}

export function CreateAccountDialog({
  open,
  onOpenChange,
  editingAccount,
  countryCode,
  parentAccountId
}: CreateAccountDialogProps) {
  const { currentCompany } = useERPContext();
  const { chartOfAccounts } = useERPAccounting();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    account_type: 'asset',
    parent_id: parentAccountId || '',
    level: 1,
    is_header: false,
    is_reconcilable: false,
    is_tax_relevant: false,
    notes: ''
  });

  // Reset form cuando cambia editingAccount
  useEffect(() => {
    if (editingAccount) {
      setFormData({
        code: editingAccount.code || '',
        name: editingAccount.name || '',
        account_type: editingAccount.account_type || 'asset',
        parent_id: editingAccount.parent_id || '',
        level: editingAccount.level || 1,
        is_header: editingAccount.is_header || false,
        is_reconcilable: editingAccount.is_reconcilable || false,
        is_tax_relevant: editingAccount.is_tax_relevant || false,
        notes: editingAccount.notes || ''
      });
    } else {
      setFormData({
        code: '',
        name: '',
        account_type: 'asset',
        parent_id: parentAccountId || '',
        level: 1,
        is_header: false,
        is_reconcilable: false,
        is_tax_relevant: false,
        notes: ''
      });
    }
  }, [editingAccount, parentAccountId, open]);

  // Calcular nivel basado en código
  useEffect(() => {
    const codeLength = formData.code.length;
    let level = 1;
    if (codeLength >= 2) level = 2;
    if (codeLength >= 3) level = 3;
    if (codeLength >= 4) level = 4;
    if (codeLength >= 5) level = 5;
    setFormData(prev => ({ ...prev, level }));
  }, [formData.code]);

  // Cuentas padre disponibles (solo headers - cuentas que no aceptan movimientos)
  const parentAccounts = chartOfAccounts.filter(a => 
    !a.accepts_entries && a.account_code && formData.code.startsWith(a.account_code.substring(0, a.account_code.length - 1))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCompany?.id) {
      toast.error('No hay empresa seleccionada');
      return;
    }

    if (!formData.code || !formData.name) {
      toast.error('Código y nombre son obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      const accountData = {
        company_id: currentCompany.id,
        country_code: countryCode,
        code: formData.code,
        name: formData.name,
        account_type: formData.account_type,
        parent_id: formData.parent_id || null,
        level: formData.level,
        is_header: formData.is_header,
        is_reconcilable: formData.is_reconcilable,
        is_tax_relevant: formData.is_tax_relevant,
        notes: formData.notes || null,
        is_active: true
      };

      if (editingAccount) {
        // Actualizar
        const { error } = await supabase
          .from('erp_chart_accounts')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast.success('Cuenta actualizada');
      } else {
        // Crear
        const { error } = await supabase
          .from('erp_chart_accounts')
          .insert(accountData);

        if (error) throw error;
        toast.success('Cuenta creada');
      }

      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar';
      toast.error(message);
      console.error('[CreateAccountDialog] error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta Contable'}
          </DialogTitle>
          <DialogDescription>
            {editingAccount 
              ? 'Modifica los datos de la cuenta contable'
              : 'Crea una nueva cuenta en el plan de cuentas'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                placeholder="430"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="font-mono"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Nivel: {formData.level}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_type">Tipo *</Label>
              <Select
                value={formData.account_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, account_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">{getAccountTypeLabel('asset', countryCode)}</SelectItem>
                  <SelectItem value="liability">{getAccountTypeLabel('liability', countryCode)}</SelectItem>
                  <SelectItem value="equity">{getAccountTypeLabel('equity', countryCode)}</SelectItem>
                  <SelectItem value="income">{getAccountTypeLabel('income', countryCode)}</SelectItem>
                  <SelectItem value="expense">{getAccountTypeLabel('expense', countryCode)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Clientes"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {parentAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_id">Cuenta Padre</Label>
              <Select
                value={formData.parent_id || 'none'}
                onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value === 'none' ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin padre</SelectItem>
                  {parentAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_header"
                checked={formData.is_header}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_header: checked as boolean }))
                }
              />
              <Label htmlFor="is_header" className="text-sm font-normal">
                Es cuenta de grupo (no acepta movimientos)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_reconcilable"
                checked={formData.is_reconcilable}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_reconcilable: checked as boolean }))
                }
              />
              <Label htmlFor="is_reconcilable" className="text-sm font-normal">
                Conciliable
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_tax_relevant"
                checked={formData.is_tax_relevant}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, is_tax_relevant: checked as boolean }))
                }
              />
              <Label htmlFor="is_tax_relevant" className="text-sm font-normal">
                Relacionada con impuestos
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre esta cuenta..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default CreateAccountDialog;
