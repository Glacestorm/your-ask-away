/**
 * Panel de gestión de Clientes - Refactorizado
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Users,
  MapPin,
  Phone,
  Building2,
  CreditCard,
  History,
  Truck,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useMaestros, Customer, CustomerAddress, CustomerContact } from '@/hooks/erp/useMaestros';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CustomerAuditFeed } from './CustomerAuditFeed';
import { CustomerShippingTab } from './CustomerShippingTab';
import { 
  CustomerAddressesTab, 
  CustomerContactsTab, 
  CustomerCreditTab,
  CustomerGeneralForm,
  CustomerFormData
} from './customers';
import { 
  DataTable, 
  Column, 
  SearchFilters,
  StatusBadge,
  StatsCard
} from './shared';

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

const emptyFormData: CustomerFormData = {
  code: '',
  legal_name: '',
  trade_name: '',
  tax_id: '',
  email: '',
  phone: '',
  website: '',
  notes: '',
  is_active: true
};

export const CustomersPanel: React.FC = () => {
  const { customers, customersLoading, createCustomer, updateCustomer, deleteCustomer } = useMaestros();
  const { currentCompany } = useERPContext();
  const companyId = currentCompany?.id;

  const [erpCustomers, setErpCustomers] = useState<CustomerListItem[]>([]);
  const [erpCustomersLoading, setErpCustomersLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState('general');

  const [formData, setFormData] = useState<CustomerFormData>(emptyFormData);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);

  // Fetch ERP customers
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

        setErpCustomers((data || []).map((c: any) => ({
          id: c.id,
          code: (c.code || '').trim() || '-',
          legal_name: c.legal_name || c.name || '-',
          trade_name: null,
          tax_id: c.tax_id || null,
          email: c.email || null,
          phone: c.phone || null,
          is_active: c.is_active ?? true,
          source: 'erp_customers' as const,
        })));
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

  // Combine customers
  const customerItems: CustomerListItem[] = useMemo(() => [
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
  ], [customers, erpCustomers]);

  // Stats
  const stats = useMemo(() => ({
    total: customerItems.length,
    active: customerItems.filter(c => c.is_active).length,
    inactive: customerItems.filter(c => !c.is_active).length,
    erp: erpCustomers.length
  }), [customerItems, erpCustomers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customerItems.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        c.legal_name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.tax_id?.toLowerCase().includes(q) ?? false);
      const matchesActive = showInactive || c.is_active;
      return matchesSearch && matchesActive;
    });
  }, [customerItems, search, showInactive]);

  // Load customer details
  const loadCustomerDetails = useCallback(async (customerId: string) => {
    const [addressRes, contactRes] = await Promise.all([
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_default', { ascending: false }),
      supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .order('is_primary', { ascending: false })
    ]);

    setAddresses((addressRes.data as CustomerAddress[]) || []);
    setContacts((contactRes.data as CustomerContact[]) || []);
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      loadCustomerDetails(selectedCustomer.id);
    }
  }, [selectedCustomer?.id, loadCustomerDetails]);

  const openNewDialog = () => {
    setSelectedCustomer(null);
    setFormData(emptyFormData);
    setAddresses([]);
    setContacts([]);
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
      toast.error('Error al eliminar cliente ERP');
      return;
    }

    toast.success('Cliente ERP eliminado');
    // Refresh ERP list
    if (companyId) {
      const { data } = await supabase
        .from('erp_customers')
        .select('id, code, name, legal_name, tax_id, email, phone, is_active')
        .eq('company_id', companyId)
        .order('name');

      setErpCustomers((data || []).map((c: any) => ({
        id: c.id,
        code: (c.code || '').trim() || '-',
        legal_name: c.legal_name || c.name || '-',
        trade_name: null,
        tax_id: c.tax_id || null,
        email: c.email || null,
        phone: c.phone || null,
        is_active: c.is_active ?? true,
        source: 'erp_customers' as const,
      })));
    }
  };

  const handleRefreshDetails = useCallback(() => {
    if (selectedCustomer) {
      loadCustomerDetails(selectedCustomer.id);
    }
  }, [selectedCustomer, loadCustomerDetails]);

  // Table columns
  const columns: Column<CustomerListItem>[] = [
    { 
      key: 'code', 
      header: 'Código', 
      sortable: true,
      className: 'w-[100px]',
      accessor: (c) => <span className="font-mono text-sm">{c.code || '-'}</span>
    },
    { 
      key: 'legal_name', 
      header: 'Nombre', 
      sortable: true,
      accessor: (c) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{c.legal_name}</p>
            {c.source === 'erp_customers' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ERP</Badge>
            )}
          </div>
          {c.trade_name && (
            <p className="text-xs text-muted-foreground">{c.trade_name}</p>
          )}
        </div>
      )
    },
    { 
      key: 'tax_id', 
      header: 'CIF/NIF',
      accessor: (c) => <span className="font-mono text-sm">{c.tax_id || '-'}</span>
    },
    { 
      key: 'email', 
      header: 'Email',
      accessor: (c) => <span className="text-sm">{c.email || '-'}</span>
    },
    { 
      key: 'phone', 
      header: 'Teléfono',
      accessor: (c) => <span className="text-sm">{c.phone || '-'}</span>
    },
    { 
      key: 'is_active', 
      header: 'Estado',
      accessor: (c) => <StatusBadge status={c.is_active} />
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <StatsCard label="Total" value={stats.total} icon={<Users className="h-4 w-4" />} />
            <StatsCard label="Activos" value={stats.active} icon={<CheckCircle className="h-4 w-4" />} iconBgColor="bg-green-100 dark:bg-green-900/30" iconColor="text-green-600" />
            <StatsCard label="Inactivos" value={stats.inactive} icon={<XCircle className="h-4 w-4" />} iconBgColor="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600" />
            <StatsCard label="ERP" value={stats.erp} icon={<Building2 className="h-4 w-4" />} iconBgColor="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600" />
          </div>

          {/* Filters */}
          <SearchFilters
            search={search}
            onSearchChange={setSearch}
            placeholder="Buscar por nombre, código o CIF..."
            filters={[
              {
                key: 'showInactive',
                label: 'Mostrar inactivos',
                type: 'switch',
                defaultValue: false
              }
            ]}
            filterValues={{ showInactive }}
            onFilterChange={(key, value) => {
              if (key === 'showInactive') setShowInactive(value as boolean);
            }}
          />
        </CardHeader>

        <CardContent>
          <DataTable
            data={filteredCustomers}
            columns={columns}
            loading={customersLoading || erpCustomersLoading}
            emptyIcon={<Users className="h-12 w-12" />}
            emptyMessage="No hay clientes"
            emptyDescription={search ? 'que coincidan con la búsqueda' : 'Crea tu primer cliente'}
            onRowClick={(c) => {
              if (c.source === 'customers') {
                const full = customers.find((cust) => cust.id === c.id);
                if (full) openEditDialog(full);
              }
            }}
            rowActions={(c) => (
              <div className="flex justify-end gap-1">
                {c.source === 'customers' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const full = customers.find((cust) => cust.id === c.id);
                      if (full) openEditDialog(full);
                    }}
                  >
                    <Building2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c);
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      {/* Dialog */}
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

            <TabsContent value="general" className="mt-4">
              <CustomerGeneralForm
                formData={formData}
                onChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
                isEditing={!!selectedCustomer}
                isPending={createCustomer.isPending || updateCustomer.isPending}
              />
            </TabsContent>

            <TabsContent value="addresses" className="mt-4">
              {selectedCustomer && (
                <CustomerAddressesTab
                  customerId={selectedCustomer.id}
                  addresses={addresses}
                  onRefresh={handleRefreshDetails}
                />
              )}
            </TabsContent>

            <TabsContent value="contacts" className="mt-4">
              {selectedCustomer && (
                <CustomerContactsTab
                  customerId={selectedCustomer.id}
                  contacts={contacts}
                  onRefresh={handleRefreshDetails}
                />
              )}
            </TabsContent>

            <TabsContent value="credit" className="mt-4">
              {selectedCustomer && (
                <CustomerCreditTab customerId={selectedCustomer.id} />
              )}
            </TabsContent>

            <TabsContent value="shipping" className="mt-4">
              {selectedCustomer && (
                <CustomerShippingTab customerId={selectedCustomer.id} />
              )}
            </TabsContent>

            <TabsContent value="audit" className="mt-4">
              {selectedCustomer && (
                <CustomerAuditFeed entityId={selectedCustomer.id} entityType="customer" />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CustomersPanel;
