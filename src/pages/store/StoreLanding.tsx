import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Globe, Award, CheckCircle2, 
  TrendingUp, Users, Lock, Sparkles, Building2, ChevronRight,
  Landmark, Scale, FileCheck, Play, BarChart3, GitCompare, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StoreNavbar from '@/components/store/StoreNavbar';
import HeroSection from '@/components/store/HeroSection';
import FeaturedModules from '@/components/store/FeaturedModules';
import PremiumModulesSection from '@/components/store/PremiumModulesSection';
import BundlesSection from '@/components/store/BundlesSection';
import TrustBadges from '@/components/store/TrustBadges';
import ROICalculator from '@/components/store/ROICalculator';
import PricingExplanation from '@/components/store/PricingExplanation';
import StoreFooter from '@/components/store/StoreFooter';
import CartSidebar from '@/components/store/CartSidebar';

const StoreLanding: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [marketingTab, setMarketingTab] = useState("sectores");
  const [demoForm, setDemoForm] = useState({ name: "", email: "", company: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tracking function for marketing events
  const trackMarketingEvent = async (eventName: string, eventData: object) => {
    try {
      await supabase.from('marketing_events').insert([{
        event_name: eventName,
        event_type: 'marketing',
        metadata: eventData as Record<string, string>,
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        session_id: crypto.randomUUID(),
      }]);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Handle demo form submission
  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await trackMarketingEvent('demo_request', demoForm);
      toast.success('¡Solicitud enviada! Te contactaremos pronto.');
      setDemoForm({ name: "", email: "", company: "", message: "" });
    } catch (error) {
      toast.error('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { value: '500+', label: t('store.stats.companies'), icon: Building2 },
    { value: '99.9%', label: t('store.stats.uptime'), icon: Shield },
    { value: '€2.5M', label: t('store.stats.processed'), icon: TrendingUp },
    { value: '24/7', label: t('store.stats.support'), icon: Users },
  ];

  const features = [
    { 
      icon: Shield, 
      title: t('store.features.security.title'), 
      description: t('store.features.security.desc')
    },
    { 
      icon: Zap, 
      title: t('store.features.ai.title'), 
      description: t('store.features.ai.desc')
    },
    { 
      icon: Globe, 
      title: t('store.features.multisector.title'), 
      description: t('store.features.multisector.desc')
    },
    { 
      icon: Lock, 
      title: t('store.features.compliance.title'), 
      description: t('store.features.compliance.desc')
    },
  ];

  return (
    <div id="inicio" className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Bar */}
      <section className="relative z-10 -mt-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-emerald-600/20 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-8"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <div className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('store.features.badge')}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('store.features.title')}
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              {t('store.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing Section with Tabs */}
      <section id="marketing" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              SOLUCIONES ESPECIALIZADAS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Descubre Obelixia
            </h2>
          </motion.div>

          <Tabs value={marketingTab} onValueChange={(v) => {
            setMarketingTab(v);
            trackMarketingEvent('tab_view', { tab: v });
          }} className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-slate-800/50 border border-slate-700 rounded-xl p-1 h-auto">
              <TabsTrigger value="sectores" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg">
                <Landmark className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sectores</span>
              </TabsTrigger>
              <TabsTrigger value="comparativas" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg">
                <GitCompare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Comparativas</span>
              </TabsTrigger>
              <TabsTrigger value="seguridad" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg">
                <ShieldCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="demo" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-3 rounded-lg">
                <Play className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Demo</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Sectores */}
            <TabsContent value="sectores" className="space-y-8">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Banca */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-emerald-500/50 transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Landmark className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Banca</h3>
                  <p className="text-slate-400 text-sm">
                    Gestión de carteras, cumplimiento normativo y análisis de riesgo con IA.
                  </p>
                  <ul className="space-y-2">
                    {["Cumplimiento DORA", "Gestión de Mora", "KYC Automatizado", "Reporting EBA"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Seguros */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-emerald-500/50 transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Seguros</h3>
                  <p className="text-slate-400 text-sm">
                    Gestión de pólizas, siniestros y cumplimiento con Solvencia II.
                  </p>
                  <ul className="space-y-2">
                    {["Solvencia II", "Gestión de Siniestros", "Pricing Dinámico", "Fraude Detection"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Empresas */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4 hover:border-emerald-500/50 transition-all"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Empresas</h3>
                  <p className="text-slate-400 text-sm">
                    ERP integrado con gestión financiera y análisis predictivo.
                  </p>
                  <ul className="space-y-2">
                    {["Gestión Financiera", "RRHH Integrado", "Business Intelligence", "Automatización"].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </TabsContent>

            {/* Tab: Comparativas */}
            <TabsContent value="comparativas" className="space-y-8">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-white">Característica</th>
                      <th className="text-center p-4 text-emerald-400 font-bold">Obelixia</th>
                      <th className="text-center p-4 text-slate-400">CRMs Tradicionales</th>
                      <th className="text-center p-4 text-slate-400">ERPs Legacy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "IA Integrada", obelixia: "✓", crm: "Limitada", erp: "✗" },
                      { feature: "Cumplimiento DORA", obelixia: "✓", crm: "✗", erp: "Parcial" },
                      { feature: "Implementación", obelixia: "Semanas", crm: "Meses", erp: "Años" },
                      { feature: "Coste Total", obelixia: "Bajo", crm: "Medio", erp: "Alto" },
                      { feature: "Actualizaciones", obelixia: "Continuas", crm: "Trimestrales", erp: "Anuales" },
                      { feature: "Soporte 24/7", obelixia: "✓", crm: "Extra", erp: "Extra" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                        <td className="p-4 font-medium text-white">{row.feature}</td>
                        <td className="p-4 text-center text-emerald-400 font-semibold">{row.obelixia}</td>
                        <td className="p-4 text-center text-slate-400">{row.crm}</td>
                        <td className="p-4 text-center text-slate-400">{row.erp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
                <p className="text-lg font-medium text-white">
                  Obelixia reduce el tiempo de implementación en un <span className="text-emerald-400 font-bold">70%</span> y 
                  el coste total de propiedad en un <span className="text-emerald-400 font-bold">40%</span>
                </p>
              </div>
            </TabsContent>

            {/* Tab: Seguridad */}
            <TabsContent value="seguridad" className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    title: "DORA",
                    subtitle: "Digital Operational Resilience Act",
                    description: "Cumplimiento completo con el reglamento europeo de resiliencia operativa digital para entidades financieras.",
                    items: ["Gestión de riesgos TIC", "Pruebas de resiliencia", "Notificación de incidentes", "Gestión de terceros"]
                  },
                  {
                    title: "NIS2",
                    subtitle: "Network and Information Security",
                    description: "Cumplimiento con la directiva europea de seguridad de redes y sistemas de información.",
                    items: ["Gestión de riesgos", "Respuesta a incidentes", "Continuidad de negocio", "Seguridad de cadena"]
                  },
                  {
                    title: "GDPR",
                    subtitle: "General Data Protection Regulation",
                    description: "Protección de datos personales según el reglamento europeo.",
                    items: ["Consentimiento explícito", "Derecho al olvido", "Portabilidad de datos", "DPO integrado"]
                  },
                  {
                    title: "ENS",
                    subtitle: "Esquema Nacional de Seguridad",
                    description: "Cumplimiento con el marco de seguridad español para administraciones públicas.",
                    items: ["Nivel Alto certificado", "Auditorías periódicas", "Control de accesos", "Cifrado avanzado"]
                  },
                ].map((cert, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-emerald-400">{cert.title}</h3>
                        <p className="text-sm text-slate-400">{cert.subtitle}</p>
                      </div>
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{cert.description}</p>
                    <ul className="grid grid-cols-2 gap-2">
                      {cert.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Demo */}
            <TabsContent value="demo" className="space-y-8">
              <div className="max-w-xl mx-auto">
                <form onSubmit={handleDemoSubmit} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Nombre</label>
                      <Input
                        required
                        value={demoForm.name}
                        onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                        placeholder="Tu nombre"
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white">Email</label>
                      <Input
                        required
                        type="email"
                        value={demoForm.email}
                        onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                        placeholder="tu@email.com"
                        className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Empresa</label>
                    <Input
                      required
                      value={demoForm.company}
                      onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                      placeholder="Nombre de tu empresa"
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Mensaje (opcional)</label>
                    <Textarea
                      value={demoForm.message}
                      onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                      placeholder="Cuéntanos sobre tus necesidades..."
                      rows={4}
                      className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Enviando..." : "Solicitar Demo Gratuita"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Featured Modules */}
      <div id="modules">
        <FeaturedModules />
      </div>

      {/* Premium Section */}
      <PremiumModulesSection />

      {/* Bundles */}
      <div id="bundles">
        <BundlesSection />
      </div>

      {/* Contact Section for Quote Requests */}
      <section id="contact" className="py-24 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              SOLICITAR COTIZACIÓN
            </Badge>
            <h2 className="text-4xl font-bold text-white mb-4">
              Precios Personalizados
            </h2>
            <p className="text-slate-400 mb-8">
              Contacte con nuestro equipo comercial para obtener una cotización adaptada a las necesidades de su empresa
            </p>
            <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-8">
              <p className="text-lg text-white mb-4">
                📧 <a href="mailto:comercial@obelixia.com" className="text-emerald-400 hover:underline">comercial@obelixia.com</a>
              </p>
              <p className="text-lg text-white mb-4">
                📞 <a href="tel:+34606770033" className="text-emerald-400 hover:underline">+34 606 770 033</a>
              </p>
              <p className="text-slate-400 text-sm">
                Jaime Fernández García - Representante Comercial
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ROI Calculator / Pricing */}
      <div id="pricing">
        <ROICalculator />
        <div className="container mx-auto px-4">
          <PricingExplanation />
        </div>
      </div>

      {/* Trust Badges */}
      <TrustBadges />

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-emerald-500/10 to-emerald-600/20" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 text-emerald-400" />
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('store.cta.title')}
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('store.cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/25"
              >
                {t('store.cta.button1')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Link to="/auth">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 px-8 py-6 text-lg rounded-xl"
                >
                  {t('store.cta.button2')}
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note1')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note2')}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {t('store.cta.note3')}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <StoreFooter />
      <CartSidebar />
    </div>
  );
};

export default StoreLanding;