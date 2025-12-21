import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { question: string; answer: string }[];
}

const SUGGESTED_QUESTIONS = [
  '¿Qué coste tiene implementar Odoo?',
  '¿Cuánto tarda una implementación?',
  '¿Puedo migrar desde otro ERP?',
  '¿Qué soporte ofrecéis?',
];

const FAQChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Generate a unique session ID for this visitor
    const stored = sessionStorage.getItem('faq_session_id');
    if (stored) return stored;
    const newId = crypto.randomUUID?.() || Date.now().toString(36);
    sessionStorage.setItem('faq_session_id', newId);
    return newId;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // First, search for matching FAQs
      const { data: matchingFaqs } = await supabase
        .from('faqs')
        .select('id, question, answer')
        .eq('is_published', true)
        .textSearch('question', question.split(' ').join(' | '), {
          type: 'websearch',
          config: 'spanish'
        })
        .limit(3);

      // Store the visitor question
      await supabase.from('visitor_questions').insert({
        question,
        session_id: sessionId,
        source: 'faq_chatbot',
        matched_faq_id: matchingFaqs?.[0]?.id || null,
        user_agent: navigator.userAgent,
      });

      // Call the FAQ chat edge function
      const { data, error } = await supabase.functions.invoke('faq-chat', {
        body: {
          question,
          sessionId,
          matchingFaqs: matchingFaqs || [],
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: Date.now().toString() + '_assistant',
        role: 'assistant',
        content: data.response || 'Lo siento, no he podido procesar tu pregunta. Por favor, inténtalo de nuevo.',
        sources: data.sources,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update visitor question with response
      if (data.response) {
        await supabase
          .from('visitor_questions')
          .update({
            response: data.response,
            resolved: true,
            confidence_score: data.confidence || 0.8,
          })
          .eq('session_id', sessionId)
          .eq('question', question);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'Ha ocurrido un error. Por favor, inténtalo de nuevo o contacta con nosotros directamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-emerald-500 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-50 bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden transition-all duration-300 ${
              isExpanded
                ? 'bottom-0 right-0 w-full h-full md:bottom-6 md:right-6 md:w-[500px] md:h-[700px] md:rounded-2xl'
                : 'bottom-6 right-6 w-[380px] h-[550px] rounded-2xl'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-emerald-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Asistente ObelixIA</h3>
                  <p className="text-xs text-slate-400">Respuestas inteligentes 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  {isExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 h-[calc(100%-140px)]" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-white mb-2">
                      ¡Hola! Soy el asistente de ObelixIA
                    </h4>
                    <p className="text-sm text-slate-400 mb-6">
                      Pregúntame sobre nuestros servicios, implementaciones o cualquier duda que tengas.
                    </p>
                    <div className="space-y-2">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="block w-full text-left px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-slate-300 hover:bg-slate-700/50 hover:border-primary/50 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-white'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-600/50">
                            <p className="text-xs text-slate-400 mb-2">
                              Basado en nuestras FAQs:
                            </p>
                            {message.sources.map((source, i) => (
                              <p
                                key={i}
                                className="text-xs text-primary/80 truncate"
                              >
                                • {source.question}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-slate-400">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary"
                  disabled={isLoading}
                />
                <Button
                  onClick={() => sendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  className="h-10 w-10 p-0 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Limpiar conversación
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FAQChatWidget;
