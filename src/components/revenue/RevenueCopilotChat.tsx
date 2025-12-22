import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, RefreshCw, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { useRevenueCopilot, CopilotMessage } from '@/hooks/useRevenueCopilot';
import { cn } from '@/lib/utils';

const suggestedQuestions = [
  { icon: TrendingUp, text: '¿Cómo está el MRR este mes?', color: 'text-emerald-500' },
  { icon: AlertTriangle, text: '¿Qué cuentas están en riesgo?', color: 'text-amber-500' },
  { icon: Target, text: '¿Cuáles son las oportunidades de expansión?', color: 'text-blue-500' },
];

export const RevenueCopilotChat = () => {
  const { sendMessage, isLoading, startNewSession, currentSessionId } = useRevenueCopilot();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) return;

    const userMessage: CopilotMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const result = await sendMessage(messageText);
      const assistantMessage: CopilotMessage = { role: 'assistant', content: result.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch {
      const errorMessage: CopilotMessage = { role: 'assistant', content: 'Error al procesar tu consulta. Intenta de nuevo.' };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleNewSession = () => {
    startNewSession();
    setMessages([]);
  };

  return (
    <Card className="h-full flex flex-col border-primary/20">
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            Revenue Copilot
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleNewSession} disabled={isLoading}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <Sparkles className="h-8 w-8 mx-auto text-primary/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Pregúntame sobre métricas de revenue, cuentas en riesgo, o estrategias de crecimiento.
                </p>
              </div>
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    className="w-full justify-start gap-2 h-auto py-2.5 text-left"
                    onClick={() => handleSend(q.text)}
                    disabled={isLoading}
                  >
                    <q.icon className={cn('h-4 w-4', q.color)} />
                    <span className="text-sm">{q.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex gap-2',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="p-1.5 rounded-full bg-primary/10 h-fit">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-[85%] text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 items-center">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre revenue..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
