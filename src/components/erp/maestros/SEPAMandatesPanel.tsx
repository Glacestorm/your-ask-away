/**
 * Panel completo de Mandatos SEPA
 * Gestión de autorizaciones de adeudo directo
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Download,
  FileText,
  Trash2,
  Edit
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const [formData, setFormData] = useState({
    customer_id: '',
    mandate_ref: '',
    signed_date: format(new Date(), 'yyyy-MM-dd'),
    scheme: 'CORE' as 'CORE' | 'B2B' | 'COR1',
    iban: '',
    bic: '',
    debtor_name: '',
    sequence_type: 'FRST' as 'FRST' | 'RCUR' | 'OOFF' | 'FNAL',
    is_active: true
  });

  useEffect(() => {
    if (companyId) {
      loadMandates();
    }
  }, [companyId]);

  const loadMandates = async () => {
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
  };

  const filteredMandates = mandates.filter((m) => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || 
      m.mandate_ref.toLowerCase().includes(q) ||
      (m.debtor_name?.toLowerCase().includes(q) ?? false) ||
      (m.iban?.toLowerCase().includes(q) ?? false);
    const matchesActive = showInactive || m.is_active;
    return matchesSearch && matchesActive;
  });

  const openNewDialog = () => {
    setEditingMandate(null);
    const newRef = `SEPA-${Date.now().toString(36).toUpperCase()}`;
    setFormData({
      customer_id: '',
      mandate_ref: newRef,
      signed_date: format(new Date(), 'yyyy-MM-dd'),
      scheme: 'CORE',
      iban: '',
      bic: '',
      debtor_name: '',
      sequence_type: 'FRST',
      is_active: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (mandate: SepaMandate) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

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
    }
  };

  const handleCancel = async (mandate: SepaMandate) => {
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
  };

  const formatIBAN = (iban: string | null) => {
    if (!iban) return '-';
    const clean = iban.replace(/\s/g, '');
    if (clean.length < 10) return iban;
    return `${clean.slice(0, 4)} **** **** ${clean.slice(-4)}`;
  };

  const getSchemeBadge = (scheme: string) => {
    const colors: Record<string, string> = {
      CORE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      B2B: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      COR1: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return <Badge className={colors[scheme] || ''}>{scheme}</Badge>;
  };

  const getSequenceBadge = (seq: string) => {
    const labels: Record<string, string> = {
      FRST: 'Primero',
      RCUR: 'Recurrente',
      OOFF: 'Único',
      FNAL: 'Final'
    };
    return <Badge variant="outline" className="text-[10px]">{labels[seq] || seq}</Badge>;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.legal_name || customer?.trade_name || 'Cliente no encontrado';
  };

  return (
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

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por referencia, IBAN o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive-mandates"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-mandates" className="text-sm">
              Mostrar cancelados
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredMandates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay mandatos SEPA{search && ' que coincidan'}</p>
            <p className="text-sm mt-1">Los mandatos autorizan adeudos directos en cuentas de clientes</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>Esquema</TableHead>
                  <TableHead>Secuencia</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMandates.map((mandate) => (
                  <TableRow key={mandate.id} className={!mandate.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-mono text-sm font-medium">
                      {mandate.mandate_ref}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{mandate.debtor_name || getCustomerName(mandate.customer_id)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatIBAN(mandate.iban)}
                    </TableCell>
                    <TableCell>{getSchemeBadge(mandate.scheme)}</TableCell>
                    <TableCell>{getSequenceBadge(mandate.sequence_type)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(mandate.signed_date), 'dd/MM/yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mandate.is_active ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Cancelado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(mandate)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {mandate.is_active && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCancel(mandate)}
                            className="text-destructive hover:text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Stats */}
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-600">
              {mandates.filter(m => m.is_active).length}
            </p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {mandates.filter(m => m.scheme === 'CORE').length}
            </p>
            <p className="text-xs text-muted-foreground">CORE</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {mandates.filter(m => m.scheme === 'B2B').length}
            </p>
            <p className="text-xs text-muted-foreground">B2B</p>
          </div>
        </div>
      </CardContent>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingMandate ? 'Editar Mandato SEPA' : 'Nuevo Mandato SEPA'}
            </DialogTitle>
            <DialogDescription>
              Autorización de adeudo directo según normativa SEPA
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  onValueChange={(v) => setFormData({ ...formData, sequence_type: v as 'FRST' | 'RCUR' | 'OOFF' | 'FNAL' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRST">Primero (FRST)</SelectItem>
                    <SelectItem value="RCUR">Recurrente (RCUR)</SelectItem>
                    <SelectItem value="OOFF">Único (OOFF)</SelectItem>
                    <SelectItem value="FNAL">Final (FNAL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>IBAN del Deudor *</Label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase().replace(/\s/g, '') })}
                placeholder="ES12 1234 5678 90 1234567890"
                maxLength={34}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>BIC/SWIFT</Label>
                <Input
                  value={formData.bic}
                  onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
                  placeholder="CAIXESBBXXX"
                  maxLength={11}
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre del Deudor</Label>
                <Input
                  value={formData.debtor_name}
                  onChange={(e) => setFormData({ ...formData, debtor_name: e.target.value })}
                  placeholder="Nombre titular cuenta"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Mandato activo</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMandate ? 'Guardar Cambios' : 'Crear Mandato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SEPAMandatesPanel;
