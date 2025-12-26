/**
 * Advanced Copilot Panel - FASE 12
 * Enterprise AI Copilot with multi-modal capabilities
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  Sparkles, 
  Send,
  Maximize2,
  Minimize2,
  Bot,
  User,
  Paperclip,
  Mic
} from 'lucide-react';
import { useAdvancedCopilot, CopilotMessage } from '@/hooks/admin/advanced/useAdvancedCopilot';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvancedCopilotPanelProps {
  context?: {
    entityId: string;
    entityName?: string;
    currentData?: Record<string, unknown>;
  } | null;
  className?: string;
}

export function AdvancedCopilotPanel({ context, className }: AdvancedCopilotPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');

  const {
    isLoading,
    messages,
    suggestions,
    sendMessage,
    generateSuggestions,
    clearConversation
  } = useAdvancedCopilot();

  useEffect(() => {
    if (context?.entityId) {
      generateSuggestions();
    }
  }, [context?.entityId, generateSuggestions]);

  const handleSend = useCallback(async () => {
    if (!inputMessage.trim()) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
  }, [inputMessage, sendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <Bot className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Copilot inactivo</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                AI Copilot Avanzado
                <Badge variant="secondary" className="text-xs">Enterprise</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Asistente inteligente multimodal
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => clearConversation()}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3 flex flex-col", isExpanded ? "h-[calc(100%-80px)]" : "h-[400px]")}>
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-2 mb-3">
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                <p className="text-sm text-muted-foreground">
                  ¿En qué puedo ayudarte hoy?
                </p>
                {suggestions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <Button
                        key={suggestion.id}
                        variant="outline"
                        size="sm"
                        className="w-full text-left justify-start"
                        onClick={() => setInputMessage(suggestion.title)}
                      >
                        <Sparkles className="h-3 w-3 mr-2 text-primary" />
                        {suggestion.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg: CopilotMessage) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted"
                  )}>
                    {msg.content}
                    <p className="text-[10px] opacity-60 mt-1">
                      {formatDistanceToNow(new Date(msg.timestamp), { locale: es, addSuffix: true })}
                    </p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="p-1.5 rounded-full bg-secondary h-fit">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-100" />
                    <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="flex gap-2 items-center border-t pt-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Escribe tu mensaje..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
            disabled={isLoading}
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Mic className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            className="h-8 w-8 shrink-0"
            onClick={handleSend}
            disabled={isLoading || !inputMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedCopilotPanel;
