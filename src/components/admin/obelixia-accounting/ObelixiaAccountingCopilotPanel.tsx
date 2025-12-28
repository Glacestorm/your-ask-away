/**
 * ObelixIA Accounting Copilot Panel
 * Panel de chat inteligente para contabilidad
 * Fase 1: AI Accounting Copilot
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RefreshCw,
  MessageSquare,
  Lightbulb,
  History,
  X,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  FileText,
  Receipt,
  TrendingUp,
  AlertTriangle,
  GitMerge,
  Lock,
  PenTool,
  Trash2,
  Plus
} from 'lucide-react';
import { useObelixiaAccountingCopilot, type QuickAction, type CopilotMessage, type CopilotSuggestion } from '@/hooks/admin/obelixia-accounting/useObelixiaAccountingCopilot';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ObelixiaAccountingCopilotPanelProps {
  fiscalConfigId?: string;
  accountId?: string;
  entryId?: string;
  className?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

// Iconos para quick actions
const QUICK_ACTION_ICONS: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  PenTool: <PenTool className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  GitMerge: <GitMerge className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Lock: <Lock className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />
};

// Colores por prioridad
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
};

export function ObelixiaAccountingCopilotPanel({
  fiscalConfigId,
  accountId,
  entryId,
  className,
  onClose,
  isExpanded = false,
  onToggleExpand
}: ObelixiaAccountingCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    conversations,
    activeConversationId,
    quickActions,
    suggestions,
    isLoading,
    isStreaming,
    streamingContent,
    setContext,
    fetchQuickActions,
    fetchConversations,
    fetchSuggestions,
    loadConversation,
    sendMessage,
    executeQuickAction,
    acceptSuggestion,
    rejectSuggestion,
    provideFeedback,
    startNewConversation,
    deleteConversation
  } = useObelixiaAccountingCopilot();

  // Establecer contexto
  useEffect(() => {
    setContext({
      fiscalConfigId,
      accountId,
      entryId
    });
  }, [fiscalConfigId, accountId, entryId, setContext]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchQuickActions();
    fetchConversations();
    fetchSuggestions();
  }, [fetchQuickActions, fetchConversations, fetchSuggestions]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  }, [inputValue, isLoading, sendMessage]);

  // Manejar Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Renderizar mensaje
  const renderMessage = (msg: CopilotMessage, index: number) => {
    const isUser = msg.role === 'user';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex gap-3 p-3",
          isUser ? "flex-row-reverse" : ""
        )}
      >
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={cn(
          "flex-1 max-w-[80%]",
          isUser ? "text-right" : ""
        )}>
          <div className={cn(
            "inline-block p-3 rounded-lg text-sm",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-none" 
              : "bg-muted rounded-tl-none"
          )}>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>

          {/* Metadata y feedback */}
          {!isUser && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(msg.timestamp, { locale: es, addSuffix: true })}
              </span>
              {msg.metadata?.latency_ms && (
                <span className="text-xs text-muted-foreground">
                  • {msg.metadata.latency_ms}ms
                </span>
              )}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6",
                          msg.feedback === 'positive' && "text-emerald-500"
                        )}
                        onClick={() => provideFeedback(msg.id, 'positive')}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Útil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6",
                          msg.feedback === 'negative' && "text-red-500"
                        )}
                        onClick={() => provideFeedback(msg.id, 'negative')}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>No útil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-300 overflow-hidden h-full border-0 shadow-none",
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-2 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">ObelixIA Copilot</CardTitle>
              <p className="text-xs text-muted-foreground">
                Asistente contable inteligente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startNewConversation}
                    className="h-8 w-8"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Nueva conversación</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleExpand}
                className="h-8 w-8"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-3 grid grid-cols-3">
            <TabsTrigger value="chat" className="text-xs flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-xs flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Sugerencias
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs flex items-center gap-1">
              <History className="h-3 w-3" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab: Chat */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
            {/* Quick Actions */}
            {messages.length === 0 && quickActions.length > 0 && (
              <div className="px-3 pt-3">
                <p className="text-xs text-muted-foreground mb-2">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.slice(0, 6).map((qa) => (
                    <Button
                      key={qa.id}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-auto py-2 px-3"
                      onClick={() => executeQuickAction(qa)}
                      disabled={isLoading}
                    >
                      {QUICK_ACTION_ICONS[qa.icon] || <Sparkles className="h-4 w-4" />}
                      <span className="ml-2 truncate">{qa.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-1">
              <div className="py-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-600/20 mb-4">
                      <Bot className="h-8 w-8 text-violet-500" />
                    </div>
                    <h3 className="font-medium mb-1">¡Hola! Soy tu copilot contable</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      Pregúntame sobre asientos, balances, impuestos, conciliación o cualquier duda contable.
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((msg, index) => renderMessage(msg, index))}
                </AnimatePresence>

                {/* Streaming content */}
                {isStreaming && streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 p-3"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg rounded-tl-none bg-muted text-sm">
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {streamingContent}
                          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Loading */}
                {isLoading && !isStreaming && (
                  <div className="flex gap-3 p-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg rounded-tl-none bg-muted text-sm">
                        <span className="text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Suggestions */}
          <TabsContent value="suggestions" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Sugerencias activas</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSuggestions}
                    className="h-8"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Actualizar
                  </Button>
                </div>

                {suggestions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Lightbulb className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay sugerencias pendientes
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {suggestions.map((suggestion) => (
                      <Card key={suggestion.id} className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={PRIORITY_COLORS[suggestion.priority]}>
                              {suggestion.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.type}
                            </Badge>
                          </div>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{suggestion.title}</h4>
                        <p className="text-xs text-muted-foreground mb-3">
                          {suggestion.description}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() => acceptSuggestion(suggestion.id)}
                          >
                            Aceptar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => rejectSuggestion(suggestion.id)}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Tab: History */}
          <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <History className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No hay conversaciones anteriores
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                        activeConversationId === conv.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                      onClick={() => {
                        loadConversation(conv.id);
                        setActiveTab('chat');
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {conv.messagesCount} mensajes
                          {conv.lastMessageAt && (
                            <> • {formatDistanceToNow(conv.lastMessageAt, { locale: es, addSuffix: true })}</>
                          )}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ObelixiaAccountingCopilotPanel;
