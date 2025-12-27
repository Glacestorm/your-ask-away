import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, 
  X, 
  Sparkles, 
  BarChart3,
  Calculator,
  Layers,
  ArrowRight,
  Building2,
  Users,
  Shield,
  Database,
  FileText,
  MapPin,
  Package,
  CreditCard,
  Truck,
  Factory,
  Star,
  Crown,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta } from '@/hooks/useSEOMeta';
import { SystemArchitectureDiagram } from '@/components/documentation/SystemArchitectureDiagram';

interface PackageOption {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  monthlyPrice: number;
  annualPrice: number;
  perpetualPrice: number;
  coreModules: string[];
  additionalModules: string[];
  highlights: string[];
  popular?: boolean;
  bestValue?: boolean;
}

const packages: PackageOption[] = [
  {
    id: 'crm-only',
    name: 'Solo CRM',
    tagline: 'Gestión comercial completa',
    description: 'Ideal para equipos de ventas que necesitan gestionar clientes, oportunidades y visitas comerciales.',
    icon: <BarChart3 className="h-8 w-8" />,
    color: 'text-emerald-500',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    monthlyPrice: 99,
    annualPrice: 79,
    perpetualPrice: 1990,
    coreModules: [
      'Gestión de Empresas',
      'Gestión de Contactos',
      'Usuarios y Roles',
      'Configuración Base',
    ],
    additionalModules: [
      'Pipeline de Ventas',
      'Gestión de Visitas',
      'Documentación',
      'Objetivos y KPIs',
      'Notificaciones',
      'GIS Territorial',
    ],
    highlights: [
      'Hasta 50 usuarios',
      'Pipeline visual de ventas',
      'Geolocalización de visitas',
      'Informes comerciales',
      'App móvil incluida',
    ],
  },
  {
    id: 'erp-only',
    name: 'Solo ERP',
    tagline: 'Operaciones y finanzas',
    description: 'Para empresas que necesitan control financiero, inventario y gestión de operaciones.',
    icon: <Calculator className="h-8 w-8" />,
    color: 'text-purple-500',
    bgGradient: 'from-purple-500/20 to-purple-600/10',
    monthlyPrice: 149,
    annualPrice: 119,
    perpetualPrice: 2990,
    coreModules: [
      'Gestión de Empresas',
      'Gestión de Contactos',
      'Usuarios y Roles',
      'Configuración Base',
    ],
    additionalModules: [
      'Contabilidad PGC',
      'Facturación Electrónica',
      'Gestión de Inventario',
      'Compras y Proveedores',
      'Logística',
      'Producción',
      'Tesorería',
    ],
    highlights: [
      'Hasta 50 usuarios',
      'Contabilidad completa PGC',
      'Factura electrónica TicketBAI/Verifactu',
      'Control de stock multinivel',
      'Reporting financiero',
    ],
  },
  {
    id: 'suite-complete',
    name: 'Suite Completa',
    tagline: 'CRM + ERP unificados',
    description: 'La solución integral que conecta ventas, operaciones y finanzas en una única plataforma.',
    icon: <Layers className="h-8 w-8" />,
    color: 'text-blue-500',
    bgGradient: 'from-blue-500/20 via-primary/10 to-purple-500/20',
    monthlyPrice: 199,
    annualPrice: 159,
    perpetualPrice: 3990,
    popular: true,
    bestValue: true,
    coreModules: [
      'Gestión de Empresas',
      'Gestión de Contactos',
      'Usuarios y Roles',
      'Configuración Base',
    ],
    additionalModules: [
      // CRM
      'Pipeline de Ventas',
      'Gestión de Visitas',
      'Documentación',
      'Objetivos y KPIs',
      // ERP
      'Contabilidad PGC',
      'Facturación Electrónica',
      'Gestión de Inventario',
      'Compras y Proveedores',
      'Logística',
      'Producción',
      // Premium
      'IA Predictiva',
      'Business Intelligence',
      'GIS Avanzado',
      'Compliance Suite',
    ],
    highlights: [
      'Hasta 100 usuarios',
      'CRM + ERP integrados',
      'IA y Machine Learning',
      'Compliance GDPR/DORA',
      'API completa',
      'Soporte prioritario 24/7',
    ],
  },
];

const moduleIcons: Record<string, React.ReactNode> = {
  'Gestión de Empresas': <Building2 className="h-4 w-4" />,
  'Gestión de Contactos': <Users className="h-4 w-4" />,
  'Usuarios y Roles': <Shield className="h-4 w-4" />,
  'Configuración Base': <Database className="h-4 w-4" />,
  'Pipeline de Ventas': <BarChart3 className="h-4 w-4" />,
  'Gestión de Visitas': <MapPin className="h-4 w-4" />,
  'Documentación': <FileText className="h-4 w-4" />,
  'Contabilidad PGC': <Calculator className="h-4 w-4" />,
  'Facturación Electrónica': <CreditCard className="h-4 w-4" />,
  'Gestión de Inventario': <Package className="h-4 w-4" />,
  'Logística': <Truck className="h-4 w-4" />,
  'Producción': <Factory className="h-4 w-4" />,
};

