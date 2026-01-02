/**
 * Panel de Mandatos SEPA - Refactorizado
 * Con componentes compartidos y mejor UX
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { DataTable, Column } from './shared/DataTable';
import { SearchFilters, FilterOption } from './shared/SearchFilters';
import { EntityFormDialog } from './shared/EntityFormDialog';
import { ActionButtons } from './shared/ActionButtons';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SepaMandate {
  id: string;
  company_id: string;
  customer_id: string;
  mandate_ref: string;
  signed_date: string;
  scheme: 'CORE' | 'B2B' | 'COR1';
  iban?: string | null;
  bic?: string | null;
  debtor_name?: string | null;
  creditor_id?: string | null;
  sequence_type?: 'FRST' | 'RCUR' | 'OOFF' | 'FNAL';
  is_active: boolean;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
}

const INITIAL_FORM = {
  customer_id: '',
  mandate_ref: '',
  signed_date: format(new Date(), 'yyyy-MM-dd'),
  scheme: 'CORE' as 'CORE' | 'B2B' | 'COR1',
  iban: '',
  bic: '',
  debtor_name: '',
  sequence_type: 'FRST' as 'FRST' | 'RCUR' | 'OOFF' | 'FNAL',
  is_active: true
};

export const SEPAMandatesPanel: React.FC = () => {
  const { currentCompany } = useERPContext();
  const { customers } = useMaestros();
  const companyId = currentCompany?.id;

  const [mandates, setMandates] = useState<SepaMandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMandate, setEditingMandate] = useState<SepaMandate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  useEffect(() => {
    if (companyId) loadMandates();
  }, [companyId]);

  const loadMandates = useCallback(async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sepa_mandates')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMandates((data || []) as unknown as SepaMandate[]);
    } catch (err) {
      console.error('[SEPAMandatesPanel] Error loading mandates:', err);
      toast.error('Error al cargar mandatos SEPA');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const filteredMandates = useMemo(() => {
    return mandates.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        m.mandate_ref.toLowerCase().includes(q) ||
        (m.debtor_name?.toLowerCase().includes(q) ?? false) ||
        (m.iban?.toLowerCase().includes(q) ?? false);
      const matchesActive = showInactive || m.is_active;
      return matchesSearch && matchesActive;
    });
  }, [mandates, search, showInactive]);

  // Filter configuration
  const filters: FilterOption[] = useMemo(() => [
    { key: 'showInactive', label: 'Mostrar cancelados', type: 'switch', defaultValue: false }
  ], []);

  const filterValues = useMemo(() => ({ showInactive }), [showInactive]);

  const handleFilterChange = useCallback((key: string, value: string | boolean) => {
    if (key === 'showInactive') setShowInactive(value as boolean);
  }, []);

  const getCustomerName = useCallback((customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.legal_name || customer?.trade_name || 'Cliente no encontrado';
  }, [customers]);

  const formatIBAN = useCallback((iban: string | null) => {
    if (!iban) return '-';
    const clean = iban.replace(/\s/g, '');
    if (clean.length < 10) return iban;
    return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
  }, []);

  // Table columns
  const columns: Column<SepaMandate>[] = useMemo(() => [
    {
      key: 'mandate_ref',
      header: 'Referencia',
      accessor: (row) => <span className="font-mono text-sm font-medium">{row.mandate_ref}</span>,
      sortable: true
    },
    {
      key: 'customer',
      header: 'Cliente',
      accessor: (row) => (
        <span className="font-medium text-sm">{row.debtor_name || getCustomerName(row.customer_id)}</span>
      ),
      sortable: true
    },
    {
      key: 'iban',
      header: 'IBAN',
      accessor: (row) => <span className="font-mono text-sm">{formatIBAN(row.iban)}</span>
    },
    {
      key: 'scheme',
      header: 'Esquema',
      accessor: (row) => {
        const colors: Record<string, string> = {
          CORE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          B2B: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          COR1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        };
        return <Badge className={colors[row.scheme] || ''}>{row.scheme}</Badge>;
      }
    },
    {
      key: 'sequence_type',
      header: 'Secuencia',
      accessor: (row) => {
        const labels: Record<string, string> = {
          FRST: 'Primero',
          RCUR: 'Recurrente',
          OOFF: 'Único',
          FNAL: 'Final'
        };
        return <Badge variant="outline" className="text-[10px]">{labels[row.sequence_type || 'RCUR']}</Badge>;
      }
    },
    {
      key: 'signed_date',
      header: 'Firma',
      accessor: (row) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(row.signed_date), 'dd/MM/yyyy')}
        </div>
      ),
      sortable: true
    },
    {
      key: 'is_active',
      header: 'Estado',
      accessor: (row) => row.is_active ? (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
          <CheckCircle className="h-3 w-3" />
          Activo
        </Badge>
      ) : (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Cancelado
        </Badge>
      )
    }
  ], [getCustomerName, formatIBAN]);

  const openNewDialog = useCallback(() => {
    setEditingMandate(null);
    setFormData({
      ...INITIAL_FORM,
      mandate_ref: `SEPA-${Date.now().toString(36).toUpperCase()}`
    });
    setIsDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((mandate: SepaMandate) => {
    setEditingMandate(mandate);
    setFormData({
      customer_id: mandate.customer_id,
      mandate_ref: mandate.mandate_ref,
      signed_date: mandate.signed_date,
      scheme: mandate.scheme,
      iban: mandate.iban || '',
      bic: mandate.bic || '',
      debtor_name: mandate.debtor_name || '',
      sequence_type: mandate.sequence_type || 'RCUR',
      is_active: mandate.is_active
    });
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!companyId) return;
    setIsSubmitting(true);

    try {
      const mandateData = {
        company_id: companyId,
        customer_id: formData.customer_id,
        mandate_ref: formData.mandate_ref,
        signed_date: formData.signed_date,
        scheme: formData.scheme,
        iban: formData.iban || null,
        bic: formData.bic || null,
        debtor_name: formData.debtor_name || null,
        sequence_type: formData.sequence_type,
        is_active: formData.is_active
      };

      if (editingMandate) {
        const { error } = await supabase
          .from('sepa_mandates')
          .update(mandateData)
          .eq('id', editingMandate.id);
        
        if (error) throw error;
        toast.success('Mandato actualizado');
      } else {
        const { error } = await supabase
          .from('sepa_mandates')
          .insert([mandateData] as any);
        
        if (error) throw error;
        toast.success('Mandato SEPA creado');
      }

      setIsDialogOpen(false);
      loadMandates();
    } catch (err) {
      console.error('[SEPAMandatesPanel] Error saving mandate:', err);
      toast.error('Error al guardar mandato');
    } finally {
      setIsSubmitting(false);
    }
  }, [companyId, formData, editingMandate, loadMandates]);

  const handleCancel = useCallback(async (mandate: SepaMandate) => {
    const reason = prompt('Motivo de cancelación (opcional):');
    
    try {
      const { error } = await supabase
        .from('sepa_mandates')
        .update({
          is_active: false,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || null
        })
        .eq('id', mandate.id);
      
      if (error) throw error;
      toast.success('Mandato cancelado');
      loadMandates();
    } catch (err) {
      console.error('[SEPAMandatesPanel] Error cancelling mandate:', err);
      toast.error('Error al cancelar mandato');
    }
  }, [loadMandates]);

  const renderRowActions = useCallback((row: SepaMandate) => (
    <ActionButtons
      onEdit={() => openEditDialog(row)}
      onDelete={row.is_active ? () => handleCancel(row) : undefined}
      showDropdown
      size="sm"
    />
  ), [openEditDialog, handleCancel]);

  // Stats
  const stats = useMemo(() => ({
    active: mandates.filter(m => m.is_active).length,
    core: mandates.filter(m => m.scheme === 'CORE').length,
    b2b: mandates.filter(m => m.scheme === 'B2B').length
  }), [mandates]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Mandatos SEPA
              </CardTitle>
              <CardDescription>
                Autorizaciones de adeudo directo para clientes
              </CardDescription>
            </div>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Mandato
            </Button>
          </div>

          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar por referencia, IBAN o nombre..."
            filters={filters}
            filterValues={filterValues}
            onFilterChange={handleFilterChange}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredMandates}
            columns={columns}
            loading={loading}
            emptyIcon={<CreditCard className="h-12 w-12" />}
            emptyMessage="No hay mandatos SEPA"
            emptyDescription="Los mandatos autorizan adeudos directos en cuentas de clientes"
            onRowDoubleClick={openEditDialog}
            rowActions={renderRowActions}
            rowClassName={(row) => !row.is_active ? 'opacity-50' : ''}
            exportFilename="mandatos-sepa"
          />

          <Separator className="my-4" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.core}</p>
              <p className="text-xs text-muted-foreground">CORE</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.b2b}</p>
              <p className="text-xs text-muted-foreground">B2B</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingMandate ? 'Editar Mandato SEPA' : 'Nuevo Mandato SEPA'}
        description="Autorización de adeudo directo según normativa SEPA"
        onSubmit={handleSubmit}
        submitLabel={editingMandate ? 'Guardar Cambios' : 'Crear Mandato'}
        isSubmitting={isSubmitting}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Referencia de Mandato *</Label>
            <Input
              value={formData.mandate_ref}
              onChange={(e) => setFormData({ ...formData, mandate_ref: e.target.value.toUpperCase() })}
              placeholder="SEPA-ABC123"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha de Firma *</Label>
            <Input
              type="date"
              value={formData.signed_date}
              onChange={(e) => setFormData({ ...formData, signed_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cliente *</Label>
          <Select 
            value={formData.customer_id} 
            onValueChange={(v) => {
              const customer = customers.find(c => c.id === v);
              setFormData({ 
                ...formData, 
                customer_id: v,
                debtor_name: customer?.legal_name || ''
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.legal_name} {c.tax_id && `(${c.tax_id})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Esquema SEPA *</Label>
            <Select 
              value={formData.scheme} 
              onValueChange={(v) => setFormData({ ...formData, scheme: v as 'CORE' | 'B2B' | 'COR1' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CORE">CORE (Consumidores)</SelectItem>
                <SelectItem value="B2B">B2B (Empresas)</SelectItem>
                <SelectItem value="COR1">COR1 (Core rápido)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de Secuencia</Label>
            <Select 
              value={formData.sequence_type} 
              onValueChange={(v) => setFormData({ ...formData, sequence_type: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FRST">FRST (Primero)</SelectItem>
                <SelectItem value="RCUR">RCUR (Recurrente)</SelectItem>
                <SelectItem value="OOFF">OOFF (Único)</SelectItem>
                <SelectItem value="FNAL">FNAL (Final)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>IBAN</Label>
            <Input
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
              placeholder="ES1234567890123456789012"
            />
          </div>
          <div className="space-y-2">
            <Label>BIC/SWIFT</Label>
            <Input
              value={formData.bic}
              onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
              placeholder="BSCHESMMXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Nombre del Deudor</Label>
          <Input
            value={formData.debtor_name}
            onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
            placeholder="Nombre que aparece en el banco"
          />
        </div>
      </EntityFormDialog>
    </motion.div>
  );
};

export default SEPAMandatesPanel;
