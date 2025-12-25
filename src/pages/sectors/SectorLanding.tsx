import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShoppingCart, 
  HardHat, 
  Stethoscope, 
  Truck, 
  Factory, 
  GraduationCap,
  Landmark,
  Shield,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Users,
  Building2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import StoreNavbar from '@/components/store/StoreNavbar';
import UnifiedFooter from '@/components/layout/UnifiedFooter';

interface SectorCardData {
  icon: React.ElementType;
  title: string;
  description: string;
  features: string[];
  link?: string;
  available: boolean;
  gradient: string;
  iconBg: string;
}

const sectors: SectorCardData[] = [
  {
    icon: ShoppingCart,
    title: "Retail y eCommerce",
    description: "Gestión integral de tiendas físicas y online con sincronización en tiempo real.",
    features: [
      "Punto de venta (TPV) integrado",
      "Sincronización de stock multi-canal",
      "Integración con marketplaces",
      "Gestión de promociones y fidelización",
      "Analytics de ventas en tiempo real"
    ],
    link: "/verticals/retail",
    available: true,
    gradient: "from-orange-500/20 to-amber-500/20",
    iconBg: "bg-gradient-to-br from-orange-500 to-amber-500"
  },
  {
    icon: HardHat,
    title: "Construcción e Ingeniería",
    description: "Control total de proyectos, certificaciones y costes de obra.",
    features: [
      "Gestión de proyectos y obras",
      "Certificaciones automáticas",
      "Control de costes y márgenes",
      "Planificación de recursos",
      "Gestión de subcontratas"
    ],
    link: "/verticals/construction",
    available: true,
    gradient: "from-yellow-500/20 to-orange-500/20",
    iconBg: "bg-gradient-to-br from-yellow-500 to-orange-500"
  },
  {
    icon: Stethoscope,
    title: "Salud y Clínicas",
    description: "Agenda médica, historia clínica electrónica y facturación sanitaria.",
    features: [
      "Agenda médica inteligente",
      "Historia clínica electrónica (HCE)",
      "Facturación a aseguradoras",
      "Cumplimiento RGPD sanitario",
      "Telemedicina integrada"
    ],
    link: "/verticals/healthcare",
    available: true,
    gradient: "from-red-500/20 to-pink-500/20",
    iconBg: "bg-gradient-to-br from-red-500 to-pink-500"
  },
  {
    icon: Truck,
    title: "Logística y Distribución",
    description: "Multi-almacén, rutas optimizadas, picking y trazabilidad completa.",
    features: [
      "Gestión multi-almacén",
      "Optimización de rutas",
      "Picking y preparación de pedidos",
      "Trazabilidad por lotes",
      "Integración con transportistas"
    ],
    link: "/verticals/logistics",
    available: true,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500"
  },
  {
    icon: Landmark,
    title: "Banca y Finanzas",
    description: "Gestión de carteras, cumplimiento normativo y análisis de riesgo con IA.",
    features: [
      "Cumplimiento DORA",
      "Gestión de Mora inteligente",
      "KYC Automatizado",
      "Reporting EBA",
      "Análisis de riesgo predictivo"
    ],
    link: "/sectores/banca",
    available: true,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500"
  },
  {
    icon: Shield,
    title: "Seguros",
    description: "Gestión de pólizas, siniestros y cumplimiento con Solvencia II.",
    features: [
      "Cumplimiento Solvencia II",
      "Gestión de siniestros",
      "Pricing dinámico con IA",
      "Detección de fraude",
      "Portal del asegurado"
    ],
    link: "/sectores/seguros",
    available: true,
    gradient: "from-purple-500/20 to-indigo-500/20",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500"
  },
  {
    icon: Factory,
    title: "Fabricación e Industria",
    description: "MRP, listas de materiales, órdenes de producción y mantenimiento preventivo.",
    features: [
      "Planificación MRP avanzada",
      "Listas de materiales (BOM)",
      "Órdenes de producción",
      "Mantenimiento preventivo",
      "Control de calidad"
    ],
    link: "/sectores/manufactura",
    available: true,
    gradient: "from-purple-500/20 to-indigo-500/20",
    iconBg: "bg-gradient-to-br from-purple-500 to-indigo-500"
  },
  {
    icon: GraduationCap,
    title: "Educación y ONGs",
    description: "Gestión de estudiantes, voluntarios, donaciones y cumplimiento de objetivos.",
    features: [
      "Gestión de alumnos/voluntarios",
      "Programación académica",
      "Control de donaciones",
      "Certificados fiscales automáticos",
      "Reporting de impacto social"
    ],
    link: "/sectores/educacion",
    available: true,
    gradient: "from-teal-500/20 to-cyan-500/20",
    iconBg: "bg-gradient-to-br from-teal-500 to-cyan-500"
  }
];

const stats = [
  { icon: Building2, value: "8+", label: "Verticales Sectoriales" },
  { icon: Sparkles, value: "50+", label: "Módulos Especializados" },
  { icon: Users, value: "500+", label: "Empresas Implementadas" },
  { icon: Globe, value: "15+", label: "Países Activos" }
];

const SectorCard: React.FC<{ sector: SectorCardData; index: number }> = ({ sector, index }) => {
  const Icon = sector.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative group h-full`}
    >
      <div className={`
        relative h-full rounded-2xl p-6 
        bg-gradient-to-br ${sector.gradient}
        backdrop-blur-xl border border-white/10
        transition-all duration-500
        hover:border-white/20 hover:shadow-2xl hover:shadow-white/5
        hover:-translate-y-2
        ${!sector.available ? 'opacity-75' : ''}
      `}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badge */}
        {!sector.available && (
          <div className="absolute -top-3 -right-3 z-10">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/30 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Próximamente
            </Badge>
          </div>
        )}
        
        {sector.available && (
          <div className="absolute -top-3 -right-3 z-10">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/30 px-3 py-1">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Disponible
            </Badge>
          </div>
        )}

        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-xl ${sector.iconBg}
          flex items-center justify-center mb-4
          shadow-lg transform group-hover:scale-110 transition-transform duration-300
        `}>
          <Icon className="w-7 h-7 text-white" />
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white/90">
          {sector.title}
        </h3>
        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
          {sector.description}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-6">
          {sector.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {sector.available && sector.link ? (
          <Link to={sector.link} className="inline-block w-full">
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white hover:bg-white/10 group/btn"
            >
              Ver Demo
              <ArrowRight className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        ) : (
          <Button 
            variant="outline" 
            disabled
            className="w-full border-white/10 text-slate-500 cursor-not-allowed"
          >
            Próximamente
          </Button>
        )}
      </div>
    </motion.div>
  );
};

const SectorLanding: React.FC = () => {
  const { trackPageView } = useMarketingAnalytics();

  useEffect(() => {
    trackPageView('sectors');
  }, [trackPageView]);

  return (
    <>
      <StoreNavbar />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden pt-20">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Back Link */}
        <Link 
          to="/store" 
          className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" />
          Volver a Store
        </Link>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-emerald-300 border-emerald-500/30 px-4 py-2 text-sm">
              <Sparkles className="w-4 h-4 mr-2 inline" />
              EXPERIENCIA MULTISECTORIAL
            </Badge>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Soluciones que
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Transforman Sectores
            </span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            ObelixIA ofrece soluciones ERP+CRM adaptadas a las necesidades específicas de cada industria,
            con <span className="text-emerald-400 font-medium">cumplimiento normativo integrado</span> y 
            <span className="text-blue-400 font-medium"> herramientas de IA especializadas</span>.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="relative group"
            >
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-all duration-300">
                <stat.icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Sectors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
          {sectors.map((sector, index) => (
            <SectorCard key={sector.title} sector={sector} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative"
        >
          <div className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ¿No encuentras tu sector?
            </h2>
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Nuestro equipo de expertos puede configurar ObelixIA para adaptarse perfectamente 
              a las necesidades específicas de tu industria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/demo">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg shadow-emerald-500/30 px-8"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Solicitar Demo Personalizada
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 px-8"
                >
                  Contactar con Ventas
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
      <UnifiedFooter />
    </div>
    </>
  );
};

export default SectorLanding;
