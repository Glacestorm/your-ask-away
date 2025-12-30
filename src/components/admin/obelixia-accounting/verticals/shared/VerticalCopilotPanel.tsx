/**
 * VerticalCopilotPanel
 * Panel de chat genérico para módulos verticales
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Bot, User, Send, Sparkles, MessageSquare, Lightbulb,
  X, Maximize2, Minimize2, ThumbsUp, ThumbsDown, Loader2,
  Plus, Trash2, FileText, Calculator, BarChart3, Receipt,
  Calendar, Clock, Briefcase, Wallet, Target, Gift,
  Shield, Activity, Pill, Stethoscope, TrendingUp, Utensils,
  Globe, Home, Building, Store, Package, Truck, Warehouse,
  Leaf, Sun, HardHat, Users, PieChart, GitBranch, Award,
  Heart, Image, Layers, Coins, Zap, AlertTriangle
} from 'lucide-react';
import { useVerticalCopilot, type VerticalType, type VerticalMessage, type VerticalQuickAction } from '@/hooks/admin/obelixia-accounting/useVerticalCopilot';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// Mapeo de iconos
const ICON_MAP: Record<string, React.ReactNode> = {
  FileText: <FileText className="h-4 w-4" />,
  Calculator: <Calculator className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Receipt: <Receipt className="h-4 w-4" />,
  Calendar: <Calendar className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Wallet: <Wallet className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
  Shield: <Shield className="h-4 w-4" />,
  Activity: <Activity className="h-4 w-4" />,
  Pill: <Pill className="h-4 w-4" />,
  Stethoscope: <Stethoscope className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
  Utensils: <Utensils className="h-4 w-4" />,
  Globe: <Globe className="h-4 w-4" />,
  Home: <Home className="h-4 w-4" />,
  Building: <Building className="h-4 w-4" />,
  Store: <Store className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  Truck: <Truck className="h-4 w-4" />,
  Warehouse: <Warehouse className="h-4 w-4" />,
  Leaf: <Leaf className="h-4 w-4" />,
  Sun: <Sun className="h-4 w-4" />,
  HardHat: <HardHat className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  PieChart: <PieChart className="h-4 w-4" />,
  GitBranch: <GitBranch className="h-4 w-4" />,
  Award: <Award className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
  Image: <Image className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
  Coins: <Coins className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  AlertTriangle: <AlertTriangle className="h-4 w-4" />,
  Bot: <Bot className="h-4 w-4" />,
  CheckSquare: <FileText className="h-4 w-4" />,
  Lock: <Shield className="h-4 w-4" />,
  GraduationCap: <Target className="h-4 w-4" />,
  FileContract: <FileText className="h-4 w-4" />,
};

interface VerticalCopilotPanelProps {
  verticalType: VerticalType;
  className?: string;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  accentColor?: string;
}

export function VerticalCopilotPanel({
  verticalType,
  className,
  onClose,
  isExpanded = false,
  onToggleExpand,
  accentColor = 'from-violet-500 to-purple-600'
}: VerticalCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    config,
    quickActions,
    sendMessage,
    executeQuickAction,
    provideFeedback,
    clearChat
  } = useVerticalCopilot(verticalType);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue;
    setInputValue('');
    await sendMessage(message);
  }, [inputValue, isLoading, sendMessage]);

  // Enter para enviar
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Renderizar mensaje
  const renderMessage = (msg: VerticalMessage) => {
    const isUser = msg.role === 'user';

    return (
      <motion.div
        key={msg.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn("flex gap-3 p-3", isUser ? "flex-row-reverse" : "")}
      >
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isUser 
            ? "bg-primary text-primary-foreground" 
            : `bg-gradient-to-br ${accentColor} text-white`
        )}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div className={cn("flex-1 max-w-[80%]", isUser ? "text-right" : "")}>
          <div className={cn(
            "inline-block p-3 rounded-lg text-sm",
            isUser 
              ? "bg-primary text-primary-foreground rounded-tr-none" 
              : "bg-muted rounded-tl-none"
          )}>
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {msg.content}
            </div>
          </div>

          {!isUser && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(msg.timestamp, { locale: es, addSuffix: true })}
              </span>
              {msg.metadata?.latency_ms && (
                <span className="text-xs text-muted-foreground">
                  • {msg.metadata.latency_ms}ms
                </span>
              )}
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", msg.feedback === 'positive' && "text-emerald-500")}
                        onClick={() => provideFeedback(msg.id, 'positive')}
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Útil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6", msg.feedback === 'negative' && "text-red-500")}
                        onClick={() => provideFeedback(msg.id, 'negative')}
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>No útil</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <Card className={cn(
      "flex flex-col transition-all duration-300 overflow-hidden h-full border-0 shadow-none",
      className
    )}>
      {/* Header */}
      <CardHeader className={cn("pb-2 border-b", `bg-gradient-to-r ${accentColor}/10`)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg bg-gradient-to-br", accentColor)}>
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">ObelixIA {config.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Asistente especializado
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clearChat} className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Nueva conversación</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {onToggleExpand && (
              <Button variant="ghost" size="icon" onClick={onToggleExpand} className="h-8 w-8">
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-3 grid grid-cols-2">
            <TabsTrigger value="chat" className="text-xs flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Acciones
            </TabsTrigger>
          </TabsList>

          {/* Tab: Chat */}
          <TabsContent value="chat" className="flex-1 flex flex-col m-0 overflow-hidden">
            {/* Quick Actions iniciales */}
            {messages.length === 0 && quickActions.length > 0 && (
              <div className="px-3 pt-3">
                <p className="text-xs text-muted-foreground mb-2">Acciones rápidas</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.slice(0, 4).map((qa) => (
                    <Button
                      key={qa.id}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-auto py-2 px-3"
                      onClick={() => executeQuickAction(qa)}
                      disabled={isLoading}
                    >
                      {ICON_MAP[qa.icon] || <Sparkles className="h-4 w-4" />}
                      <span className="ml-2 truncate">{qa.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-1">
              <div className="py-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                    <div className={cn("p-4 rounded-full mb-4", `bg-gradient-to-br ${accentColor}/20`)}>
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">¡Hola! Soy tu copilot de {config.name}</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">
                      Pregúntame sobre cualquier tema contable específico de tu sector.
                    </p>
                  </div>
                )}

                <AnimatePresence>
                  {messages.map((msg) => renderMessage(msg))}
                </AnimatePresence>

                {isLoading && (
                  <div className="flex gap-3 p-3">
                    <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br text-white", accentColor)}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg rounded-tl-none bg-muted text-sm">
                        <span className="text-muted-foreground">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!inputValue.trim() || isLoading} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Actions */}
          <TabsContent value="actions" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-3">
                <p className="text-sm font-medium">Acciones especializadas</p>
                <div className="space-y-2">
                  {quickActions.map((qa) => (
                    <Button
                      key={qa.id}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => {
                        executeQuickAction(qa);
                        setActiveTab('chat');
                      }}
                      disabled={isLoading}
                    >
                      <div className={cn("p-2 rounded-lg mr-3 bg-gradient-to-br", accentColor)}>
                        {ICON_MAP[qa.icon] || <Sparkles className="h-4 w-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{qa.title}</p>
                        <p className="text-xs text-muted-foreground">{qa.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">{qa.category}</Badge>
                    </Button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
