import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  Play,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSectors } from '@/hooks/useSectors';
import { CaseStudyCard } from '@/components/sectors/CaseStudyCard';
import StoreNavbar from '@/components/store/StoreNavbar';
import StoreFooter from '@/components/store/StoreFooter';

const iconMap: Record<string, React.ElementType> = {
  ShoppingCart: Building2,
  HardHat: Building2,
  Stethoscope: Building2,
  Factory: Building2,
  Truck: Building2,
  GraduationCap: Building2,
  Landmark: Building2,
  Utensils: Building2,
  Building2: Building2,
};

const SectorDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { sectors, loading } = useSectors();

  const sector = sectors.find(s => s.slug === slug);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <StoreNavbar />
        <div className="container mx-auto px-6 py-24">
          <Skeleton className="h-12 w-1/3 mb-4 bg-slate-800" />
          <Skeleton className="h-6 w-2/3 mb-8 bg-slate-800" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="h-96 bg-slate-800 rounded-2xl" />
            <Skeleton className="h-96 bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!sector) {
    return <Navigate to="/sectores" replace />;
  }

  const Icon = iconMap[sector.icon_name || 'Building2'] || Building2;
  const gradientFrom = sector.gradient_from || '#3b82f6';
  const gradientTo = sector.gradient_to || '#8b5cf6';

  return (
    <div className="min-h-screen bg-slate-950">
      <StoreNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${gradientFrom}40, transparent 70%)`
          }}
        />
        
        <div className="container mx-auto px-6 relative">
          <Link to="/store#sectors">
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Sectores
            </Button>
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <Badge 
                  className="border-0 text-white"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                  {sector.availability_status === 'available' ? 'Disponible' : 
                   sector.availability_status === 'coming_soon' ? 'Próximamente' :
                   sector.availability_status === 'beta' ? 'Beta' : 'Nuevo'}
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                {sector.name}
              </h1>
              
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                {sector.description}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link to="/store/modules">
                  <Button 
                    size="lg"
                    className="text-white"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                  >
                    Ver Módulos Recomendados
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="bg-slate-900/60 border-slate-700 text-white hover:text-white hover:bg-slate-800"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Solicitar Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Stats Grid */}
              {sector.stats && sector.stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {sector.stats.map((stat, index) => (
                    <Card 
                      key={index} 
                      className="bg-slate-900/80 border-slate-800 backdrop-blur-xl"
                    >
                      <CardContent className="p-6 text-center">
                        <div 
                          className="text-3xl font-bold mb-1"
                          style={{ color: gradientFrom }}
                        >
                          {stat.prefix}{stat.value}{stat.suffix}
                        </div>
                        <div className="text-sm text-slate-400">{stat.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {sector.features && sector.features.length > 0 && (
        <section className="py-20 bg-slate-900/50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Funcionalidades Clave
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Características específicas diseñadas para las necesidades de {sector.name.toLowerCase()}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sector.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-slate-900/80 border-slate-800 hover:border-slate-700 transition-all">
                    <CardContent className="p-6">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${gradientFrom}20` }}
                      >
                        <CheckCircle2 className="w-6 h-6" style={{ color: gradientFrom }} />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-slate-400 text-sm">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Regulations & Compliance */}
      {sector.regulations && sector.regulations.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Normativa y Cumplimiento
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Cumplimos con todas las regulaciones específicas del sector
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              {sector.regulations.map((reg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge 
                    variant="outline"
                    className="px-4 py-2 text-sm bg-slate-900/60 border-slate-700 text-white hover:bg-slate-800"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" style={{ color: gradientFrom }} />
                    {reg.code}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Modules Recommended */}
      {sector.modules_recommended && sector.modules_recommended.length > 0 && (
        <section className="py-20 bg-slate-900/50">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Módulos Recomendados
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                La combinación perfecta de módulos para tu sector
              </p>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-3">
              {sector.modules_recommended.map((module, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to="/store/modules">
                    <Badge 
                      className="px-4 py-2 text-sm border-0 text-white cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                    >
                      {module}
                    </Badge>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Case Studies */}
      {sector.case_studies && sector.case_studies.length > 0 && (
        <section className="py-20">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Casos de Éxito
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto">
                Empresas que ya confían en nuestra solución
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sector.case_studies.map((caseStudy, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CaseStudyCard caseStudy={caseStudy} gradientColor={gradientFrom} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Solicita una demo personalizada y descubre cómo podemos ayudarte
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/demo">
                <Button 
                  size="lg"
                  className="text-white"
                  style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                >
                  Solicitar Demo Gratis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-slate-900/60 border-slate-700 text-white hover:text-white hover:bg-slate-800"
                >
                  Contactar con Ventas
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <StoreFooter />
    </div>
  );
};

export default SectorDetail;
