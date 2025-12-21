import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, BarChart3, Shield, Building2, Newspaper, 
  ArrowUpRight, ArrowDownRight, Minus, ExternalLink,
  Lightbulb, Target, Zap, Globe, ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import MainNavbar from '@/components/navigation/MainNavbar';
import MainFooter from '@/components/navigation/MainFooter';

interface TrendData {
  trend: string;
  count: number;
  change: number;
}

interface SectorInsight {
  title: string;
  description: string;
  impact: string;
  category: string;
}

const TrendsDashboard: React.FC = () => {
  // Fetch trends from news articles
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['public-trends'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: articles } = await supabase
        .from('news_articles')
        .select('detected_trends, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('detected_trends', 'is', null);

      // Count trends
      const trendCounts: Record<string, { current: number; previous: number }> = {};
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

      articles?.forEach((article: any) => {
        if (article.detected_trends && Array.isArray(article.detected_trends)) {
          const isRecent = new Date(article.created_at) >= fifteenDaysAgo;
          article.detected_trends.forEach((trend: string) => {
            if (!trendCounts[trend]) {
              trendCounts[trend] = { current: 0, previous: 0 };
            }
            if (isRecent) {
              trendCounts[trend].current++;
            } else {
              trendCounts[trend].previous++;
            }
          });
        }
      });

      return Object.entries(trendCounts)
        .map(([trend, counts]) => ({
          trend,
          count: counts.current + counts.previous,
          change: counts.previous > 0 
            ? Math.round(((counts.current - counts.previous) / counts.previous) * 100)
            : counts.current > 0 ? 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
    staleTime: 300000, // 5 minutes
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: totalArticles } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: criticalNews } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true })
        .eq('importance_level', 'critical')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: activeSources } = await supabase
        .from('news_sources')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        totalArticles: totalArticles || 0,
        criticalNews: criticalNews || 0,
        activeSources: activeSources || 0,
        trendsDetected: trendsData?.length || 0,
      };
    },
    enabled: !!trendsData,
  });

  // Fetch recent critical news
  const { data: recentNews } = useQuery({
    queryKey: ['public-recent-news'],
    queryFn: async () => {
      const { data } = await supabase
        .from('news_articles')
        .select('id, title, source_name, importance_level, product_connection, published_at')
        .in('importance_level', ['critical', 'high'])
        .order('published_at', { ascending: false })
        .limit(6);

      return data || [];
    },
  });

  const sectorInsights: SectorInsight[] = [
    {
      title: "PSD3 y Open Finance",
      description: "La nueva directiva PSD3 amplía el alcance del Open Banking hacia un ecosistema financiero más integrado.",
      impact: "Alto",
      category: "Regulación",
    },
    {
      title: "IA en Compliance",
      description: "El uso de inteligencia artificial para detección de fraude y cumplimiento normativo crece un 45%.",
      impact: "Alto",
      category: "Tecnología",
    },
    {
      title: "ESG Reporting",
      description: "Las nuevas normativas CSRD exigen mayor transparencia en reportes de sostenibilidad.",
      impact: "Medio",
      category: "Sostenibilidad",
    },
    {
      title: "Ciberseguridad Financiera",
      description: "DORA establece requisitos más estrictos de resiliencia operativa digital.",
      impact: "Crítico",
      category: "Seguridad",
    },
  ];

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    if (change < 0) return <ArrowDownRight className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 20) return 'from-emerald-500 to-teal-500';
    if (change > 0) return 'from-blue-500 to-cyan-500';
    if (change < 0) return 'from-red-500 to-orange-500';
    return 'from-slate-500 to-slate-600';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <MainNavbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/30 via-transparent to-blue-950/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300">
              <TrendingUp className="w-3 h-3 mr-1" /> Dashboard Público de Tendencias
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                Tendencias del Sector
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
                Fintech & Compliance
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Análisis en tiempo real de las tendencias más relevantes en regulación financiera, 
              tecnología y compliance. Powered by ObelixIA.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/demo">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Solicitar Demo
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/resources/blog">
                <Button size="lg" variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                  Ver Noticias
                  <Newspaper className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-slate-800/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Artículos Analizados', value: stats?.totalArticles || 0, icon: Newspaper, color: 'text-blue-400' },
              { label: 'Alertas Críticas', value: stats?.criticalNews || 0, icon: Shield, color: 'text-red-400' },
              { label: 'Fuentes Monitoreadas', value: stats?.activeSources || 0, icon: Globe, color: 'text-emerald-400' },
              { label: 'Tendencias Detectadas', value: trendsData?.length || 0, icon: TrendingUp, color: 'text-purple-400' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-slate-800/50 mb-3">
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trends Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              Tendencias Principales
            </h2>
            <p className="text-slate-400">Análisis de las últimas 30 días basado en fuentes regulatorias y noticias del sector</p>
          </motion.div>

          {trendsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {trendsData?.map((trend, index) => (
                <motion.div
                  key={trend.trend}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <Card className="bg-slate-900/80 border-slate-700/50 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getTrendColor(trend.change)} bg-opacity-20`}>
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(trend.change)}
                          <span className={`text-sm font-medium ${
                            trend.change > 0 ? 'text-emerald-400' : trend.change < 0 ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {trend.trend}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {trend.count}
                        </span>
                        <span className="text-xs text-slate-500">menciones</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sector Insights */}
      <section className="py-20 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-amber-400" />
              Insights del Sector
            </h2>
            <p className="text-slate-400">Análisis experto de las tendencias más relevantes para el cumplimiento normativo</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {sectorInsights.map((insight, index) => (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/80 border-slate-700/50 hover:border-amber-500/50 transition-all h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge variant="outline" className="border-slate-600 text-slate-400">
                        {insight.category}
                      </Badge>
                      <Badge className={`${
                        insight.impact === 'Crítico' ? 'bg-red-500/20 text-red-400' :
                        insight.impact === 'Alto' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        Impacto {insight.impact}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{insight.title}</h3>
                    <p className="text-slate-400">{insight.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Critical News */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-400" />
              Noticias Críticas Recientes
            </h2>
            <p className="text-slate-400">Alertas importantes que requieren atención inmediata</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNews?.map((news: any, index: number) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/80 border-slate-700/50 hover:border-red-500/30 transition-all h-full group">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${
                        news.importance_level === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {news.importance_level === 'critical' ? '⚠️ Crítico' : '⚡ Alto'}
                      </Badge>
                      {news.product_connection && (
                        <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                          {news.product_connection}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-red-300 transition-colors">
                      {news.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{news.source_name || 'Fuente verificada'}</span>
                      <span>{new Date(news.published_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/resources/blog">
              <Button variant="outline" className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10">
                Ver todas las noticias
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-amber-900/20" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-5" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              ¿Quieres acceso completo a nuestro análisis?
            </h2>
            <p className="text-xl text-slate-400 mb-8">
              ObelixIA te ofrece inteligencia artificial avanzada para compliance, 
              análisis regulatorio y gestión de riesgos en tiempo real.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/demo">
                <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8">
                  <Target className="w-5 h-5 mr-2" />
                  Solicitar Demo Personalizada
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <Building2 className="w-5 h-5 mr-2" />
                  Ver Soluciones
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <MainFooter />
    </div>
  );
};

export default TrendsDashboard;
