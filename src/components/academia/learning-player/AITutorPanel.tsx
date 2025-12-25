/**
 * AITutorPanel - Panel del tutor IA para asistencia durante el curso
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, Loader2, Sparkles, MessageSquare, 
  ThumbsUp, ThumbsDown, Copy, RotateCcw, Lightbulb,
  BookOpen, HelpCircle, Code, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface AITutorPanelProps {
  courseId: string;
  currentLessonId: string;
  currentLessonTitle: string;
  courseTopic?: string;
}

const suggestedQuestions = [
  { icon: HelpCircle, text: "Explain this concept in simpler terms" },
  { icon: Lightbulb, text: "Give me a real-world example" },
  { icon: Code, text: "Show me a practical implementation" },
  { icon: BookOpen, text: "What should I learn next?" },
];

export const AITutorPanel: React.FC<AITutorPanelProps> = ({
  courseId,
  currentLessonId,
  currentLessonTitle,
  courseTopic = "CRM",
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Demo response generator
  const generateDemoResponse = (question: string): string => {
    const responses: Record<string, string> = {
      default: `Great question about ${courseTopic}! Based on the current lesson "${currentLessonTitle}", I can help you understand this better.\n\n**Key Points:**\n1. First, let's consider the fundamental concepts\n2. Then we'll look at practical applications\n3. Finally, I'll share some best practices\n\nWould you like me to elaborate on any specific aspect?`,
      simpler: `Let me break this down in simpler terms!\n\nThink of ${courseTopic} like organizing your contacts on your phone, but for businesses. Instead of just names and numbers, you track:\n\n• What products they're interested in\n• When you last talked to them\n• What they've purchased before\n\nThis helps businesses remember important details about each customer, just like how you remember your friends' preferences!`,
      example: `Here's a real-world example:\n\n**Scenario:** A software company uses CRM\n\n1. **Marketing team** tracks which blog posts a prospect reads\n2. **Sales team** sees this activity and reaches out with relevant solutions\n3. **Support team** has full context when the customer needs help\n\nThe result? 40% faster response times and happier customers!`,
      implementation: `Here's a practical implementation pattern:\n\n\`\`\`javascript\n// Basic CRM data structure\nconst customer = {\n  id: 'cust_123',\n  name: 'Acme Corp',\n  contacts: [...],\n  interactions: [...],\n  deals: [...],\n  score: calculateHealthScore()\n};\n\n// Track interaction\nfunction logInteraction(customerId, type, notes) {\n  // Your implementation here\n}\n\`\`\`\n\nWant me to explain any part of this code?`,
      next: `Based on your progress in this lesson, here's what I recommend:\n\n**Immediate Next Steps:**\n1. Complete the current module's exercises\n2. Review the supplementary materials\n\n**Coming Up:**\n- Advanced Configuration (Module 2)\n- Workflow Automation (Module 3)\n\nYou're making great progress! Keep it up! 🎯`,
    };

    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('simpler') || lowerQuestion.includes('explain')) {
      return responses.simpler;
    } else if (lowerQuestion.includes('example') || lowerQuestion.includes('real-world')) {
      return responses.example;
    } else if (lowerQuestion.includes('implementation') || lowerQuestion.includes('code')) {
      return responses.implementation;
    } else if (lowerQuestion.includes('next') || lowerQuestion.includes('learn')) {
      return responses.next;
    }
    return responses.default;
  };

  const handleSendMessage = async (content: string = inputValue) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setShowSuggestions(false);
    setIsLoading(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: generateDemoResponse(content),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? { ...msg, feedback } : msg
      )
    );
    toast.success(feedback === 'positive' ? 'Thanks for the feedback!' : 'We\'ll improve this response');
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowSuggestions(true);
  };

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
              <p className="text-xs text-slate-400">Always here to help</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
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
              <h4 className="text-white font-medium mb-1">Hello! I'm your AI Tutor</h4>
              <p className="text-slate-400 text-sm">
                Ask me anything about "{currentLessonTitle}"
              </p>
            </motion.div>
          )}

          {/* Suggested Questions */}
          <AnimatePresence>
            {showSuggestions && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  Suggested questions
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
                        onClick={() => handleFeedback(message.id, 'positive')}
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
                        onClick={() => handleFeedback(message.id, 'negative')}
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
                  <span className="text-sm text-slate-400">Thinking...</span>
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
            placeholder="Ask a question..."
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
          AI responses are generated for demo purposes
        </p>
      </div>
    </div>
  );
};

export default AITutorPanel;
