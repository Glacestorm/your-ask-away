import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Bot, Send, Loader2, Globe, Sparkles, X, User, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; title: string }[];
  timestamp: Date;
}

interface StrategicAssistantChatProps {
  context: 'dafo' | 'business-plan' | 'financial' | 'scenarios';
  projectName?: string;
  projectData?: any;
}

const CONTEXT_PROMPTS = {
  dafo: 'Estás ayudando con un análisis DAFO. Asiste en identificar fortalezas, debilidades, oportunidades y amenazas.',
  'business-plan': 'Estás evaluando un Business Plan. Ayuda a analizar las 10 dimensiones clave de viabilidad.',
  financial: 'Estás trabajando en un modelo financiero. Asiste con proyecciones, ratios y estados financieros.',
  scenarios: 'Estás simulando escenarios financieros. Ayuda a analizar sensibilidad y predicciones.'
};

export function StrategicAssistantChat({ context, projectName, projectData }: StrategicAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('strategic-assistant', {
        body: {
          message: input,
          context,
          projectName,
          projectData,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Error al procesar tu mensaje');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('strategic-assistant', {
        body: {
          message: query,
          context,
          projectName,
          webSearchEnabled: true,
          conversationHistory: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Web search error:', err);
      toast.error('Error en búsqueda web');
    } finally {
      setIsSearching(false);
    }
  };

  const suggestedQuestions = {
    dafo: [
      '¿Qué fortalezas debería considerar para mi sector?',
      '¿Cuáles son las principales amenazas del mercado actual?',
      'Busca tendencias de mercado para mi sector'
    ],
    'business-plan': [
      '¿Cómo mejoro la puntuación de viabilidad?',
      '¿Qué debería incluir en el análisis de mercado?',
      'Busca datos de mercado para mi sector'
    ],
    financial: [
      '¿Cómo interpreto el ratio de liquidez?',
      '¿Qué márgenes son normales en mi sector?',
      'Busca benchmarks financieros del sector'
    ],
    scenarios: [
      '¿Qué variables afectan más a la rentabilidad?',
      '¿Cómo calculo el VAN y TIR correctamente?',
      '¿Qué escenario debería presentar a inversores?'
    ]
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 fixed bottom-20 right-6 z-40 shadow-lg">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">Asistente IA</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Asistente de Planificación
            <Badge variant="secondary" className="ml-2">{context}</Badge>
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Soy tu asistente para planificación estratégica. Puedo ayudarte con análisis, 
                buscar información en internet y guiarte en cada paso.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Sugerencias:</p>
                {suggestedQuestions[context].map((q, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 text-xs"
                    onClick={() => {
                      if (q.startsWith('Busca')) {
                        handleWebSearch(q);
                      } else {
                        setInput(q);
                      }
                    }}
                  >
                    {q.startsWith('Busca') && <Globe className="h-3 w-3 mr-2 text-blue-500" />}
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Globe className="h-3 w-3" /> Fuentes:
                        </p>
                        {msg.sources.map((source, i) => (
                          <a
                            key={i}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-500 hover:underline truncate"
                          >
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            {source.title || source.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {(isLoading || isSearching) && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      {isSearching ? 'Buscando en internet...' : 'Pensando...'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta..."
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => handleWebSearch(input || `información sobre ${context} para ${projectName || 'mi proyecto'}`)}
              disabled={isSearching}
            >
              <Globe className="h-3 w-3" />
              Buscar en web
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
