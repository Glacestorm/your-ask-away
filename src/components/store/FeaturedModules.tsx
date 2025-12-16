import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import ModuleCard from './ModuleCard';

interface Module {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  module_icon: string | null;
  base_price: number | null;
  category: string;
  is_core: boolean | null;
  features: any;
}

const FeaturedModules: React.FC = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .in('category', ['core', 'horizontal'])
        .limit(6);
      
      if (!error && data) {
        setModules(data);
      }
      setLoading(false);
    };

    fetchModules();
  }, []);

  const featuredModules = modules.length > 0 ? modules : [
    {
      id: '1',
      module_key: 'core',
      module_name: 'Core CRM',
      description: 'Gestión completa de clientes, empresas y contactos con seguimiento avanzado',
      module_icon: 'Building2',
      base_price: 50000,
      category: 'core',
      is_core: true,
      features: ['Gestión de empresas', 'Contactos', 'Pipeline', 'Informes'],
    },
    {
      id: '2',
      module_key: 'visits',
      module_name: 'Gestión de Visitas',
      description: 'Planificación y seguimiento de visitas comerciales con geolocalización',
      module_icon: 'MapPin',
      base_price: 30000,
      category: 'horizontal',
      is_core: false,
      features: ['Calendario', 'Rutas', 'Check-in/out', 'Informes'],
    },
    {
      id: '3',
      module_key: 'accounting',
      module_name: 'Contabilidad',
      description: 'Estados financieros, ratios y análisis contable completo',
      module_icon: 'Calculator',
      base_price: 60000,
      category: 'horizontal',
      is_core: false,
      features: ['Balance', 'PyG', 'Cash Flow', 'Ratios'],
    },
    {
      id: '4',
      module_key: 'goals',
      module_name: 'Objetivos',
      description: 'Definición y seguimiento de KPIs con dashboards en tiempo real',
      module_icon: 'Target',
      base_price: 25000,
      category: 'horizontal',
      is_core: false,
      features: ['KPIs', 'Dashboards', 'Alertas', 'Gamificación'],
    },
    {
      id: '5',
      module_key: 'documentation',
      module_name: 'Documentación',
      description: 'Gestión documental con versionado y firma electrónica',
      module_icon: 'FileText',
      base_price: 20000,
      category: 'horizontal',
      is_core: false,
      features: ['Versionado', 'Templates', 'Firma digital', 'OCR'],
    },
    {
      id: '6',
      module_key: 'notifications',
      module_name: 'Notificaciones',
      description: 'Sistema de alertas inteligentes multicanal',
      module_icon: 'Bell',
      base_price: 15000,
      category: 'horizontal',
      is_core: false,
      features: ['Email', 'Push', 'SMS', 'In-app'],
    },
  ];

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
            <Zap className="w-3 h-3 mr-1" />
            MÓDULOS DESTACADOS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Soluciones para Cada Necesidad
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Elige los módulos que necesitas y construye tu plataforma a medida
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {featuredModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ModuleCard module={module} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link to="/store/modules">
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800/50"
            >
              Ver Todos los Módulos
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedModules;