export default function PackagesComparisonPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual' | 'perpetual'>('annual');

  useSEOMeta({
    title: 'Paquetes CRM y ERP - Comparativa de Soluciones',
    description: 'Compara nuestros paquetes: Solo CRM, Solo ERP o Suite Completa. Elige la solución que mejor se adapte a tu negocio.',
    keywords: 'paquetes CRM ERP, comparativa software empresarial, suite empresarial, CRM vs ERP',
  });

  const getPrice = (pkg: PackageOption) => {
    switch (billingCycle) {
      case 'monthly': return pkg.monthlyPrice;
      case 'annual': return pkg.annualPrice;
      case 'perpetual': return pkg.perpetualPrice;
    }
  };

  const getSavings = (pkg: PackageOption) => {
    if (billingCycle !== 'annual') return null;
    return Math.round(((pkg.monthlyPrice - pkg.annualPrice) / pkg.monthlyPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            <Sparkles className="h-3 w-3 mr-1" />
            Arquitectura Modular
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            Elige tu Paquete Ideal
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Todos los paquetes comparten el mismo <strong>Core Sistema</strong>: 
            gestión de empresas, contactos y configuración base. 
            Añade los módulos que necesites.
          </p>
        </motion.div>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <SystemArchitectureDiagram />
        </motion.div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as typeof billingCycle)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="monthly">Mensual</TabsTrigger>
              <TabsTrigger value="annual" className="relative">
                Anual
                <Badge className="absolute -top-3 -right-2 text-xs bg-green-500">-20%</Badge>
              </TabsTrigger>
              <TabsTrigger value="perpetual">Perpetuo</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Package Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="relative"
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Más Popular
                  </Badge>
                </div>
              )}
              {pkg.bestValue && (
                <div className="absolute -top-4 right-4 z-10">
                  <Badge className="bg-green-500 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    Mejor Valor
                  </Badge>
                </div>
              )}
              
              <Card className={`h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl ${
                pkg.popular ? 'border-2 border-primary ring-2 ring-primary/20 scale-105' : ''
              }`}>
                <CardHeader className={`bg-gradient-to-br ${pkg.bgGradient} pb-6`}>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4 shadow-lg ${pkg.color}`}>
                    {pkg.icon}
                  </div>
                  <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                  <CardDescription className="text-base">{pkg.tagline}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 pt-6">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{getPrice(pkg)}</span>
                      <span className="text-muted-foreground">
                        €{billingCycle === 'perpetual' ? '' : '/mes'}
                      </span>
                    </div>
                    {getSavings(pkg) && (
                      <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-600">
                        Ahorras {getSavings(pkg)}% anualmente
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-6">
                    {pkg.description}
                  </p>

                  {/* Core Modules */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Core Sistema (Incluido)
                    </p>
                    <div className="space-y-1.5">
                      {pkg.coreModules.map((module) => (
                        <div key={module} className="flex items-center gap-2 text-sm">
                          <div className="p-1 rounded bg-blue-500/10 text-blue-500">
                            {moduleIcons[module] || <Check className="h-4 w-4" />}
                          </div>
                          <span>{module}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional Modules */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Módulos Adicionales
                    </p>
                    <div className="space-y-1.5">
                      {pkg.additionalModules.slice(0, 6).map((module) => (
                        <div key={module} className="flex items-center gap-2 text-sm">
                          <Check className={`h-4 w-4 ${pkg.color}`} />
                          <span>{module}</span>
                        </div>
                      ))}
                      {pkg.additionalModules.length > 6 && (
                        <p className="text-sm text-muted-foreground pl-6">
                          +{pkg.additionalModules.length - 6} módulos más...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Destacados
                    </p>
                    <div className="space-y-1.5">
                      {pkg.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-center gap-2 text-sm">
                          <Sparkles className="h-3 w-3 text-amber-500" />
                          <span className="font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-6 border-t">
                  <Button 
                    className="w-full" 
                    size="lg"
                    variant={pkg.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/demo">
                      Solicitar Demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold text-center mb-8">Comparativa Detallada</h2>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Característica</th>
                    <th className="text-center py-3 px-4 font-medium text-emerald-600">Solo CRM</th>
                    <th className="text-center py-3 px-4 font-medium text-purple-600">Solo ERP</th>
                    <th className="text-center py-3 px-4 font-medium text-blue-600">Suite Completa</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Core Sistema', values: [true, true, true] },
                    { name: 'Gestión de Empresas', values: [true, true, true] },
                    { name: 'Gestión de Contactos', values: [true, true, true] },
                    { name: 'Pipeline de Ventas', values: [true, false, true] },
                    { name: 'Gestión de Visitas', values: [true, false, true] },
                    { name: 'GIS Territorial', values: [true, false, true] },
                    { name: 'Contabilidad PGC', values: [false, true, true] },
                    { name: 'Facturación Electrónica', values: [false, true, true] },
                    { name: 'Inventario', values: [false, true, true] },
                    { name: 'Compras', values: [false, true, true] },
                    { name: 'Logística', values: [false, true, true] },
                    { name: 'Producción', values: [false, true, true] },
                    { name: 'IA Predictiva', values: [false, false, true] },
                    { name: 'Business Intelligence', values: [false, false, true] },
                    { name: 'Compliance Suite', values: [false, false, true] },
                    { name: 'API Full Access', values: [false, false, true] },
                    { name: 'Usuarios máx.', values: ['50', '50', '100'] },
                    { name: 'Soporte', values: ['Email', 'Email', '24/7'] },
                  ].map((row, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{row.name}</td>
                      {row.values.map((value, j) => (
                        <td key={j} className="text-center py-3 px-4">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                            )
                          ) : (
                            <span>{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-blue-600 via-primary to-purple-600 text-white p-8 max-w-2xl mx-auto">
            <CardContent className="space-y-4">
              <Crown className="h-12 w-12 mx-auto opacity-80" />
              <h3 className="text-2xl font-bold">¿Necesitas una solución Enterprise?</h3>
              <p className="opacity-90">
                Para grandes organizaciones ofrecemos soluciones personalizadas con usuarios ilimitados, 
                SLA garantizado y soporte dedicado.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/contacto">Contactar Ventas</Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border-white hover:bg-white hover:text-primary" asChild>
                  <Link to="/store/calculator">Usar Calculadora</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
