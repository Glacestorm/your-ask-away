import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Check, Star, Shield, Zap, 
  Calendar, FileCode2, Building2, Package, Download,
  Globe, Lock, Users, BarChart3, Brain, Calculator,
  Target, FileText, Bell, MapPin, Database, Crown,
  Layers, CheckCircle2, Clock, Award, Headphones, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCMSTranslation } from '@/hooks/cms/useCMSTranslation';
const iconMap: Record<string, React.ElementType> = {
  Building2, MapPin, Calculator, Target, FileText, Bell, Shield, Brain,
  BarChart3, Users, Globe, Lock, Zap, Database, Crown, Star, Check, Package
};

const getCategoryLabel = (category: string, t: (key: string) => string) => {
  switch (category) {
    case 'core':
      return t('store.category.core');
    case 'horizontal':
      return t('store.category.horizontal');
    case 'vertical':
      return t('store.category.vertical');
    case 'security':
      return t('store.category.security');
    default:
      return category;
  }
};

const getSectorLabel = (sector: string | null, language: string) => {
  if (!sector) return null;

  // DB uses enum-like keys; show a localized human label
  const labelsEn: Record<string, string> = {
    banking: 'Banking',
    insurance: 'Insurance',
    retail: 'Retail',
    healthcare: 'Healthcare',
    manufacturing: 'Manufacturing',
    hospitality: 'Hospitality',
    construction: 'Construction',
    transport: 'Transport',
    professional_services: 'Professional Services',
    agriculture: 'Agriculture',
  };

  const labelsEs: Record<string, string> = {
    banking: 'Banca',
    insurance: 'Seguros',
    retail: 'Retail',
    healthcare: 'Salud',
    manufacturing: 'Manufactura',
    hospitality: 'Hostelería',
    construction: 'Construcción',
    transport: 'Transporte',
    professional_services: 'Servicios Profesionales',
    agriculture: 'Agricultura',
  };

  const map = language === 'es' ? labelsEs : labelsEn;
  return map[sector] || sector;
};

