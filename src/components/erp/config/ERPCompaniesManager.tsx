/**
 * Gestión de Empresas ERP
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useERPCompanies } from '@/hooks/erp/useERPCompanies';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { ERPCompany, CreateCompanyForm } from '@/types/erp';
import { toast } from 'sonner';

const initialForm: CreateCompanyForm = {
  name: '',
  legal_name: '',
  tax_id: '',
  address: '',
  city: '',
  postal_code: '',
  country: 'ES',
  currency: 'EUR',
  timezone: 'Europe/Madrid',
  phone: '',
  email: '',
  website: '',
};

export function ERPCompaniesManager() {
  const { hasPermission } = useERPContext();
  const { companies, groups, isLoading, fetchCompanies, createCompany, updateCompany, deactivateCompany } = useERPCompanies();
  
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ERPCompany | null>(null);
  const [form, setForm] = useState<CreateCompanyForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  const canWrite = hasPermission('admin.all');

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.tax_id?.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setForm(initialForm);
    setShowDialog(true);
  };

  const handleOpenEdit = (company: ERPCompany) => {
    setEditingCompany(company);
    setForm({
      name: company.name,
      legal_name: company.legal_name || '',
      tax_id: company.tax_id || '',
      address: company.address || '',
      city: company.city || '',
      postal_code: company.postal_code || '',
      country: company.country,
      currency: company.currency,
      timezone: company.timezone,
      phone: company.phone || '',
      email: company.email || '',
      website: company.website || '',
      group_id: company.group_id || undefined,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCompany) {
        await updateCompany(editingCompany.id, form);
        toast.success('Empresa actualizada');
      } else {
        await createCompany(form);
        toast.success('Empresa creada');
      }
      setShowDialog(false);
      fetchCompanies();
    } catch (err) {
      toast.error('Error al guardar empresa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (company: ERPCompany) => {
    if (!confirm(`¿Desactivar la empresa "${company.name}"?`)) return;
    
    try {
      await deactivateCompany(company.id);
      toast.success('Empresa desactivada');
      fetchCompanies();
    } catch (err) {
      toast.error('Error al desactivar empresa');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresas
            </CardTitle>
            <CardDescription>
              Gestión de empresas del sistema ERP
            </CardDescription>
          </div>
          {canWrite && (
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Empresa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Estado</TableHead>
                  {canWrite && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canWrite ? 6 : 5} className="text-center py-8 text-muted-foreground">
                      No hay empresas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          {company.legal_name && (
                            <p className="text-xs text-muted-foreground">{company.legal_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{company.tax_id || '-'}</TableCell>
                      <TableCell>{company.country}</TableCell>
                      <TableCell>{company.currency}</TableCell>
                      <TableCell>
                        <Badge variant={company.is_active ? 'default' : 'secondary'}>
                          {company.is_active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      {canWrite && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(company)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(company)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog Crear/Editar */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre comercial *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Mi Empresa S.L."
                  />
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

              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="country">País</Label>
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
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                      <SelectItem value="GBP">GBP - Libra</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
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

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+34 912 345 678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@empresa.com"
                  />
                </div>
              </div>

              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label>Grupo empresarial</Label>
                  <Select 
                    value={form.group_id || ''} 
                    onValueChange={(v) => setForm({ ...form, group_id: v || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin grupo</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCompany ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ERPCompaniesManager;
