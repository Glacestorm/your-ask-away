/**
 * ModuleCopilotPanel - AI Copilot Chat Panel for Module Studio
 * Floating panel with AI chat, suggestions, and quick actions
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  Lightbulb,
  Wrench,
  FileText,
  AlertTriangle,
  Zap,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Activity,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useModuleCopilot, ModuleContext, CopilotMessage, CopilotSuggestion, CopilotFix, ModuleAnalysis } from '@/hooks/admin/useModuleCopilot';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleCopilotPanelProps {
  moduleContext: ModuleContext | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export function ModuleCopilotPanel({
  moduleContext,
  isExpanded = false,
  onToggleExpand,
  className,
}: ModuleCopilotPanelProps) {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isProcessing,
    currentAnalysis,
    activeSuggestions,
    pendingFixes,
    lastRefresh,
    quickActions,
    analyzeModule,
    suggestImprovements,
    autoFix,
    generateDocumentation,
    predictConflicts,
    naturalLanguageEdit,
    optimizeDependencies,
    applySuggestion,
    applyFix,
    dismissSuggestion,
    dismissFix,
    setContext,
    clearMessages,
  } = useModuleCopilot();

  // Update context when module changes
  useEffect(() => {
    setContext(moduleContext);
  }, [moduleContext, setContext]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    
    const message = input.trim();
    setInput('');
    
    await naturalLanguageEdit(message);
  }, [input, isProcessing, naturalLanguageEdit]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy message content
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado al portapapeles');
  };

  // Render message
  const renderMessage = (message: CopilotMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex gap-2 p-3 rounded-lg',
          isUser && 'bg-primary/10 ml-8',
          !isUser && !isSystem && 'bg-muted/50 mr-4',
          isSystem && 'bg-amber-500/10 text-amber-700 dark:text-amber-300 text-sm italic'
        )}
      >
        {!isUser && !isSystem && (
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {isUser ? 'Tú' : isSystem ? 'Sistema' : 'AI Copilot'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: es })}
            </span>
            {message.action && (
              <Badge variant="outline" className="text-xs">
                {message.action.replace('_', ' ')}
              </Badge>
            )}
          </div>
          
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Message actions */}
          {!isSystem && (
            <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => copyMessage(message.content)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              {!isUser && (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Render analysis
  const renderAnalysis = (analysis: ModuleAnalysis) => {
    const categoryLabels: Record<string, string> = {
      architecture: 'Arquitectura',
      dependencies: 'Dependencias',
      documentation: 'Documentación',
      security: 'Seguridad',
      performance: 'Rendimiento',
      maintainability: 'Mantenibilidad',
    };

    const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-500';
      if (score >= 60) return 'text-amber-500';
      return 'text-red-500';
    };

    return (
      <div className="space-y-4">
        {/* Overall Score */}
        <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
          <div className={cn('text-4xl font-bold', getScoreColor(analysis.overallScore))}>
            {analysis.overallScore}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Puntuación General</p>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(analysis.categories).map(([key, value]) => (
            <div key={key} className="p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">{categoryLabels[key]}</span>
                <span className={cn('text-xs font-medium', getScoreColor(value))}>
                  {value}%
                </span>
              </div>
              <Progress value={value} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Fortalezas
            </h4>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Debilidades
            </h4>
            <ul className="space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-muted-foreground">• {w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <div>
            <h4 className="text-xs font-medium mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Recomendaciones
            </h4>
            <ul className="space-y-1">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="text-xs text-muted-foreground">
                  {i + 1}. {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render suggestion card
  const renderSuggestion = (suggestion: CopilotSuggestion) => {
    const typeIcons = {
      improvement: Lightbulb,
      optimization: Zap,
      security: AlertTriangle,
      compatibility: CheckCircle,
      performance: Activity,
    };
    const Icon = typeIcons[suggestion.type];

    const impactColors = {
      low: 'bg-blue-500/10 text-blue-600',
      medium: 'bg-amber-500/10 text-amber-600',
      high: 'bg-red-500/10 text-red-600',
    };

    return (
      <motion.div
        key={suggestion.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-sm">{suggestion.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => dismissSuggestion(suggestion.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn('text-xs', impactColors[suggestion.impact])}>
              Impacto: {suggestion.impact}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Esfuerzo: {suggestion.effort}
            </Badge>
          </div>
          
          {suggestion.autoApplicable && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => applySuggestion(suggestion.id)}
              disabled={isProcessing}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Aplicar
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  // Render fix card
  const renderFix = (fix: CopilotFix) => {
    const riskColors = {
      safe: 'text-green-600 bg-green-500/10',
      moderate: 'text-amber-600 bg-amber-500/10',
      risky: 'text-red-600 bg-red-500/10',
    };

    return (
      <motion.div
        key={fix.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className={cn(
          'p-3 border rounded-lg',
          fix.applied ? 'bg-green-500/5 border-green-500/30' : 'bg-card'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{fix.issue}</span>
              {fix.applied && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Aplicada
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{fix.solution}</p>
          </div>
          
          {!fix.applied && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => dismissFix(fix.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {!fix.applied && (
          <div className="flex items-center justify-between mt-3">
            <Badge variant="outline" className={cn('text-xs', riskColors[fix.riskLevel])}>
              Riesgo: {fix.riskLevel}
            </Badge>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => applyFix(fix.id)}
              disabled={isProcessing}
            >
              Aplicar Fix
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  // No module selected state
  if (!moduleContext) {
    return (
      <Card className={cn('border-dashed opacity-60', className)}>
        <CardContent className="py-8 text-center">
          <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un módulo para activar el Copilot IA
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'transition-all duration-300 flex flex-col',
      isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : '',
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI Copilot</CardTitle>
              <p className="text-xs text-muted-foreground">
                {moduleContext.moduleName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isProcessing && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Procesando
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => clearMessages()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleExpand}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Quick Actions */}
        <div className="px-3 py-2 border-b bg-muted/30 flex-shrink-0">
          <div className="flex flex-wrap gap-1">
            {quickActions.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => action.action()}
                disabled={isProcessing}
              >
                {action.id === 'analyze' && <Brain className="h-3 w-3 mr-1" />}
                {action.id === 'suggest' && <Lightbulb className="h-3 w-3 mr-1" />}
                {action.id === 'autofix' && <Wrench className="h-3 w-3 mr-1" />}
                {action.id === 'docs' && <FileText className="h-3 w-3 mr-1" />}
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 mx-3 mt-2 flex-shrink-0" style={{ width: 'calc(100% - 24px)' }}>
            <TabsTrigger value="chat" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Análisis
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs">
              <Lightbulb className="h-3 w-3 mr-1" />
              Ideas ({activeSuggestions.length})
            </TabsTrigger>
            <TabsTrigger value="fixes" className="text-xs">
              <Wrench className="h-3 w-3 mr-1" />
              Fixes ({pendingFixes.filter(f => !f.applied).length})
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0 min-h-0 px-3 pb-3">
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="space-y-3 py-3 group">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">¡Hola! Soy tu asistente IA.</p>
                    <p className="text-xs mt-1">
                      Puedo analizar, sugerir mejoras y ayudarte a editar este módulo.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {messages.map(renderMessage)}
                  </AnimatePresence>
                )}
                
                {isProcessing && (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2 pt-2 border-t flex-shrink-0">
              <Input
                ref={inputRef}
                placeholder="Escribe una instrucción... Ej: 'Añade soporte multi-idioma'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="flex-1 mt-0 min-h-0 px-3 pb-3">
            <ScrollArea className="h-full">
              <div className="py-3">
                {currentAnalysis ? (
                  renderAnalysis(currentAnalysis)
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No hay análisis disponible
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzeModule()}
                      disabled={isProcessing}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analizar Módulo
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="flex-1 mt-0 min-h-0 px-3 pb-3">
            <ScrollArea className="h-full">
              <div className="space-y-3 py-3">
                {activeSuggestions.length > 0 ? (
                  <AnimatePresence>
                    {activeSuggestions.map(renderSuggestion)}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No hay sugerencias activas
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => suggestImprovements()}
                      disabled={isProcessing}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Obtener Sugerencias
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Fixes Tab */}
          <TabsContent value="fixes" className="flex-1 mt-0 min-h-0 px-3 pb-3">
            <ScrollArea className="h-full">
              <div className="space-y-3 py-3">
                {pendingFixes.length > 0 ? (
                  <AnimatePresence>
                    {pendingFixes.map(renderFix)}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-8">
                    <Wrench className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground mb-3">
                      No hay correcciones pendientes
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => autoFix()}
                      disabled={isProcessing}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Buscar Correcciones
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleCopilotPanel;