const StoreModuleDetail: React.FC = () => {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { translateAsync } = useCMSTranslation();

  const locale = useMemo(() => {
    switch (language) {
      case 'en':
        return 'en-US';
      case 'fr':
        return 'fr-FR';
      case 'ca':
        return 'ca-ES';
      default:
        return 'es-ES';
    }
  }, [language]);

  const { data: module, isLoading, error } = useQuery({
    queryKey: ['store-module', moduleKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_modules')
        .select('*')
        .eq('module_key', moduleKey)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!moduleKey,
  });

  const [translatedName, setTranslatedName] = useState<string | null>(null);
  const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
  const [translatedExtendedInfo, setTranslatedExtendedInfo] = useState<{
    compatibility: string[];
    highlights: string[];
    useCases: string[];
    requirements: string[];
    support: string[];
    security: string[];
    premiumFeatures?: string[];
  } | null>(null);

  useEffect(() => {
    if (!module) return;

    if (language === 'es') {
      setTranslatedName(null);
      setTranslatedDescription(null);
      setTranslatedExtendedInfo(null);
      return;
    }

    let cancelled = false;

    (async () => {
      const name = await translateAsync(module.module_name, language, 'es');
      const desc = module.description
        ? await translateAsync(module.description, language, 'es')
        : null;

      if (!cancelled) {
        setTranslatedName(name);
        setTranslatedDescription(desc);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, module, translateAsync]);

  // Translate extended info dynamically
  useEffect(() => {
    if (!module) return;

    const baseCompatibility = ['PostgreSQL 14+', 'React 18+', 'Node.js 18+'];
    const baseRequirements = ['Supabase o PostgreSQL local', 'Autenticación configurada', 'Mínimo 2GB RAM'];
    const baseSupport = ['Documentación completa', 'Soporte por email', 'Actualizaciones durante 1 año'];
    const baseSecurity = ['Cifrado AES-256', 'RLS (Row Level Security)', 'Auditoría de accesos', 'Cumplimiento GDPR'];
    
    let highlights: string[] = [];
    let useCases: string[] = [];
    let premiumFeatures: string[] = [];

    if (module.category === 'core') {
      highlights = [
        'Módulo esencial incluido en todas las instalaciones',
        'Base para todos los demás módulos',
        'Gestión centralizada de datos',
        'Dashboard principal integrado',
      ];
      useCases = [
        'Gestión de empresas y contactos',
        'Panel de control principal',
        'Configuración del sistema',
        'Gestión de usuarios y roles',
      ];
    } else if (module.category === 'horizontal') {
      highlights = [
        'Compatible con todos los sectores',
        'Integración nativa con módulos core',
        'Escalable para grandes volúmenes',
        'API REST completa',
      ];
      useCases = [
        'Visitas comerciales y seguimiento',
        'Análisis financiero y contable',
        'Gestión de objetivos y KPIs',
        'Notificaciones y alertas',
      ];
    } else {
      highlights = [
        'Especializado para sector específico',
        'Normativas sectoriales integradas',
        'Ratios y métricas especializadas',
        'Informes regulatorios automáticos',
      ];
      useCases = [
        'Cumplimiento normativo sectorial',
        'Análisis especializado del sector',
        'Generación de informes de auditoría',
        'Gestión de riesgos sectoriales',
      ];
      premiumFeatures = [
        'Soporte prioritario 24/7',
        'Onboarding personalizado',
        'SLA garantizado 99.9%',
        'Acceso anticipado a nuevas funciones',
      ];
    }

    if (language === 'es') {
      setTranslatedExtendedInfo({
        compatibility: baseCompatibility,
        highlights,
        useCases,
        requirements: baseRequirements,
        support: baseSupport,
        security: baseSecurity,
        premiumFeatures: premiumFeatures.length > 0 ? premiumFeatures : undefined,
      });
      return;
    }

    let cancelled = false;

    (async () => {
      const translateArray = async (arr: string[]) => {
        return Promise.all(arr.map(item => translateAsync(item, language, 'es')));
      };

      const [
        translatedHighlights,
        translatedUseCases,
        translatedRequirements,
        translatedSupport,
        translatedSecurity,
        translatedPremiumFeatures,
      ] = await Promise.all([
        translateArray(highlights),
        translateArray(useCases),
        translateArray(baseRequirements),
        translateArray(baseSupport),
        translateArray(baseSecurity),
        premiumFeatures.length > 0 ? translateArray(premiumFeatures) : Promise.resolve([]),
      ]);

      if (!cancelled) {
        setTranslatedExtendedInfo({
          compatibility: baseCompatibility, // no translation needed for tech names
          highlights: translatedHighlights,
          useCases: translatedUseCases,
          requirements: translatedRequirements,
          support: translatedSupport,
          security: translatedSecurity,
          premiumFeatures: translatedPremiumFeatures.length > 0 ? translatedPremiumFeatures : undefined,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language, module, translateAsync]);

  const displayName = translatedName ?? module?.module_name ?? '';
  const displayDescription =
    translatedDescription ?? module?.description ?? t('store.moduleDetail.descriptionFallback');

  const handleRequestQuote = () => {
    toast({
      title: t('store.moduleDetail.requestBudget'),
      description: t('store.moduleDetail.requestBudgetDesc').replace('{module}', displayName),
    });
    navigate('/store#contact');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white">{t('common.loading')}</div>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center gap-4">
        <Package className="w-16 h-16 text-slate-500" />
        <h1 className="text-2xl font-bold text-white">{t('store.moduleDetail.notFoundTitle')}</h1>
        <p className="text-slate-400">{t('store.moduleDetail.notFoundDesc')}</p>
        <Button onClick={() => navigate('/store/modules')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('store.moduleDetail.backToModules')}
        </Button>
      </div>
    );
  }

  const IconComponent = iconMap[module.module_icon || 'Package'] || Package;
  const isPremium = module.category === 'vertical';
  
  const price = module.base_price || 0;
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(price);

  const features: string[] = Array.isArray(module.features) 
    ? (module.features as string[])
    : (typeof module.features === 'object' && module.features !== null && 'list' in module.features) 
      ? (module.features as { list: string[] }).list
      : [];

  // Extended module information - use translated version if available
  const extendedInfo = translatedExtendedInfo ?? {
    compatibility: ['PostgreSQL 14+', 'React 18+', 'Node.js 18+'],
    requirements: ['Supabase o PostgreSQL local', 'Autenticación configurada', 'Mínimo 2GB RAM'],
    support: ['Documentación completa', 'Soporte por email', 'Actualizaciones durante 1 año'],
    security: ['Cifrado AES-256', 'RLS (Row Level Security)', 'Auditoría de accesos', 'Cumplimiento GDPR'],
    highlights: module.category === 'core' 
      ? ['Módulo esencial incluido en todas las instalaciones', 'Base para todos los demás módulos', 'Gestión centralizada de datos', 'Dashboard principal integrado']
      : module.category === 'horizontal'
        ? ['Compatible con todos los sectores', 'Integración nativa con módulos core', 'Escalable para grandes volúmenes', 'API REST completa']
        : ['Especializado para sector específico', 'Normativas sectoriales integradas', 'Ratios y métricas especializadas', 'Informes regulatorios automáticos'],
    useCases: module.category === 'core'
      ? ['Gestión de empresas y contactos', 'Panel de control principal', 'Configuración del sistema', 'Gestión de usuarios y roles']
      : module.category === 'horizontal'
        ? ['Visitas comerciales y seguimiento', 'Análisis financiero y contable', 'Gestión de objetivos y KPIs', 'Notificaciones y alertas']
        : ['Cumplimiento normativo sectorial', 'Análisis especializado del sector', 'Generación de informes de auditoría', 'Gestión de riesgos sectoriales'],
    premiumFeatures: module.category === 'vertical' 
      ? ['Soporte prioritario 24/7', 'Onboarding personalizado', 'SLA garantizado 99.9%', 'Acceso anticipado a nuevas funciones'] 
      : undefined,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/store/modules');
                  }
                }}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('store.moduleDetail.back')}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Link to="/store" className="hover:text-white">{t('store.moduleDetail.store')}</Link>
                <span>/</span>
                <Link to="/store/modules" className="hover:text-white">{t('store.moduleDetail.modules')}</Link>
                <span>/</span>
                <span className="text-white">{displayName}</span>
              </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid lg:grid-cols-3 gap-8 mb-12"
        >
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start gap-6">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                isPremium 
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600' 
                  : module.is_core
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                <IconComponent className="w-10 h-10 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                  {module.is_core && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      CORE
                    </Badge>
                  )}
                  {isPremium && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                      <Crown className="w-3 h-3 mr-1" />
                      PREMIUM
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                  <span className="font-mono">{module.module_key}</span>
                  <span>•</span>
                  <span>v{module.version || '1.0.0'}</span>
                  <span>•</span>
                  <Badge variant="outline" className={
                    module.category === 'core' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                    module.category === 'horizontal' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }>
                    {getCategoryLabel(module.category, t)}
                  </Badge>
                  {module.sector && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                      <Building2 className="w-3 h-3 mr-1" />
                      {getSectorLabel(module.sector, language)}
                    </Badge>
                  )}
                </div>

                <p className="text-slate-300 text-lg leading-relaxed">
                  {displayDescription}
                </p>
              </div>
            </div>

            {/* Highlights */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  {t('store.moduleDetail.highlights')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {extendedInfo.highlights.map((highlight, i) => (
                    <div key={i} className="flex items-start gap-3 text-slate-300">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Purchase Card */}
          <div className="lg:col-span-1">
            <Card className={`bg-slate-800/50 border-slate-700/50 sticky top-24 ${
              isPremium ? 'ring-2 ring-amber-500/30' : ''
            }`}>
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-slate-300 mb-1">{t('store.moduleDetail.customPrice')}</div>
                  <div className="text-slate-400">{t('store.moduleDetail.requestBudgetShort')}</div>
                </div>

                <Separator className="bg-slate-700" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('store.moduleDetail.benefit.updates')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('store.moduleDetail.benefit.support')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('store.moduleDetail.benefit.docs')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{t('store.moduleDetail.benefit.deployment')}</span>
                  </div>
                </div>

                <Button
                  className={`w-full ${
                    isPremium 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
                  }`}
                  size="lg"
                  onClick={handleRequestQuote}
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {t('store.moduleDetail.requestBudget')}
                </Button>

                <div className="text-center text-xs text-slate-500">
                  {t('store.moduleDetail.contactSales')}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Tabs Section */}
        <Tabs defaultValue="features" className="mb-12">
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="features">{t('store.moduleDetail.tabs.features')}</TabsTrigger>
            <TabsTrigger value="technical">{t('store.moduleDetail.tabs.technical')}</TabsTrigger>
            <TabsTrigger value="security">{t('store.moduleDetail.tabs.security')}</TabsTrigger>
            {isPremium && <TabsTrigger value="premium">{t('store.moduleDetail.tabs.premium')}</TabsTrigger>}
          </TabsList>

          <TabsContent value="features" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    {t('store.moduleDetail.includedFeatures')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {features.length > 0 ? features.map((feature: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                        <span>{feature}</span>
                      </div>
                    )) : (
                      <>
                        <div className="flex items-start gap-3 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                          <span>{t('store.moduleDetail.defaultFeatures.dataManagement')}</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                          <span>{t('store.moduleDetail.defaultFeatures.dashboard')}</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                          <span>{t('store.moduleDetail.defaultFeatures.reports')}</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                          <span>{t('store.moduleDetail.defaultFeatures.export')}</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
                          <span>{t('store.moduleDetail.defaultFeatures.api')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    {t('store.moduleDetail.useCases')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {extendedInfo.useCases.map((useCase, i) => (
                      <div key={i} className="flex items-start gap-3 text-slate-300">
                        <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                          <span className="text-xs text-purple-400 font-medium">{i + 1}</span>
                        </div>
                        <span>{useCase}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    {t('store.moduleDetail.compatibility')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extendedInfo.compatibility.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-orange-400" />
                    {t('store.moduleDetail.requirements')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extendedInfo.requirements.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-orange-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-green-400" />
                    {t('store.moduleDetail.support')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {extendedInfo.support.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Dependencies */}
            {module.dependencies && Array.isArray(module.dependencies) && module.dependencies.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    {t('store.moduleDetail.dependencies')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {module.dependencies.map((dep: string, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-slate-700 text-slate-300">
                        {dep}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 mt-3">
                    {t('store.moduleDetail.dependenciesNote').replace('{module}', displayName)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Version Info */}
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">{t('store.moduleDetail.lastUpdated')}</div>
                    <div className="text-white font-medium">
                      {module.updated_at 
                        ? new Date(module.updated_at).toLocaleDateString(locale, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'N/A'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {module.min_core_version && (
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <Package className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <div className="text-sm text-slate-400">{t('store.moduleDetail.minCoreVersion')}</div>
                        <div className="text-white font-medium">{module.min_core_version}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-red-400" />
                    {t('store.moduleDetail.securityMeasures')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {extendedInfo.security.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 text-slate-300">
                        <Lock className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-400" />
                    {t('store.moduleDetail.certifications')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        ISO 27001
                      </Badge>
                      <span className="text-sm">{t('store.moduleDetail.cert.iso27001')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        GDPR
                      </Badge>
                      <span className="text-sm">{t('store.moduleDetail.cert.gdpr')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        DORA
                      </Badge>
                      <span className="text-sm">{t('store.moduleDetail.cert.dora')}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        NIS2
                      </Badge>
                      <span className="text-sm">{t('store.moduleDetail.cert.nis2')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isPremium && (
            <TabsContent value="premium" className="mt-6">
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
                <CardHeader>
                  <CardTitle className="text-amber-400 flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    {t('store.moduleDetail.premiumBenefits')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {'premiumFeatures' in extendedInfo && extendedInfo.premiumFeatures?.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 text-slate-200">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <span className="font-medium">{feature}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6 bg-amber-500/20" />

                  <div className="text-center">
                    <p className="text-amber-300/80 mb-4">
                      {t('store.moduleDetail.premiumNote')}
                    </p>
                    <Button
                      onClick={handleRequestQuote}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                    >
                      {t('store.moduleDetail.requestPremiumBudget')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Documentation Link */}
        {module.documentation_url && (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{t('store.moduleDetail.docsTitle')}</h4>
                  <p className="text-sm text-slate-400">{t('store.moduleDetail.docsDesc')}</p>
                </div>
              </div>
              <Button variant="outline" asChild className="border-slate-600">
                <a href={module.documentation_url} target="_blank" rel="noopener noreferrer">
                  <Globe className="w-4 h-4 mr-2" />
                  {t('store.moduleDetail.viewDocs')}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreModuleDetail;
