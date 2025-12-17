import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FileText, Euro, Package, Receipt, Settings, 
  BarChart3, Users, Shield 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { ContentManager } from '@/components/obelixia-admin/ContentManager';
import { ModulePricingManager } from '@/components/obelixia-admin/ModulePricingManager';
import { InvoiceManager } from '@/components/obelixia-admin/InvoiceManager';
import QuoteManager from '@/components/admin/quotes/QuoteManager';

const ObelixiaTeamAdmin: React.FC = () => {
  const { isSuperAdmin, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('quotes');

  // Solo accesible para admins y superadmins
  if (!isSuperAdmin && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const stats = [
    { label: 'Presupuestos Activos', value: '12', icon: FileText, color: 'text-blue-400' },
    { label: 'Facturas Pendientes', value: '5', icon: Receipt, color: 'text-amber-400' },
    { label: 'Módulos Activos', value: '9', icon: Package, color: 'text-emerald-400' },
    { label: 'Ingresos Mes', value: '€45,000', icon: Euro, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              ObelixIA Team Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestión interna de presupuestos, facturas, precios y contenidos
            </p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-card-foreground mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-10 h-10 ${stat.color} opacity-80`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Tabs */}
        <Card className="bg-card border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid grid-cols-4 w-full max-w-2xl">
                <TabsTrigger 
                  value="quotes" 
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Presupuestos
                </TabsTrigger>
                <TabsTrigger 
                  value="invoices"
                  className="flex items-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Facturas
                </TabsTrigger>
                <TabsTrigger 
                  value="pricing"
                  className="flex items-center gap-2"
                >
                  <Euro className="w-4 h-4" />
                  Precios
                </TabsTrigger>
                <TabsTrigger 
                  value="content"
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Contenidos
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="quotes" className="m-0">
                <QuoteManager />
              </TabsContent>

              <TabsContent value="invoices" className="m-0">
                <InvoiceManager />
              </TabsContent>

              <TabsContent value="pricing" className="m-0">
                <ModulePricingManager />
              </TabsContent>

              <TabsContent value="content" className="m-0">
                <ContentManager />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default ObelixiaTeamAdmin;
