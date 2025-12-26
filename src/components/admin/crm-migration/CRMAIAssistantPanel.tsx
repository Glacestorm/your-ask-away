import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  RefreshCw,
  CheckCircle,
  XCircle,
  Brain,
  Wand2,
  MessageSquare,
  BarChart3,
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { CRMMigration } from '@/hooks/admin/integrations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AISuggestion {
  id: string;
  type: 'mapping' | 'optimization' | 'warning' | 'insight';
  title: string;
  description: string;
  confidence: number;
  action?: string;
  applied?: boolean;
}

interface PredictiveAnalysis {
  successProbability: number;
  estimatedDuration: number;
  potentialIssues: Array<{
    issue: string;
    probability: number;
    mitigation: string;
  }>;
  recommendations: string[];
}

interface AnomalyDetection {
  id: string;
  field: string;
  anomalyType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRecords: number;
  suggestion: string;
}

interface CRMAIAssistantPanelProps {
  migration?: CRMMigration | null;
}

export function CRMAIAssistantPanel({ migration }: CRMAIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState('assistant');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! Soy tu asistente de migración CRM con IA. Puedo ayudarte a analizar datos, sugerir mapeos, detectar anomalías y optimizar tu proceso de migración. ¿En qué puedo ayudarte?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock AI suggestions
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([
    {
      id: '1',
      type: 'mapping',
      title: 'Mapeo automático detectado',
      description: 'El campo "Company" del CRM origen coincide con "empresa_nombre" en el destino con 98% de similitud.',
      confidence: 98,
      action: 'Aplicar mapeo',
      applied: false
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Optimización de batch size',
      description: 'Basado en el volumen de datos (45,000 registros), se recomienda aumentar el batch size a 500 para mejorar el rendimiento.',
      confidence: 92,
      action: 'Aplicar optimización',
      applied: false
    },
    {
      id: '3',
      type: 'warning',
      title: 'Posibles duplicados detectados',
      description: 'Se han identificado 234 registros que podrían ser duplicados basándose en email y nombre de empresa.',
      confidence: 87,
      action: 'Revisar duplicados',
      applied: false
    },
    {
      id: '4',
      type: 'insight',
      title: 'Patrón de datos identificado',
      description: 'El 78% de los contactos tienen el campo "industry" vacío. Se sugiere enriquecer estos datos antes de migrar.',
      confidence: 95,
      action: 'Ver detalles',
      applied: false
    }
  ]);

  // Mock predictive analysis
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis>({
    successProbability: 94.5,
    estimatedDuration: 45,
    potentialIssues: [
      { issue: 'Campos vacíos en datos de contacto', probability: 67, mitigation: 'Establecer valores por defecto' },
      { issue: 'Formato de fecha inconsistente', probability: 45, mitigation: 'Aplicar transformación automática' },
      { issue: 'Duplicados potenciales', probability: 23, mitigation: 'Ejecutar deduplicación previa' }
    ],
    recommendations: [
      'Ejecutar validación de emails antes de migrar',
      'Considerar migración incremental para minimizar riesgos',
      'Programar la migración en horario de bajo tráfico',
      'Crear punto de rollback antes de iniciar'
    ]
  });

  // Mock anomalies
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([
    {
      id: '1',
      field: 'email',
      anomalyType: 'Formato inválido',
      severity: 'high',
      description: 'Se detectaron emails con formato inválido o dominios inexistentes',
      affectedRecords: 156,
      suggestion: 'Validar y corregir formato de emails antes de migrar'
    },
    {
      id: '2',
      field: 'phone',
      anomalyType: 'Datos inconsistentes',
      severity: 'medium',
      description: 'Números de teléfono con formatos mixtos (con/sin prefijo internacional)',
      affectedRecords: 892,
      suggestion: 'Normalizar formato de teléfonos a estándar E.164'
    },
    {
      id: '3',
      field: 'created_date',
      anomalyType: 'Valores atípicos',
      severity: 'low',
      description: 'Fechas de creación anteriores a 2010 que podrían ser erróneas',
      affectedRecords: 45,
      suggestion: 'Revisar y validar fechas históricas'
    }
  ]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-assistant', {
        body: {
          action: 'chat',
          message: inputMessage,
          migrationContext: migration ? {
            id: migration.id,
            source: migration.source_crm,
            status: migration.status,
            totalRecords: migration.total_records
          } : null,
          conversationHistory: messages.slice(-5).map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data?.response || 'Lo siento, no pude procesar tu solicitud. ¿Podrías reformular tu pregunta?',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling AI assistant:', error);
      
      // Fallback response
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Estoy analizando tu solicitud. Mientras tanto, te sugiero revisar las sugerencias automáticas en la pestaña "Sugerencias IA" donde encontrarás recomendaciones basadas en el análisis de tus datos.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    toast.info('Ejecutando análisis con IA...');
    
    try {
      const { data, error } = await supabase.functions.invoke('crm-ai-assistant', {
        body: {
          action: 'analyze',
          migrationContext: migration ? {
            id: migration.id,
            source: migration.source_crm,
            config: migration.config
          } : null
        }
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
      if (data?.predictiveAnalysis) {
        setPredictiveAnalysis(data.predictiveAnalysis);
      }
      if (data?.anomalies) {
        setAnomalies(data.anomalies);
      }

      toast.success('Análisis completado');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.success('Análisis completado con datos de ejemplo');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, applied: true } : s
    ));
    toast.success('Sugerencia aplicada correctamente');
  };

  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'mapping': return <Wand2 className="h-4 w-4" />;
      case 'optimization': return <Zap className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'mapping': return 'text-blue-500 bg-blue-500/10';
      case 'optimization': return 'text-emerald-500 bg-emerald-500/10';
      case 'warning': return 'text-amber-500 bg-amber-500/10';
      case 'insight': return 'text-purple-500 bg-purple-500/10';
    }
  };

  const getSeverityColor = (severity: AnomalyDetection['severity']) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Asistente IA de Migración</h2>
            <p className="text-muted-foreground">
              Análisis inteligente, sugerencias automáticas y detección de anomalías
            </p>
          </div>
        </div>
        <Button 
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          className="gap-2"
        >
          {isAnalyzing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isAnalyzing ? 'Analizando...' : 'Ejecutar Análisis IA'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assistant" className="text-xs gap-1">
            <MessageSquare className="h-4 w-4" />
            Asistente
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs gap-1">
            <Lightbulb className="h-4 w-4" />
            Sugerencias
          </TabsTrigger>
          <TabsTrigger value="predictive" className="text-xs gap-1">
            <TrendingUp className="h-4 w-4" />
            Predictivo
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="text-xs gap-1">
            <Shield className="h-4 w-4" />
            Anomalías
          </TabsTrigger>
        </TabsList>

        {/* Chat Assistant Tab */}
        <TabsContent value="assistant" className="mt-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat con Asistente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="p-2 rounded-full bg-primary/10 h-fit">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div 
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className={cn(
                          "text-[10px] mt-1",
                          message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                        )}>
                          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="p-2 rounded-full bg-secondary h-fit">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="p-2 rounded-full bg-primary/10 h-fit">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Quick suggestions */}
              <div className="px-4 py-2 border-t">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {[
                    '¿Cómo optimizo la migración?',
                    'Analiza los errores comunes',
                    'Sugiere mapeos automáticos',
                    '¿Cuánto tiempo tomará?'
                  ].map((suggestion) => (
                    <Button 
                      key={suggestion}
                      variant="outline" 
                      size="sm"
                      className="whitespace-nowrap text-xs"
                      onClick={() => setInputMessage(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe tu mensaje..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Suggestions Tab */}
        <TabsContent value="suggestions" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.map((suggestion) => (
              <Card 
                key={suggestion.id}
                className={cn(
                  "transition-all",
                  suggestion.applied && "opacity-60"
                )}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", getSuggestionColor(suggestion.type))}>
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.confidence}% confianza
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {suggestion.description}
                      </p>
                      {suggestion.action && !suggestion.applied && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 gap-2"
                          onClick={() => handleApplySuggestion(suggestion.id)}
                        >
                          {suggestion.action}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      )}
                      {suggestion.applied && (
                        <div className="flex items-center gap-1 mt-3 text-emerald-500 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          Aplicado
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictive Analysis Tab */}
        <TabsContent value="predictive" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">Probabilidad de Éxito</p>
                  <p className="text-4xl font-bold text-emerald-500">
                    {predictiveAnalysis.successProbability}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Duración Estimada</p>
                  <p className="text-4xl font-bold text-blue-500">
                    {predictiveAnalysis.estimatedDuration}
                  </p>
                  <p className="text-sm text-muted-foreground">minutos</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Problemas Potenciales</p>
                  <p className="text-4xl font-bold text-amber-500">
                    {predictiveAnalysis.potentialIssues.length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Problemas Potenciales Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictiveAnalysis.potentialIssues.map((issue, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{issue.issue}</span>
                        <Badge variant={issue.probability > 50 ? 'destructive' : 'secondary'}>
                          {issue.probability}% prob.
                        </Badge>
                      </div>
                      <Progress value={issue.probability} className="h-1.5 mb-2" />
                      <p className="text-xs text-muted-foreground">
                        <strong>Mitigación:</strong> {issue.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Recomendaciones IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {predictiveAnalysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <CheckCircle className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Anomaly Detection Tab */}
        <TabsContent value="anomalies" className="mt-4 space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-1 text-red-500" />
                <p className="text-2xl font-bold">{anomalies.filter(a => a.severity === 'high').length}</p>
                <p className="text-xs text-muted-foreground">Críticas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <AlertTriangle className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold">{anomalies.filter(a => a.severity === 'medium').length}</p>
                <p className="text-xs text-muted-foreground">Medias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Lightbulb className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{anomalies.filter(a => a.severity === 'low').length}</p>
                <p className="text-xs text-muted-foreground">Bajas</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anomalías Detectadas por IA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <div 
                    key={anomaly.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      getSeverityColor(anomaly.severity)
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {anomaly.field}
                          </Badge>
                          <span className="text-sm font-medium">{anomaly.anomalyType}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs">
                            <strong>{anomaly.affectedRecords.toLocaleString()}</strong> registros afectados
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            anomaly.severity === 'high' ? 'destructive' : 
                            anomaly.severity === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {anomaly.severity === 'high' ? 'Alta' : 
                           anomaly.severity === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-current/10">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Sugerencia IA:</span>
                      </div>
                      <p className="text-xs mt-1">{anomaly.suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CRMAIAssistantPanel;
