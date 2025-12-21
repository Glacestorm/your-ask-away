import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageSquare, TrendingUp, Eye, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import FAQManager from './FAQManager';
import VisitorQuestionsPanel from './VisitorQuestionsPanel';
import FAQAnalytics from './FAQAnalytics';

interface Stats {
  totalFaqs: number;
  totalViews: number;
  totalHelpful: number;
  pendingQuestions: number;
}

const FAQAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('faqs');
  const [stats, setStats] = useState<Stats>({
    totalFaqs: 0,
    totalViews: 0,
    totalHelpful: 0,
    pendingQuestions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [faqsRes, questionsRes] = await Promise.all([
        supabase.from('faqs').select('views_count, helpful_count'),
        supabase.from('visitor_questions').select('id').eq('resolved', false),
      ]);

      const faqs = faqsRes.data || [];
      const totalViews = faqs.reduce((sum, f) => sum + (f.views_count || 0), 0);
      const totalHelpful = faqs.reduce((sum, f) => sum + (f.helpful_count || 0), 0);

      setStats({
        totalFaqs: faqs.length,
        totalViews,
        totalHelpful,
        pendingQuestions: questionsRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: 'FAQs Publicadas',
      value: stats.totalFaqs,
      icon: HelpCircle,
      color: 'text-blue-400',
    },
    {
      label: 'Visualizaciones',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-emerald-400',
    },
    {
      label: 'Valoraciones Positivas',
      value: stats.totalHelpful,
      icon: ThumbsUp,
      color: 'text-purple-400',
    },
    {
      label: 'Preguntas Pendientes',
      value: stats.pendingQuestions,
      icon: MessageSquare,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className="bg-slate-900/80 border-slate-700/50 hover:border-emerald-500/50 transition-all"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {isLoading ? '...' : stat.value.toLocaleString()}
                  </p>
                </div>
                <stat.icon className={`w-10 h-10 ${stat.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md gap-1 bg-slate-800/50 p-1 rounded-lg">
          <TabsTrigger
            value="faqs"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700"
          >
            <HelpCircle className="w-4 h-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger
            value="questions"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700"
          >
            <MessageSquare className="w-4 h-4" />
            Visitantes
            {stats.pendingQuestions > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                {stats.pendingQuestions}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 data-[state=active]:bg-slate-700"
          >
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faqs" className="mt-6">
          <FAQManager onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          <VisitorQuestionsPanel onUpdate={fetchStats} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <FAQAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FAQAdminDashboard;
