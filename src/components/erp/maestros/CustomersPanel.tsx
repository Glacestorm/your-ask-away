/**
 * Panel de gestión de Clientes con Direcciones, Contactos y Crédito
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Search,
  Edit,
  Trash2,
  Users,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCard,
  History,
  X,
  Check,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { useMaestros, Customer, CustomerAddress, CustomerContact } from '@/hooks/erp/useMaestros';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CustomerAuditFeed } from './CustomerAuditFeed';
import { CustomerShippingTab } from './CustomerShippingTab';

interface CustomerCreditPolicy {
  customer_id: string;
  credit_limit: number;
  block_on_overdue: boolean;
  allow_override_with_permission: boolean;
}

type CustomerListItem = {
  id: string;
  code: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  source: 'customers' | 'erp_customers';
};

export const CustomersPanel: React.FC = () => {
  const { customers, customersLoading, createCustomer, updateCustomer, deleteCustomer, paymentTerms } = useMaestros();
  const { currentCompany } = useERPContext();
  const companyId = currentCompany?.id;

  const [erpCustomers, setErpCustomers] = useState<CustomerListItem[]>([]);
  const [erpCustomersLoading, setErpCustomersLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('general');

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    legal_name: '',
    trade_name: '',
    tax_id: '',
    email: '',
    phone: '',
    website: '',
    notes: '',
    is_active: true
  });

  // Addresses state
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [newAddress, setNewAddress] = useState({
    address_type: 'billing' as 'billing' | 'shipping',
    line1: '',
    line2: '',
    city: '',
    postal_code: '',
    region: '',
    country: 'ES',
    is_default: false
  });

  // Credit policy state
  const [creditPolicy, setCreditPolicy] = useState<CustomerCreditPolicy | null>(null);
  const [creditForm, setCreditForm] = useState({
    credit_limit: 0,
    block_on_overdue: true,
    allow_override_with_permission: false
  });

  // Contacts state
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    is_primary: false
  });

  useEffect(() => {
    const fetchErpCustomers = async () => {
      if (!companyId) {
        setErpCustomers([]);
        return;
      }

      setErpCustomersLoading(true);
      try {
        const { data, error } = await supabase
          .from('erp_customers')
          .select('id, code, name, legal_name, tax_id, email, phone, is_active')
          .eq('company_id', companyId)
          .order('name');

        if (error) throw error;

        const mapped: CustomerListItem[] = (data || []).map((c: any) => ({
          id: c.id,
          code: (c.code || '').trim() || '-',
          legal_name: c.legal_name || c.name || '-',
          trade_name: null,
          tax_id: c.tax_id || null,
          email: c.email || null,
          phone: c.phone || null,
          is_active: c.is_active ?? true,
          source: 'erp_customers',
        }));

        setErpCustomers(mapped);
      } catch (err) {
        console.error('[CustomersPanel] Error loading erp_customers:', err);
        toast.error('Error al cargar clientes ERP');
        setErpCustomers([]);
      } finally {
        setErpCustomersLoading(false);
      }
    };

    fetchErpCustomers();
  }, [companyId]);

  const customerItems: CustomerListItem[] = [
    ...customers.map((c) => ({
      id: c.id,
      code: c.code,
      legal_name: c.legal_name,
      trade_name: c.trade_name,
      tax_id: c.tax_id,
      email: c.email,
      phone: c.phone,
      is_active: c.is_active,
      source: 'customers' as const,
    })),
    ...erpCustomers,
  ];

  const filteredCustomers = customerItems.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.legal_name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.tax_id?.toLowerCase().includes(q) ?? false);
    const matchesActive = showInactive || c.is_active;
    return matchesSearch && matchesActive;
  });

  // Load customer details when selected
  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDetails(selectedCustomer.id);
    }
  }, [selectedCustomer?.id]);

  const loadCustomerDetails = async (customerId: string) => {
    // Load addresses
    const { data: addressData } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false });
    setAddresses((addressData as CustomerAddress[]) || []);

    // Load contacts
    const { data: contactData } = await supabase
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false });
    setContacts((contactData as CustomerContact[]) || []);

    // Load credit policy
    const { data: creditData } = await supabase
      .from('customer_credit_policy')
      .select('*')
      .eq('customer_id', customerId)
      .single();
    
    if (creditData) {
      setCreditPolicy(creditData as CustomerCreditPolicy);
      setCreditForm({
        credit_limit: (creditData as CustomerCreditPolicy).credit_limit || 0,
        block_on_overdue: (creditData as CustomerCreditPolicy).block_on_overdue ?? true,
        allow_override_with_permission: (creditData as CustomerCreditPolicy).allow_override_with_permission ?? false
      });
    } else {
      setCreditPolicy(null);
      setCreditForm({
        credit_limit: 0,
        block_on_overdue: true,
        allow_override_with_permission: false
      });
    }
  };

  const openNewDialog = () => {
    setSelectedCustomer(null);
    setFormData({
      code: '',
      legal_name: '',
      trade_name: '',
      tax_id: '',
      email: '',
      phone: '',
      website: '',
      notes: '',
      is_active: true
    });
    setAddresses([]);
    setContacts([]);
    setCreditPolicy(null);
    setCreditForm({
      credit_limit: 0,
      block_on_overdue: true,
      allow_override_with_permission: false
    });
    setActiveDetailTab('general');
    setIsDialogOpen(true);
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      code: customer.code,
      legal_name: customer.legal_name,
      trade_name: customer.trade_name || '',
      tax_id: customer.tax_id || '',
      email: customer.email || '',
      phone: customer.phone || '',
      website: customer.website || '',
      notes: customer.notes || '',
      is_active: customer.is_active
    });
    setActiveDetailTab('general');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCustomer) {
      await updateCustomer.mutateAsync({ id: selectedCustomer.id, ...formData });
    } else {
      const result = await createCustomer.mutateAsync(formData);
      if (result) {
        setSelectedCustomer(result as Customer);
      }
    }
    
    setIsDialogOpen(false);
  };

  const handleDelete = async (customer: CustomerListItem) => {
    const label = customer.tax_id ? `${customer.legal_name} (${customer.tax_id})` : customer.legal_name;
    if (!confirm(`¿Estás seguro de eliminar este cliente?\n\n${label}`)) return;

    if (customer.source === 'customers') {
      await deleteCustomer.mutateAsync(customer.id);
      return;
    }

    const { error } = await supabase.from('erp_customers').delete().eq('id', customer.id);
    if (error) {
      console.error('[CustomersPanel] delete erp_customer error:', error);
      toast.error('Error al eliminar cliente ERP');
      return;
    }

    toast.success('Cliente ERP eliminado');
    // refrescar lista ERP
    if (companyId) {
      const { data } = await supabase
        .from('erp_customers')
        .select('id, code, name, legal_name, tax_id, email, phone, is_active')
        .eq('company_id', companyId)
        .order('name');

      setErpCustomers(
        (data || []).map((c: any) => ({
          id: c.id,
          code: (c.code || '').trim() || '-',
          legal_name: c.legal_name || c.name || '-',
          trade_name: null,
          tax_id: c.tax_id || null,
          email: c.email || null,
          phone: c.phone || null,
          is_active: c.is_active ?? true,
          source: 'erp_customers',
        }))
      );
    }
  };

  // Address handlers
  const handleAddAddress = async () => {
    if (!selectedCustomer || !newAddress.line1) return;
    
    const { error } = await supabase
      .from('customer_addresses')
      .insert([{
        customer_id: selectedCustomer.id,
        ...newAddress
      }] as any);
    
    if (error) {
      toast.error('Error al añadir dirección');
    } else {
      toast.success('Dirección añadida');
      loadCustomerDetails(selectedCustomer.id);
      setNewAddress({
        address_type: 'billing',
        line1: '',
        line2: '',
        city: '',
        postal_code: '',
        region: '',
        country: 'ES',
        is_default: false
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', addressId);
    
    if (!error && selectedCustomer) {
      toast.success('Dirección eliminada');
      loadCustomerDetails(selectedCustomer.id);
    }
  };

  // Contact handlers
  const handleAddContact = async () => {
    if (!selectedCustomer || !newContact.name) return;
    
    const { error } = await supabase
      .from('customer_contacts')
      .insert([{
        customer_id: selectedCustomer.id,
        ...newContact
      }] as any);
    
    if (error) {
      toast.error('Error al añadir contacto');
    } else {
      toast.success('Contacto añadido');
      loadCustomerDetails(selectedCustomer.id);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        role: '',
        is_primary: false
      });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const { error } = await supabase
      .from('customer_contacts')
      .delete()
      .eq('id', contactId);
    
    if (!error && selectedCustomer) {
      toast.success('Contacto eliminado');
      loadCustomerDetails(selectedCustomer.id);
    }
  };

  // Credit policy handler
  const handleSaveCreditPolicy = async () => {
    if (!selectedCustomer) return;

    const { error } = await supabase
      .from('customer_credit_policy')
      .upsert({
        customer_id: selectedCustomer.id,
        credit_limit: creditForm.credit_limit,
        block_on_overdue: creditForm.block_on_overdue,
        allow_override_with_permission: creditForm.allow_override_with_permission
      } as any);

    if (error) {
      toast.error('Error al guardar política de crédito');
    } else {
      toast.success('Política de crédito guardada');
      loadCustomerDetails(selectedCustomer.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes
          </CardTitle>
          <Button onClick={openNewDialog} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o CIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Mostrar inactivos
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {(customersLoading || erpCustomersLoading) ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay clientes{search && ' que coincidan con la búsqueda'}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>CIF/NIF</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={`${customer.source}-${customer.id}`}>
                    <TableCell className="font-mono text-sm">{customer.code || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customer.legal_name}</p>
                          {customer.source === 'erp_customers' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              ERP
                            </Badge>
                          )}
                        </div>
                        {customer.trade_name && (
                          <p className="text-xs text-muted-foreground">{customer.trade_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{customer.tax_id || '-'}</TableCell>
                    <TableCell className="text-sm">{customer.email || '-'}</TableCell>
                    <TableCell className="text-sm">{customer.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={customer.is_active ? 'default' : 'secondary'}>
                        {customer.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {customer.source === 'customers' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const full = customers.find((c) => c.id === customer.id);
                              if (full) openEditDialog(full);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(customer)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Dialog de creación/edición con tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCustomer ? `Editar Cliente: ${selectedCustomer.code}` : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {selectedCustomer 
                ? 'Modifica los datos del cliente, direcciones, contactos y crédito'
                : 'Introduce los datos del nuevo cliente'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general" className="gap-1">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-1" disabled={!selectedCustomer}>
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Direcciones</span>
              </TabsTrigger>
              <TabsTrigger value="contacts" className="gap-1" disabled={!selectedCustomer}>
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">Contactos</span>
              </TabsTrigger>
              <TabsTrigger value="credit" className="gap-1" disabled={!selectedCustomer}>
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Crédito</span>
              </TabsTrigger>
              <TabsTrigger value="shipping" className="gap-1" disabled={!selectedCustomer}>
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Logística</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="gap-1" disabled={!selectedCustomer}>
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Auditoría</span>
              </TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="mt-4">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Código *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="CLI001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_id">CIF/NIF</Label>
                      <Input
                        id="tax_id"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value.toUpperCase() })}
                        placeholder="B12345678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legal_name">Razón Social *</Label>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                      placeholder="Empresa S.L."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trade_name">Nombre Comercial</Label>
                    <Input
                      id="trade_name"
                      value={formData.trade_name}
                      onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                      placeholder="Nombre comercial (opcional)"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+34 912 345 678"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.empresa.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Observaciones..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Cliente activo</Label>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createCustomer.isPending || updateCustomer.isPending}
                  >
                    {selectedCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="mt-4 space-y-4">
              {/* Lista de direcciones */}
              <div className="space-y-3">
                {addresses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay direcciones registradas</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className="p-4 border rounded-lg flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={addr.address_type === 'billing' ? 'default' : 'secondary'}>
                            {addr.address_type === 'billing' ? 'Facturación' : 'Envío'}
                          </Badge>
                          {addr.is_default && (
                            <Badge variant="outline" className="gap-1">
                              <Check className="h-3 w-3" /> Principal
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium">{addr.line1}</p>
                        {addr.line2 && <p className="text-sm text-muted-foreground">{addr.line2}</p>}
                        <p className="text-sm text-muted-foreground">
                          {[addr.postal_code, addr.city, addr.region, addr.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              {/* Formulario nueva dirección */}
              <div className="space-y-4">
                <h4 className="font-medium">Añadir Dirección</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select 
                      value={newAddress.address_type} 
                      onValueChange={(v) => setNewAddress({ ...newAddress, address_type: v as 'billing' | 'shipping' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="billing">Facturación</SelectItem>
                        <SelectItem value="shipping">Envío</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>País</Label>
                    <Input
                      value={newAddress.country}
                      onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value.toUpperCase() })}
                      placeholder="ES"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    placeholder="Calle Principal 123"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Ciudad</Label>
                    <Input
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      placeholder="Madrid"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CP</Label>
                    <Input
                      value={newAddress.postal_code}
                      onChange={(e) => setNewAddress({ ...newAddress, postal_code: e.target.value })}
                      placeholder="28001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Provincia</Label>
                    <Input
                      value={newAddress.region}
                      onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                      placeholder="Madrid"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newAddress.is_default}
                      onCheckedChange={(checked) => setNewAddress({ ...newAddress, is_default: checked })}
                    />
                    <Label>Dirección principal</Label>
                  </div>
                  <Button onClick={handleAddAddress} disabled={!newAddress.line1}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-4 space-y-4">
              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay contactos registrados</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id} className="p-4 border rounded-lg flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{contact.name}</span>
                          {contact.is_primary && (
                            <Badge variant="outline" className="text-xs">Principal</Badge>
                          )}
                        </div>
                        {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {contact.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {contact.email}
                            </span>
                          )}
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {contact.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Añadir Contacto</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre *</Label>
                    <Input
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Juan García"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={newContact.role}
                      onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                      placeholder="Director Comercial"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+34 600 123 456"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newContact.is_primary}
                      onCheckedChange={(checked) => setNewContact({ ...newContact, is_primary: checked })}
                    />
                    <Label>Contacto principal</Label>
                  </div>
                  <Button onClick={handleAddContact} disabled={!newContact.name}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Credit Tab */}
            <TabsContent value="credit" className="mt-4 space-y-6">
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

                  <Button onClick={handleSaveCreditPolicy} className="w-full">
                    Guardar Política de Crédito
                  </Button>
                </CardContent>
              </Card>

              {/* Status indicator */}
              {creditPolicy && (
                <div className="p-4 rounded-lg border bg-muted/50">
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
                </div>
              )}
            </TabsContent>

            {/* Shipping/Logistics Tab */}
            <TabsContent value="shipping" className="mt-4">
              {selectedCustomer && (
                <CustomerShippingTab customerId={selectedCustomer.id} />
              )}
            </TabsContent>

            {/* Audit Tab */}
            <TabsContent value="audit" className="mt-4">
              {selectedCustomer && (
                <CustomerAuditFeed entityId={selectedCustomer.id} entityType="customer" />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CustomersPanel;
