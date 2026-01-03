/**
 * Layout principal mejorado para el módulo Maestros
 * Con mejor UX, animaciones y estadísticas
 */

import React, { useMemo, useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Truck, 
  Package, 
  Receipt, 
  Wallet,
  Warehouse,
  Calculator,
  CreditCard,
  Building2,
  Settings,
  MapPin,
  FileCheck,
  RefreshCw,
  Sparkles,
  Upload
} from 'lucide-react';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { useMaestros } from '@/hooks/erp/useMaestros';
import { CustomersPanel } from './CustomersPanel';
import { SuppliersPanel } from './SuppliersPanel';
import { ItemsPanel } from './ItemsPanel';
import { TaxesPanel } from './TaxesPanel';
import { PaymentTermsPanel } from './PaymentTermsPanel';
import { WarehousesPanel } from './WarehousesPanel';
import { WarehouseLocationsPanel } from './WarehouseLocationsPanel';
import { BankAccountsPanel } from './BankAccountsPanel';
import { SEPAMandatesPanel } from './SEPAMandatesPanel';
import { PriceSimulator } from './PriceSimulator';
import { MaestrosAIImportPanel } from './MaestrosAIImportPanel';
import { StatsCard } from './shared/StatsCard';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MaestrosLayoutProps {
  companyId?: string;
}

const tabs = [
  { key: 'customers', label: 'Clientes', icon: Users, color: 'text-blue-600' },
  { key: 'suppliers', label: 'Proveedores', icon: Truck, color: 'text-green-600' },
  { key: 'items', label: 'Artículos', icon: Package, color: 'text-purple-600' },
  { key: 'taxes', label: 'Impuestos', icon: Receipt, color: 'text-orange-600' },
  { key: 'payment', label: 'Cond. Pago', icon: Wallet, color: 'text-cyan-600' },
  { key: 'warehouses', label: 'Almacenes', icon: Warehouse, color: 'text-amber-600' },
  { key: 'locations', label: 'Ubicaciones', icon: MapPin, color: 'text-rose-600' },
  { key: 'banks', label: 'Bancos', icon: CreditCard, color: 'text-indigo-600' },
  { key: 'sepa', label: 'SEPA', icon: FileCheck, color: 'text-teal-600' },
  { key: 'pricing', label: 'Precios', icon: Calculator, color: 'text-pink-600' },
];

export const MaestrosLayout: React.FC<MaestrosLayoutProps> = ({ companyId }) => {
  const { currentCompany } = useERPContext();
  const { 
    customers, 
    customersLoading,
    suppliers, 
    suppliersLoading,
    items, 
    itemsLoading,
    taxes, 
    taxesLoading,
    paymentTerms, 
    paymentTermsLoading,
    warehouses,
    warehousesLoading,
    seedDefaultData 
  } = useMaestros();

  const [activeTab, setActiveTab] = React.useState('customers');
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  const handleSeedData = useCallback(async () => {
    setIsSeeding(true);
    try {
      await seedDefaultData();
    } finally {
      setIsSeeding(false);
    }
  }, [seedDefaultData]);

  const stats = useMemo(() => [
    { 
      label: 'Clientes', 
      value: customers.length, 
      icon: <Users className="h-5 w-5" />,
      bgColor: 'bg-blue-500/10',
      color: 'text-blue-600',
      loading: customersLoading 
    },
    { 
      label: 'Proveedores', 
      value: suppliers.length, 
      icon: <Truck className="h-5 w-5" />,
      bgColor: 'bg-green-500/10',
      color: 'text-green-600',
      loading: suppliersLoading 
    },
    { 
      label: 'Artículos', 
      value: items.length, 
      icon: <Package className="h-5 w-5" />,
      bgColor: 'bg-purple-500/10',
      color: 'text-purple-600',
      loading: itemsLoading 
    },
    { 
      label: 'Impuestos', 
      value: taxes.length, 
      icon: <Receipt className="h-5 w-5" />,
      bgColor: 'bg-orange-500/10',
      color: 'text-orange-600',
      loading: taxesLoading 
    },
    { 
      label: 'Cond. Pago', 
      value: paymentTerms.length, 
      icon: <Wallet className="h-5 w-5" />,
      bgColor: 'bg-cyan-500/10',
      color: 'text-cyan-600',
      loading: paymentTermsLoading 
    },
    { 
      label: 'Almacenes', 
      value: warehouses.length, 
      icon: <Warehouse className="h-5 w-5" />,
      bgColor: 'bg-amber-500/10',
      color: 'text-amber-600',
      loading: warehousesLoading 
    },
  ], [customers, suppliers, items, taxes, paymentTerms, warehouses, 
      customersLoading, suppliersLoading, itemsLoading, taxesLoading, 
      paymentTermsLoading, warehousesLoading]);

  if (!currentCompany) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Selecciona una empresa para gestionar los maestros
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Maestros
          </h2>
          <p className="text-muted-foreground">
            Gestión de clientes, proveedores, artículos y configuración
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar con IA
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Importación Inteligente de Maestros
                </DialogTitle>
              </DialogHeader>
              <MaestrosAIImportPanel 
                onImportComplete={() => {
                  setShowImportDialog(false);
                  // Refresh data would be handled by the panel
                }}
              />
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSeedData}
            disabled={isSeeding}
            className="gap-2"
          >
            {isSeeding ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Cargar datos iniciales
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards with animations */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <StatsCard
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              iconBgColor={stat.bgColor}
              iconColor={stat.color}
              loading={stat.loading}
              onClick={() => {
                const tabKey = stat.label.toLowerCase().replace('. ', '-');
                const tab = tabs.find(t => 
                  t.label.toLowerCase() === stat.label.toLowerCase() ||
                  t.key === tabKey
                );
                if (tab) setActiveTab(tab.key);
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 h-auto p-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.key} 
                value={tab.key} 
                className="gap-1.5 py-2 data-[state=active]:shadow-sm"
              >
                <tab.icon className={cn("h-4 w-4", activeTab === tab.key && tab.color)} />
                <span className="hidden sm:inline text-xs">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <TabsContent value="customers" className="mt-0">
                <CustomersPanel />
              </TabsContent>

              <TabsContent value="suppliers" className="mt-0">
                <SuppliersPanel />
              </TabsContent>

              <TabsContent value="items" className="mt-0">
                <ItemsPanel />
              </TabsContent>

              <TabsContent value="taxes" className="mt-0">
                <TaxesPanel />
              </TabsContent>

              <TabsContent value="payment" className="mt-0">
                <PaymentTermsPanel />
              </TabsContent>

              <TabsContent value="warehouses" className="mt-0">
                <WarehousesPanel />
              </TabsContent>

              <TabsContent value="locations" className="mt-0">
                <WarehouseLocationsPanel />
              </TabsContent>

              <TabsContent value="banks" className="mt-0">
                <BankAccountsPanel />
              </TabsContent>

              <TabsContent value="sepa" className="mt-0">
                <SEPAMandatesPanel />
              </TabsContent>

              <TabsContent value="pricing" className="mt-0">
                <PriceSimulator />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MaestrosLayout;
