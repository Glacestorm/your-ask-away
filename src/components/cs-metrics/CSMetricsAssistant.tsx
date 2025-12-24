import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Trash2, 
  Sparkles,
  Bot,
  User,
  Calculator,
  BookOpen,
  TrendingUp,
  Target,
  HelpCircle
} from 'lucide-react';
import { useCSMetricsAssistant, QuickAction } from '@/hooks/useCSMetricsAssistant';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  explain: <BookOpen className="h-3 w-3" />,
  calculate: <Calculator className="h-3 w-3" />,
  compare: <TrendingUp className="h-3 w-3" />,
  recommend: <Target className="h-3 w-3" />,
  benchmark: <Sparkles className="h-3 w-3" />
};

interface CSMetricsAssistantProps {
  className?: string;
  compact?: boolean;
}

export function CSMetricsAssistant({ className, compact = false }: CSMetricsAssistantProps) {
  const {
    messages,
    isLoading,
    error,
    quickActions,
    sendMessage,
    clearHistory,
    useQuickAction
  } = useCSMetricsAssistant();

  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    useQuickAction(action);
  };

  const renderMessage = (message: typeof messages[0]) => {
    const isUser = message.role === 'user';
    
    return (
      <div
        key={message.id}
        className={cn(
          "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
          isUser ? "flex-row-reverse" : ""
        )}
      >
        <Avatar className={cn(
          "h-8 w-8 shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-purple-500 to-pink-500"
        )}>
          <AvatarFallback className="text-white">
            {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={cn(
          "flex flex-col gap-1 max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-sm" 
              : "bg-muted rounded-tl-sm"
          )}>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          <span className="text-xs text-muted-foreground px-1">
            {formatDistanceToNow(message.timestamp, { addSuffix: true, locale: es })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden border-border/50",
      compact ? "h-[500px]" : "h-[600px]",
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-3 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                CS Metrics Assistant
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  IA
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Pregunta sobre cualquier métrica de Customer Success
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearHistory}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="h-full p-4">
          {messages.length === 0 ? (
            <div className="space-y-4">
              {/* Welcome message */}
              <div className="text-center py-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">¡Hola! Soy tu asistente de métricas CS</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Puedo ayudarte a entender, calcular y comparar métricas de Customer Success.
                  ¿Qué te gustaría saber?
                </p>
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">Preguntas frecuentes</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAction(action)}
                      className="text-xs gap-1.5 h-8"
                    >
                      {CATEGORY_ICONS[action.category]}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(renderMessage)}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 bg-gradient-to-br from-purple-500 to-pink-500">
                    <AvatarFallback className="text-white">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input area */}
      <div className="p-4 border-t border-border/50 bg-muted/30">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu pregunta sobre métricas CS..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Quick action chips when there are messages */}
        {messages.length > 0 && (
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {quickActions.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction(action)}
                disabled={isLoading}
                className="text-xs shrink-0 h-7 px-2"
              >
                {CATEGORY_ICONS[action.category]}
                <span className="ml-1">{action.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

export default CSMetricsAssistant;
