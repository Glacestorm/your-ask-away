/**
 * Asistente de IA Local integrado en el CRM
 * 
 * Chat con IA local (Ollama) o fallback a Lovable AI.
 * Incluye acciones rápidas contextuales y streaming de respuestas.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Sparkles,
  Send,
  Trash2,
  Settings,
  Loader2,
  Bot,
  User,
  Zap,
  Wifi,
  WifiOff,
  Cloud,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { useLocalAI, type LocalAIContext, type AIMessage } from '@/hooks/admin/useLocalAI';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AIAssistantLocalProps {
  context?: LocalAIContext;
  className?: string;
  compact?: boolean;
  onOpenSettings?: () => void;
}

export function AIAssistantLocal({ 
  context, 
  className, 
  compact = false,
  onOpenSettings 
}: AIAssistantLocalProps) {
  const {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
    connectionStatus,
    quickActions,
    cancelRequest,
  } = useLocalAI();

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message, context);
    inputRef.current?.focus();
  }, [input, isLoading, sendMessage, context]);

  const handleQuickAction = useCallback(async (prompt: string) => {
    await sendMessage(prompt, context);
  }, [sendMessage, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copiado al portapapeles');
  };

  const getConnectionIcon = () => {
    if (connectionStatus.connected) return <Wifi className="h-3.5 w-3.5 text-green-500" />;
    if (connectionStatus.source === 'fallback') return <Cloud className="h-3.5 w-3.5 text-yellow-500" />;
    return <WifiOff className="h-3.5 w-3.5 text-red-500" />;
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 p-3 rounded-lg",
          isUser ? "bg-primary/5" : "bg-muted/50"
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-accent"}>
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {isUser ? 'Tú' : 'Asistente IA'}
              </span>
              {!isUser && message.source && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {message.source === 'local' ? 'Local' : 'Cloud'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(message.timestamp), 'HH:mm', { locale: es })}
              </span>
              {!isUser && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(message.content, message.id)}
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
          <div className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  const AssistantContent = () => (
    <>
      {/* Messages Area */}
      <ScrollArea 
        className={cn(
          "flex-1 pr-4",
          compact ? "h-[250px]" : isExpanded ? "h-[calc(100vh-300px)]" : "h-[350px]"
        )}
        ref={scrollRef as any}
      >
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/50" />
              <p className="text-sm text-muted-foreground mb-4">
                ¿En qué puedo ayudarte hoy?
              </p>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {quickActions.slice(0, 4).map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 text-xs justify-start"
                    onClick={() => handleQuickAction(action.prompt)}
                    disabled={isLoading}
                  >
                    <Zap className="h-3 w-3 mr-1.5 text-primary" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          
          {isLoading && (
            <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-accent">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Pensando...</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelRequest}
                  className="text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions Bar */}
      {messages.length > 0 && !compact && (
        <div className="flex gap-2 py-2 overflow-x-auto">
          {quickActions.slice(0, 3).map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              className="h-7 text-xs shrink-0"
              onClick={() => handleQuickAction(action.prompt)}
              disabled={isLoading}
            >
              <Zap className="h-3 w-3 mr-1" />
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 pt-2 border-t">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          disabled={isLoading}
          className="flex-1"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Enviar mensaje</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );

  if (compact) {
    return (
      <Card className={cn("flex flex-col", className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Asistente IA</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={clearMessages}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-0">
          <AssistantContent />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn("flex flex-col", className)}>
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  Asistente IA del CRM
                  <Badge variant="outline" className="text-[10px]">
                    {connectionStatus.connected ? 'Ollama' : 
                     connectionStatus.source === 'fallback' ? 'Cloud' : 'Offline'}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {context?.entityType && `Contexto: ${context.entityType}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {getConnectionIcon()}
              {onOpenSettings && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearMessages}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsExpanded(true)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col pt-3">
          <AssistantContent />
        </CardContent>
      </Card>

      {/* Expanded Dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Asistente IA del CRM
                <Badge variant="outline" className="text-xs">
                  {connectionStatus.connected ? 'Local' : 'Cloud'}
                </Badge>
              </DialogTitle>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearMessages}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 flex flex-col overflow-hidden">
            <AssistantContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AIAssistantLocal;
