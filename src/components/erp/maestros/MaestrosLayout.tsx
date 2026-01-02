/**
 * Layout principal para el módulo Maestros
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Plus,
  RefreshCw,
  MapPin,
  FileCheck
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

interface MaestrosLayoutProps {
  companyId?: string;
}

export const MaestrosLayout: React.FC<MaestrosLayoutProps> = ({ companyId }) => {
  const { currentCompany } = useERPContext();
  const { 
    customers, 
    suppliers, 
    items, 
    taxes, 
    paymentTerms, 
    warehouses,
    seedDefaultData 
  } = useMaestros();

  if (!currentCompany) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Selecciona una empresa para gestionar los maestros
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Maestros</h2>
          <p className="text-muted-foreground">
            Gestión de clientes, proveedores, artículos y configuración
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={seedDefaultData}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Cargar datos iniciales
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customers.length}</p>
                <p className="text-xs text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Truck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-xs text-muted-foreground">Proveedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Artículos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{taxes.length}</p>
                <p className="text-xs text-muted-foreground">Impuestos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Wallet className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paymentTerms.length}</p>
                <p className="text-xs text-muted-foreground">Cond. Pago</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Warehouse className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{warehouses.length}</p>
                <p className="text-xs text-muted-foreground">Almacenes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="customers" className="gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-1">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Proveedores</span>
          </TabsTrigger>
          <TabsTrigger value="items" className="gap-1">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Artículos</span>
          </TabsTrigger>
          <TabsTrigger value="taxes" className="gap-1">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Impuestos</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-1">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Cond. Pago</span>
          </TabsTrigger>
          <TabsTrigger value="warehouses" className="gap-1">
            <Warehouse className="h-4 w-4" />
            <span className="hidden sm:inline">Almacenes</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="gap-1">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Ubicaciones</span>
          </TabsTrigger>
          <TabsTrigger value="banks" className="gap-1">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Bancos</span>
          </TabsTrigger>
          <TabsTrigger value="sepa" className="gap-1">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">SEPA</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Precios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomersPanel />
        </TabsContent>

        <TabsContent value="suppliers">
          <SuppliersPanel />
        </TabsContent>

        <TabsContent value="items">
          <ItemsPanel />
        </TabsContent>

        <TabsContent value="taxes">
          <TaxesPanel />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentTermsPanel />
        </TabsContent>

        <TabsContent value="warehouses">
          <WarehousesPanel />
        </TabsContent>

        <TabsContent value="locations">
          <WarehouseLocationsPanel />
        </TabsContent>

        <TabsContent value="banks">
          <BankAccountsPanel />
        </TabsContent>

        <TabsContent value="sepa">
          <SEPAMandatesPanel />
        </TabsContent>

        <TabsContent value="pricing">
          <PriceSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaestrosLayout;
