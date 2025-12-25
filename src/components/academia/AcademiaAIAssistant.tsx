/**
 * AcademiaAIAssistant - Asistente IA interactivo para Academia
 * Permite hacer preguntas, obtener resúmenes y sugerencias personalizadas
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  BookOpen,
  Lightbulb,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAcademia } from '@/hooks/useAcademia';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'summary' | 'suggestion';
}

interface AcademiaAIAssistantProps {
  courseContext?: string;
  lessonTitle?: string;
  lessonContent?: string;
  className?: string;
  defaultExpanded?: boolean;
}

export function AcademiaAIAssistant({
  courseContext = '',
  lessonTitle = '',
  lessonContent = '',
  className,
  defaultExpanded = false
}: AcademiaAIAssistantProps) {
  const { language } = useLanguage();
  const { answerQuestion, generateSummary, isLoading } = useAcademia();
  
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, type?: Message['type']) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);

    const response = await answerQuestion(userMessage, courseContext || lessonTitle);
    
    if (response) {
      addMessage('assistant', response);
    } else {
      addMessage('assistant', language === 'es' 
        ? 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.'
        : 'Sorry, I could not process your question. Please try again.'
      );
    }
  }, [inputValue, isLoading, courseContext, lessonTitle, answerQuestion, addMessage, language]);

  const handleGenerateSummary = useCallback(async () => {
    if (!lessonContent || isLoading) return;

    addMessage('user', language === 'es' ? 'Genera un resumen de esta lección' : 'Generate a summary of this lesson');

    const summary = await generateSummary(lessonContent, lessonTitle);
    
    if (summary) {
      const formattedSummary = `
**${language === 'es' ? 'Resumen' : 'Summary'}:**
${summary.summary}

**${language === 'es' ? 'Puntos Clave' : 'Key Points'}:**
${summary.keyPoints.map(p => `• ${p}`).join('\n')}

**${language === 'es' ? 'Acciones Sugeridas' : 'Action Items'}:**
${summary.actionItems.map(a => `✓ ${a}`).join('\n')}
      `.trim();
      
      addMessage('assistant', formattedSummary, 'summary');
    } else {
      addMessage('assistant', language === 'es'
        ? 'No pude generar el resumen. Intenta de nuevo.'
        : 'Could not generate summary. Please try again.'
      );
    }
  }, [lessonContent, lessonTitle, isLoading, generateSummary, addMessage, language]);

  const quickActions = [
    {
      icon: FileText,
      label: language === 'es' ? 'Resumir lección' : 'Summarize lesson',
      action: handleGenerateSummary,
      disabled: !lessonContent
    },
    {
      icon: Lightbulb,
      label: language === 'es' ? '¿Qué aprenderé?' : 'What will I learn?',
      action: () => {
        setInputValue(language === 'es' 
          ? '¿Cuáles son los conceptos principales de esta lección?'
          : 'What are the main concepts of this lesson?'
        );
      },
      disabled: false
    },
    {
      icon: BookOpen,
      label: language === 'es' ? 'Explicar más' : 'Explain more',
      action: () => {
        setInputValue(language === 'es'
          ? 'Explica este tema con más detalle y ejemplos prácticos'
          : 'Explain this topic in more detail with practical examples'
        );
      },
      disabled: false
    }
  ];

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn("fixed bottom-6 right-6 z-50", className)}
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg hover:shadow-xl"
        >
          <Bot className="h-6 w-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed z-50 transition-all duration-300",
        isExpanded 
          ? "inset-4" 
          : "bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)]",
        className
      )}
    >
      <Card className="h-full flex flex-col bg-slate-900/95 backdrop-blur-xl border-slate-700 shadow-2xl">
        <CardHeader className="pb-2 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm text-white">
                  {language === 'es' ? 'Tutor IA' : 'AI Tutor'}
                </CardTitle>
                <p className="text-xs text-slate-400">
                  {language === 'es' ? 'Pregúntame lo que quieras' : 'Ask me anything'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="p-4 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 mb-3">
                {language === 'es' ? 'Acciones rápidas:' : 'Quick actions:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    disabled={action.disabled || isLoading}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className={cn("flex-1 p-4", isExpanded ? "h-[calc(100vh-280px)]" : "h-64")}>
            <div ref={scrollRef} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      message.role === 'user'
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-800 text-slate-100"
                    )}>
                      {message.type === 'summary' ? (
                        <div className="text-sm whitespace-pre-line">
                          {message.content}
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p className="text-[10px] opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  </div>
                  <div className="bg-slate-800 rounded-2xl px-4 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-slate-700/50">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="flex gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={language === 'es' ? 'Escribe tu pregunta...' : 'Type your question...'}
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() || isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default AcademiaAIAssistant;
