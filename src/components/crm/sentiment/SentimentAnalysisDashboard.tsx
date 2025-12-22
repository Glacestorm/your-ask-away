import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  ThumbsUp, ThumbsDown, Meh, MessageSquare, RefreshCw,
  Brain, Lightbulb, Target, BarChart3, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SentimentData {
  id: string;
  sourceType: 'message' | 'survey' | 'visit_note' | 'call_transcript';
  sourceId: string;
  content: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  emotions: { emotion: string; intensity: number }[];
  keyPhrases: string[];
  topics: string[];
  actionRequired: boolean;
  suggestedAction?: string;
  analyzedAt: string;
  companyId?: string;
  companyName?: string;
}

interface SentimentTrend {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
  avgScore: number;
}

interface SentimentAnalysisDashboardProps {
  sentimentData: SentimentData[];
  trends: SentimentTrend[];
  isLoading?: boolean;
  onAnalyze?: (content: string) => void;
  onRefresh?: () => void;
  companyId?: string;
}

export function SentimentAnalysisDashboard({
  sentimentData,
  trends,
  isLoading = false,
  onAnalyze,
  onRefresh,
  companyId
}: SentimentAnalysisDashboardProps) {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

  // Calculate metrics
  const totalAnalyzed = sentimentData.length;
  const positiveCount = sentimentData.filter(s => s.sentiment === 'positive').length;
  const negativeCount = sentimentData.filter(s => s.sentiment === 'negative').length;
  const neutralCount = sentimentData.filter(s => s.sentiment === 'neutral').length;
  const actionRequiredCount = sentimentData.filter(s => s.actionRequired).length;

  const avgScore = sentimentData.length > 0 
    ? sentimentData.reduce((sum, s) => sum + s.sentimentScore, 0) / sentimentData.length 
    : 0;

  const positiveRate = totalAnalyzed > 0 ? (positiveCount / totalAnalyzed) * 100 : 0;
  const negativeRate = totalAnalyzed > 0 ? (negativeCount / totalAnalyzed) * 100 : 0;

  // Filter data
  const filteredData = sentimentData.filter(s => {
    const matchesSource = sourceFilter === 'all' || s.sourceType === sourceFilter;
    const matchesSentiment = sentimentFilter === 'all' || s.sentiment === sentimentFilter;
    return matchesSource && matchesSentiment;
  });

  // Aggregate emotions
  const emotionCounts: Record<string, number> = {};
  sentimentData.forEach(s => {
    s.emotions.forEach(e => {
      emotionCounts[e.emotion] = (emotionCounts[e.emotion] || 0) + e.intensity;
    });
  });
  const topEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Topic frequency
  const topicCounts: Record<string, number> = {};
  sentimentData.forEach(s => {
    s.topics.forEach(t => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
  });
  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  const pieData = [
    { name: 'Positivo', value: positiveCount, color: '#22c55e' },
    { name: 'Neutral', value: neutralCount, color: '#94a3b8' },
    { name: 'Negativo', value: negativeCount, color: '#ef4444' },
  ];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <Meh className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'negative': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.3) return 'text-green-500';
    if (score <= -0.3) return 'text-red-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Analizado</p>
                <p className="text-2xl font-bold">{totalAnalyzed}</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Score Promedio</p>
                <p className={cn("text-2xl font-bold", getScoreColor(avgScore))}>
                  {avgScore >= 0 ? '+' : ''}{(avgScore * 100).toFixed(0)}
                </p>
              </div>
              {avgScore >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500/30" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500/30" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Positivos</p>
                <p className="text-2xl font-bold text-green-600">{positiveRate.toFixed(0)}%</p>
              </div>
              <ThumbsUp className="h-8 w-8 text-green-500/30" />
            </div>
            <Progress value={positiveRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Negativos</p>
                <p className="text-2xl font-bold text-red-600">{negativeRate.toFixed(0)}%</p>
              </div>
              <ThumbsDown className="h-8 w-8 text-red-500/30" />
            </div>
            <Progress value={negativeRate} className="mt-2 h-1 [&>div]:bg-red-500" />
          </CardContent>
        </Card>

        <Card className={actionRequiredCount > 0 ? "border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Requieren Acción</p>
                <p className="text-2xl font-bold text-amber-600">{actionRequiredCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tendencia de Sentimiento</CardTitle>
                <CardDescription>Evolución temporal del sentimiento</CardDescription>
              </div>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Actualizar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[-100, 100]} className="text-xs" />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Topics & Emotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Temas Principales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTopics.map(([topic, count]) => (
                <div key={topic} className="flex items-center justify-between">
                  <span className="text-sm">{topic}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(count / (topTopics[0]?.[1] || 1)) * 100} 
                      className="w-24 h-2" 
                    />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
              {topTopics.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos suficientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Emociones Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEmotions.map(([emotion, intensity]) => (
                <div key={emotion} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{emotion}</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(intensity / (topEmotions[0]?.[1] || 1)) * 100} 
                      className="w-24 h-2" 
                    />
                    <span className="text-xs text-muted-foreground w-8">{intensity.toFixed(0)}</span>
                  </div>
                </div>
              ))}
              {topEmotions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay datos suficientes
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Análisis Recientes</CardTitle>
              <CardDescription>Últimos mensajes y notas analizados</CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="message">Mensajes</SelectItem>
                  <SelectItem value="survey">Encuestas</SelectItem>
                  <SelectItem value="visit_note">Notas visita</SelectItem>
                  <SelectItem value="call_transcript">Llamadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sentimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="positive">Positivo</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              <AnimatePresence>
                {filteredData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "p-4",
                      item.actionRequired && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/10"
                    )}>
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-full",
                          getSentimentColor(item.sentiment)
                        )}>
                          {getSentimentIcon(item.sentiment)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {item.sourceType === 'message' && 'Mensaje'}
                              {item.sourceType === 'survey' && 'Encuesta'}
                              {item.sourceType === 'visit_note' && 'Nota visita'}
                              {item.sourceType === 'call_transcript' && 'Llamada'}
                            </Badge>
                            {item.companyName && (
                              <span className="text-xs text-muted-foreground">{item.companyName}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(item.analyzedAt).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                          
                          <p className="text-sm line-clamp-2 mb-2">{item.content}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.keyPhrases.slice(0, 4).map((phrase) => (
                              <Badge key={phrase} variant="secondary" className="text-[10px]">
                                {phrase}
                              </Badge>
                            ))}
                          </div>
                          
                          {item.actionRequired && item.suggestedAction && (
                            <div className="flex items-start gap-2 p-2 bg-amber-100/50 dark:bg-amber-900/20 rounded text-xs">
                              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                              <span>{item.suggestedAction}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <span className={cn(
                            "text-lg font-bold",
                            getScoreColor(item.sentimentScore)
                          )}>
                            {item.sentimentScore >= 0 ? '+' : ''}{(item.sentimentScore * 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos que mostrar
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
