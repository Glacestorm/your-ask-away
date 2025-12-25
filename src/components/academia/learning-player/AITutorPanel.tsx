/**
 * AITutorPanel - Panel del tutor IA especializado por curso
 * Usa Lovable AI con RAG para respuestas contextuales
 */

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Loader2, Sparkles, 
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  BookOpen, HelpCircle, Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCourseChatbot, ChatMessage } from '@/hooks/useCourseChatbot';

interface AITutorPanelProps {
  courseId: string;
  currentLessonId: string;
  currentLessonTitle: string;
  courseTitle?: string;
  courseTopic?: string;
}

const suggestedQuestions = [
  { icon: HelpCircle, text: "Explícame este concepto de forma sencilla" },
  { icon: Lightbulb, text: "Dame un ejemplo práctico" },
  { icon: Code, text: "Muéstrame una implementación" },
  { icon: BookOpen, text: "¿Qué debería aprender después?" },
];

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  courseId,
  currentLessonId,
  currentLessonTitle,
  courseTitle = "Curso",
  courseTopic = "CRM",
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    sendMessage,
    clearChat,
    provideFeedback,
  } = useCourseChatbot({
    courseId,
    courseTitle,
    lessonId: currentLessonId,
    lessonTitle: currentLessonTitle,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isLoading) return;
    setInputValue('');
    await sendMessage(content);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado al portapapeles');
  };

  const showSuggestions = messages.length === 0;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">AI Tutor</h3>
              <p className="text-xs text-slate-400">Especializado en {courseTopic}</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-white font-medium mb-1">¡Hola! Soy tu Tutor IA</h4>
              <p className="text-slate-400 text-sm">
                Pregúntame sobre "{currentLessonTitle}"
              </p>
            </motion.div>
          )}

          {/* Suggested Questions */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Preguntas sugeridas
                </p>
                {suggestedQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleSendMessage(question.text)}
                    className="w-full flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors text-left group"
                  >
                    <question.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      {question.text}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message List */}
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-lg p-3",
                  message.role === 'user' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-slate-800"
                )}>
                  <div className={cn(
                    "text-sm whitespace-pre-wrap",
                    message.role === 'assistant' && "text-slate-200 prose prose-sm prose-invert max-w-none"
                  )}>
                    {message.content}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-slate-700">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6",
                          message.feedback === 'positive' && "text-green-400"
                        )}
                        onClick={() => provideFeedback(message.id, 'positive')}
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-6 w-6",
                          message.feedback === 'negative' && "text-red-400"
                        )}
                        onClick={() => provideFeedback(message.id, 'negative')}
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyMessage(message.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {message.sources && message.sources.length > 0 && (
                        <span className="text-[10px] text-slate-500 ml-2">
                          {message.sources.length} fuentes
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-slate-400">Pensando...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder="Escribe tu pregunta..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="bg-slate-800/50 border-slate-700"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Respuestas generadas por IA especializada en el curso
        </p>
      </div>
    </div>
  );
};

export default AITutorPanel;
