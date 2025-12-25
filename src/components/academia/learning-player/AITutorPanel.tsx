/**
 * AITutorPanel - Panel del tutor IA especializado por curso
 * Usa Lovable AI con RAG para respuestas contextuales
 * Integra Voice AI Tutor y detección emocional
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Loader2, Sparkles, 
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  BookOpen, HelpCircle, Code, Mic, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCourseChatbot, ChatMessage } from '@/hooks/useCourseChatbot';
import { useStreamingChat } from '@/hooks/academia/useStreamingChat';
import { useEmotionalDetector } from '@/hooks/academia/useEmotionalDetector';
import { VoiceAITutor } from './VoiceAITutor';
import { EmotionalIndicator } from './EmotionalIndicator';
import { StreamingMessage } from './StreamingMessage';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'voice'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Streaming chat hook
  const {
    messages: streamingMessages,
    isStreaming,
    sendMessage: sendStreamingMessage,
    clearChat,
  } = useStreamingChat({
    courseId,
    lessonId: currentLessonId,
    courseTitle,
    lessonTitle: currentLessonTitle,
  });

  // Emotional detector
  const {
    emotionalState,
    recordQuestion,
  } = useEmotionalDetector({
    courseId,
    lessonId: currentLessonId,
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [streamingMessages]);

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isStreaming) return;
    setInputValue('');
    recordQuestion(content);
    await sendStreamingMessage(content);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado al portapapeles');
  };

  const showSuggestions = streamingMessages.length === 0 && !isStreaming;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-lg border border-slate-800">
      {/* Header with Emotional Indicator */}
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
          <div className="flex items-center gap-2">
            <EmotionalIndicator
              state={emotionalState.state === 'disengaged' ? 'tired' : emotionalState.state === 'confident' ? 'engaged' : emotionalState.state as any}
              engagementLevel={Math.round(emotionalState.engagementLevel * 100)}
              confidenceScore={Math.round(emotionalState.confidence * 100)}
            />
            {streamingMessages.length > 0 && (
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

        {/* Mode Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'voice')} className="mt-3">
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="chat" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Voz
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'voice' ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <VoiceAITutor
            courseId={courseId}
            lessonId={currentLessonId}
            courseTitle={courseTitle}
            lessonTitle={currentLessonTitle}
          />
        </div>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className="p-4 space-y-4">
              {/* Welcome Message */}
              {streamingMessages.length === 0 && !isStreaming && (
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

              {/* Message List with Streaming */}
              <AnimatePresence mode="popLayout">
                {streamingMessages.map((message) => (
                  <StreamingMessage
                    key={message.id}
                    content={message.content}
                    role={message.role}
                    isStreaming={message.isStreaming || false}
                  />
                ))}
              </AnimatePresence>
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
                disabled={isStreaming}
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isStreaming}
                size="icon"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Respuestas en tiempo real con streaming
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AITutorPanel;
