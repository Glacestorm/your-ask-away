/**
 * AccountingChatbot - Chatbot IA especializado en contabilidad
 * Responde consultas sobre normativa, asientos, cuentas y procedimientos
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bot,
  User,
  Send,
  Sparkles,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Mic,
  MicOff,
  Copy,
  Check,
  BookOpen,
  Calculator,
  FileText,
  AlertTriangle,
  HelpCircle,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  sources?: string[];
}

interface AccountingChatbotProps {
  country?: string;
  companyName?: string;
  installedModules?: string[];
  className?: string;
}

const QUICK_QUESTIONS = [
  { icon: Calculator, label: 'Crear asiento', query: '¿Cómo crear un asiento contable de venta?' },
  { icon: FileText, label: 'IVA', query: '¿Cuáles son los tipos de IVA vigentes?' },
  { icon: BookOpen, label: 'PGC', query: '¿Qué estructura tiene el Plan General Contable?' },
  { icon: AlertTriangle, label: 'Cierre', query: '¿Cómo realizar el cierre contable del ejercicio?' },
];

export function AccountingChatbot({
  country = 'España',
  companyName,
  installedModules = [],
  className
}: AccountingChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mensaje de bienvenida
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `¡Hola! 👋 Soy tu asistente contable IA. Estoy especializado en:

• **Normativa contable** de ${country}
• **Plan General Contable** y cuentas
• **Asientos contables** y partida doble
• **Obligaciones fiscales** (IVA, IRPF, IS)
• **Estados financieros** (Balance, PyG, ECPN)
• **Procedimientos** de cierre y regularización

${installedModules.length > 0 ? `\n📦 Módulos activos: ${installedModules.join(', ')}` : ''}

¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [country, installedModules]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Construir contexto con módulos instalados
      const moduleContext = installedModules.length > 0
        ? `Módulos ERP activos: ${installedModules.join(', ')}`
        : 'Sin módulos específicos';

      const systemPrompt = `Eres un experto contable y asesor fiscal especializado en ${country}. 
Tu rol es ayudar con consultas sobre:
- Plan General Contable (PGC) y normativa local
- Asientos contables y partida doble
- Obligaciones fiscales (IVA, IRPF, Impuesto de Sociedades)
- Estados financieros y cierres contables
- Normativas internacionales (NIIF/IFRS) cuando aplique

Contexto actual:
- País: ${country}
${companyName ? `- Empresa: ${companyName}` : ''}
- ${moduleContext}

IMPORTANTE:
1. Responde siempre en español
2. Cita normativas específicas cuando sea relevante (ej: PGC, Ley del IVA, etc.)
3. Incluye ejemplos prácticos con asientos cuando sea útil
4. Usa formato Markdown para estructurar respuestas
5. Si no estás seguro, indícalo claramente
6. Para preguntas sobre módulos ERP específicos, explica cómo se integran con la contabilidad`;

      const conversationHistory = messages
        .filter(m => !m.isLoading && m.id !== 'welcome')
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const { data, error } = await supabase.functions.invoke('obelixia-vertical-copilot', {
        body: {
          action: 'chat',
          verticalType: 'accounting',
          message: messageText,
          systemPrompt,
          conversationHistory,
          context: {
            country,
            companyName,
            installedModules,
          }
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'Lo siento, no pude procesar tu consulta.',
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages(prev => prev.filter(m => !m.isLoading).concat(assistantMessage));
    } catch (err) {
      console.error('[AccountingChatbot] Error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Error al procesar tu consulta. Por favor, inténtalo de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(m => !m.isLoading).concat(errorMessage));
      toast.error('Error al conectar con el asistente');
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, country, companyName, installedModules]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (query: string) => {
    sendMessage(query);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copiado al portapapeles');
    } catch {
      toast.error('Error al copiar');
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success('Conversación limpiada');
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Tu navegador no soporta reconocimiento de voz');
      return;
    }

    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error('Error en reconocimiento de voz');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-300",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "h-[500px]",
      className
    )}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-emerald-500/30">
                <AvatarImage src="/accounting-bot-avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full ring-2 ring-background" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Asistente Contable IA
                <Sparkles className="h-4 w-4 text-amber-500" />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Especialista en normativa de {country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-8 w-8"
              title="Limpiar chat"
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

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.role === 'assistant' ? (
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}>
                  {message.isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                        {message.content}
                      </div>
                      {message.role === 'assistant' && !message.isLoading && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(message.timestamp, { locale: es, addSuffix: true })}
                          </span>
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
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick questions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, idx) => {
                const Icon = q.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 gap-1"
                    onClick={() => handleQuickQuestion(q.query)}
                    disabled={isLoading}
                  >
                    <Icon className="h-3 w-3" />
                    {q.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-background/80 backdrop-blur">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta contable..."
                disabled={isLoading}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7",
                  isListening && "text-red-500"
                )}
                onClick={toggleVoice}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="submit" disabled={!input.trim() || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default AccountingChatbot;
