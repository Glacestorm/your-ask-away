import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FAQ {
  id: string;
  question: string;
  views_count: number;
  helpful_count: number;
  not_helpful_count: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface QuestionStats {
  date: string;
  count: number;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'];

const FAQAnalytics: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questionsByDay, setQuestionsByDay] = useState<QuestionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqsRes, categoriesRes, questionsRes] = await Promise.all([
        supabase.from('faqs').select('*'),
        supabase.from('faq_categories').select('*'),
        supabase
          .from('visitor_questions')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setFaqs(faqsRes.data || []);
      setCategories(categoriesRes.data || []);

      // Process questions by day
      const questions = questionsRes.data || [];
      const byDay: Record<string, number> = {};
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        byDay[key] = 0;
      }

      questions.forEach(q => {
        const date = new Date(q.created_at);
        const key = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        if (byDay[key] !== undefined) {
          byDay[key]++;
        }
      });

      setQuestionsByDay(
        Object.entries(byDay).map(([date, count]) => ({ date, count }))
      );
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Top FAQs by views
  const topFaqs = [...faqs]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 5)
    .map(faq => ({
      name: faq.question.length > 40 ? faq.question.substring(0, 40) + '...' : faq.question,
      views: faq.views_count,
      helpful: faq.helpful_count,
    }));

  // FAQs by category
  const faqsByCategory = categories.map(cat => {
    const count = faqs.filter(f => f.category_id === cat.id).length;
    return {
      name: cat.name,
      value: count,
      color: cat.color,
    };
  }).filter(c => c.value > 0);

  // Satisfaction rate
  const totalHelpful = faqs.reduce((sum, f) => sum + f.helpful_count, 0);
  const totalNotHelpful = faqs.reduce((sum, f) => sum + f.not_helpful_count, 0);
  const satisfactionRate =
    totalHelpful + totalNotHelpful > 0
      ? Math.round((totalHelpful / (totalHelpful + totalNotHelpful)) * 100)
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Tasa de Satisfacción</p>
                <p className="text-2xl font-bold text-white">{satisfactionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Visualizaciones</p>
                <p className="text-2xl font-bold text-white">
                  {faqs.reduce((sum, f) => sum + f.views_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <ThumbsUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Valoraciones Positivas</p>
                <p className="text-2xl font-bold text-white">{totalHelpful}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Preguntas (7 días)</p>
                <p className="text-2xl font-bold text-white">
                  {questionsByDay.reduce((sum, d) => sum + d.count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Questions by Day */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Preguntas por Día (Última Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={questionsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* FAQs by Category */}
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white text-lg">FAQs por Categoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={faqsByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {faqsByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top FAQs */}
        <Card className="bg-slate-900/80 border-slate-700/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              FAQs Más Consultadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topFaqs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  width={200}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="views" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Vistas" />
                <Bar dataKey="helpful" fill="#10b981" radius={[0, 4, 4, 0]} name="Útil" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQAnalytics;
