/**
 * Dashboard Principal del ERP Modular
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2,
  Calendar,
  Hash,
  Shield,
  History,
  Settings,
  Users,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Calculator,
  Wallet,
  Receipt,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useERPContext, ERPProvider } from '@/hooks/erp/useERPContext';
import { ERPCompanySelector } from './config/ERPCompanySelector';
import { ERPCompaniesManager } from './config/ERPCompaniesManager';
import { ERPFiscalYearsManager } from './config/ERPFiscalYearsManager';
import { ERPSeriesManager } from './config/ERPSeriesManager';
import { ERPRolesManager } from './config/ERPRolesManager';
import { ERPAuditViewer } from './audit/ERPAuditViewer';
import { cn } from '@/lib/utils';

function ERPModularDashboardContent() {
  const { currentCompany, userPermissions, isLoading, error, hasPermission } = useERPContext();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando ERP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium">Error al cargar ERP</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const modules = [
    { id: 'masters', name: 'Maestros', icon: Users, permission: 'masters.read', color: 'bg-blue-500' },
    { id: 'sales', name: 'Ventas', icon: ShoppingCart, permission: 'sales.read', color: 'bg-green-500' },
    { id: 'purchases', name: 'Compras', icon: Package, permission: 'purchases.read', color: 'bg-orange-500' },
    { id: 'inventory', name: 'Almacén', icon: Package, permission: 'inventory.read', color: 'bg-purple-500' },
    { id: 'accounting', name: 'Contabilidad', icon: Calculator, permission: 'accounting.read', color: 'bg-cyan-500' },
    { id: 'treasury', name: 'Tesorería', icon: Wallet, permission: 'treasury.read', color: 'bg-yellow-500' },
    { id: 'tax', name: 'Fiscal', icon: Receipt, permission: 'tax.read', color: 'bg-red-500' },
  ];

  const availableModules = modules.filter(m => hasPermission(m.permission));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ERP Modular</h1>
          <p className="text-muted-foreground">
            Sistema de gestión empresarial multi-tenant
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ERPCompanySelector />
          {currentCompany && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {currentCompany.currency}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          {hasPermission('admin.all') && (
            <>
              <TabsTrigger value="companies" className="gap-2">
                <Building2 className="h-4 w-4" />
                Empresas
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Shield className="h-4 w-4" />
                Roles
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="fiscal" className="gap-2">
            <Calendar className="h-4 w-4" />
            Ejercicios
          </TabsTrigger>
          <TabsTrigger value="series" className="gap-2">
            <Hash className="h-4 w-4" />
            Series
          </TabsTrigger>
          {hasPermission('admin.all') && (
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              Auditoría
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {!currentCompany ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No tienes empresas asignadas. Contacta al administrador.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {currentCompany.name}
                  </CardTitle>
                  <CardDescription>
                    {currentCompany.legal_name || 'Empresa activa'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">CIF/NIF</p>
                      <p className="font-medium">{currentCompany.tax_id || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">País</p>
                      <p className="font-medium">{currentCompany.country}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Moneda</p>
                      <p className="font-medium">{currentCompany.currency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Zona Horaria</p>
                      <p className="font-medium">{currentCompany.timezone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modules Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Módulos Disponibles</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {availableModules.map((module) => {
                    const Icon = module.icon;
                    return (
                      <Card 
                        key={module.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4 text-center">
                          <div className={cn("w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center", module.color)}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <p className="font-medium text-sm">{module.name}</p>
                          <Badge variant="outline" className="mt-2 text-xs">
                            Próximamente
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Permissions Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4" />
                    Tus Permisos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userPermissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin permisos asignados</p>
                    ) : (
                      userPermissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm}
                        </Badge>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies">
          <ERPCompaniesManager />
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles">
          <ERPRolesManager />
        </TabsContent>

        {/* Fiscal Years Tab */}
        <TabsContent value="fiscal">
          <ERPFiscalYearsManager />
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value="series">
          <ERPSeriesManager />
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <ERPAuditViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ERPModularDashboard() {
  return (
    <ERPProvider>
      <ERPModularDashboardContent />
    </ERPProvider>
  );
}

export default ERPModularDashboard;
