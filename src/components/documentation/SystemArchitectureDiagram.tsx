import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Settings, 
  Database,
  BarChart3,
  FileText,
  Calculator,
  MapPin,
  Package,
  CreditCard,
  ShoppingCart,
  Truck,
  Factory,
  Shield,
  Layers,
  ArrowDown,
  ArrowRight
} from 'lucide-react';

interface ModuleBlock {
  name: string;
  icon: React.ReactNode;
  color: string;
}

const coreModules: ModuleBlock[] = [
  { name: 'Gestión Empresas', icon: <Building2 className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
  { name: 'Contactos', icon: <Users className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
  { name: 'Usuarios & Roles', icon: <Shield className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
  { name: 'Configuración', icon: <Settings className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
];

const crmModules: ModuleBlock[] = [
  { name: 'Pipeline Ventas', icon: <BarChart3 className="h-4 w-4" />, color: 'from-emerald-500 to-emerald-600' },
  { name: 'Visitas', icon: <MapPin className="h-4 w-4" />, color: 'from-emerald-500 to-emerald-600' },
  { name: 'Documentación', icon: <FileText className="h-4 w-4" />, color: 'from-emerald-500 to-emerald-600' },
  { name: 'Objetivos', icon: <BarChart3 className="h-4 w-4" />, color: 'from-emerald-500 to-emerald-600' },
];

const erpModules: ModuleBlock[] = [
  { name: 'Contabilidad', icon: <Calculator className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { name: 'Facturación', icon: <CreditCard className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { name: 'Inventario', icon: <Package className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { name: 'Compras', icon: <ShoppingCart className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { name: 'Logística', icon: <Truck className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
  { name: 'Producción', icon: <Factory className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
];

const ModuleBlockComponent: React.FC<{ module: ModuleBlock; delay?: number }> = ({ module, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.3 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${module.color} text-white text-sm font-medium shadow-md`}
  >
    {module.icon}
    <span>{module.name}</span>
  </motion.div>
);

export const SystemArchitectureDiagram: React.FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Arquitectura del Sistema</CardTitle>
              <p className="text-sm text-white/70">Core Sistema como fundamento unificado para CRM y ERP</p>
            </div>
          </div>
          <Badge className="bg-blue-500 text-white">v2.0</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="space-y-8">
          {/* CRM Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Módulos CRM</h3>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">Ventas & Relaciones</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
              {crmModules.map((module, i) => (
                <ModuleBlockComponent key={module.name} module={module} delay={i * 0.1} />
              ))}
            </div>
          </motion.div>

          {/* Arrows Down */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <ArrowDown className="h-6 w-6 text-muted-foreground animate-bounce" />
              <span className="text-xs text-muted-foreground">Depende de</span>
            </motion.div>
          </div>

          {/* Core Sistema */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-primary/20 to-blue-500/20 rounded-2xl blur-xl" />
            <div className="relative p-6 rounded-2xl border-4 border-blue-500 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-primary">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Core Sistema</h2>
                  <p className="text-blue-300 text-sm">Fundamento unificado para CRM y ERP</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {coreModules.map((module, i) => (
                  <ModuleBlockComponent key={module.name} module={module} delay={0.5 + i * 0.1} />
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span>Base de datos unificada • Autenticación centralizada • Configuración global</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrows Down */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <ArrowDown className="h-6 w-6 text-muted-foreground animate-bounce" />
              <span className="text-xs text-muted-foreground">Depende de</span>
            </motion.div>
          </div>

          {/* ERP Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calculator className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">Módulos ERP</h3>
              <Badge variant="outline" className="border-purple-500 text-purple-600">Operaciones & Finanzas</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
              {erpModules.map((module, i) => (
                <ModuleBlockComponent key={module.name} module={module} delay={0.8 + i * 0.1} />
              ))}
            </div>
          </motion.div>

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t"
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600" />
              <span className="text-sm text-muted-foreground">Core Sistema (Requerido)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-emerald-500 to-emerald-600" />
              <span className="text-sm text-muted-foreground">Módulos CRM (Opcionales)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600" />
              <span className="text-sm text-muted-foreground">Módulos ERP (Opcionales)</span>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemArchitectureDiagram;
