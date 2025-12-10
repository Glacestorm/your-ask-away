import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Send, Loader2, AlertTriangle, Shield, MessageSquare,
  Building, FileText, Package, BookOpen, History, Trash2, RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  isSensitive?: boolean;
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  contextType: string;
  createdAt: Date;
  requiresReview: boolean;
}

const CONTEXT_TYPES = [
  { value: 'clients', label: 'Clientes', icon: Building },
  { value: 'regulations', label: 'Normativas', icon: FileText },
  { value: 'products', label: 'Productos', icon: Package },
  { value: 'procedures', label: 'Procedimientos', icon: BookOpen },
];

export function InternalAssistantChat() {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextType, setContextType] = useState('general');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('internal_assistant_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setConversations(data.map(c => ({
        id: c.id,
        title: c.title,
        contextType: c.context_type,
        createdAt: new Date(c.created_at),
        requiresReview: c.requires_human_review || false,
      })));
    }
  };

  const loadConversation = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('internal_assistant_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
        sources: m.sources as string[] || [],
        isSensitive: m.is_sensitive,
        createdAt: new Date(m.created_at),
      })));
      setCurrentConversationId(conversationId);
    }
  };

  const startNewConversation = async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('internal_assistant_conversations')
      .insert({
        user_id: user.id,
        title: 'Nueva conversación',
        context_type: contextType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setCurrentConversationId(data.id);
    setMessages([]);
    await loadConversations();
    return data.id;
  };

  const saveMessage = async (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    const { error } = await supabase
      .from('internal_assistant_messages')
      .insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        sources: message.sources || [],
        is_sensitive: message.isSensitive || false,
        flagged_for_review: message.isSensitive || false,
      });

    if (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    
    await supabase
      .from('internal_assistant_conversations')
      .update({ title })
      .eq('id', conversationId);
    
    await loadConversations();
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Get or create conversation
      let convId = currentConversationId;
      if (!convId) {
        convId = await startNewConversation();
        if (!convId) throw new Error('Failed to create conversation');
        await updateConversationTitle(convId, userMessage.content);
      }

      // Save user message
      await saveMessage(convId, userMessage);

      // Get user profile for office info
      const { data: profile } = await supabase
        .from('profiles')
        .select('oficina')
        .eq('id', user.id)
        .single();

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('internal-assistant-chat', {
        body: {
          messages: messages.concat(userMessage).map(m => ({
            role: m.role,
            content: m.content,
          })),
          conversationId: convId,
          userId: user.id,
          userRole: userRole || 'gestor',
          contextType,
          userOffice: profile?.oficina,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        sources: data.sources || [],
        isSensitive: data.isSensitive,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(convId, assistantMessage);

      // Update conversation if sensitive
      if (data.requiresReview) {
        await supabase
          .from('internal_assistant_conversations')
          .update({ requires_human_review: true, is_sensitive: true })
          .eq('id', convId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error al enviar el mensaje');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Lo siento, ha ocurrido un error al procesar tu consulta. Por favor, inténtalo de nuevo.',
        createdAt: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (convId: string) => {
    const { error } = await supabase
      .from('internal_assistant_conversations')
      .delete()
      .eq('id', convId);

    if (!error) {
      if (currentConversationId === convId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
      await loadConversations();
      toast.success('Conversación eliminada');
    }
  };

  const deleteAllConversations = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('internal_assistant_conversations')
      .delete()
      .eq('user_id', user.id);

    if (!error) {
      setCurrentConversationId(null);
      setMessages([]);
      setConversations([]);
      toast.success('Todas las conversaciones han sido eliminadas');
    } else {
      toast.error('Error al eliminar las conversaciones');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
      {/* Sidebar - Conversations History */}
      <Card className="lg:col-span-1">
        <CardHeader className="py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <Button 
            variant="outline" 
            className="w-full mb-2"
            onClick={() => {
              setCurrentConversationId(null);
              setMessages([]);
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Nueva conversación
          </Button>
          
          {conversations.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full mb-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetear historial
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar todas las conversaciones?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará permanentemente todas tus conversaciones ({conversations.length}). 
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteAllConversations}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-1">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-2 rounded-md cursor-pointer hover:bg-muted group flex items-center justify-between ${
                    currentConversationId === conv.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {conv.requiresReview && (
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <Card className="lg:col-span-3 flex flex-col">
        <CardHeader className="py-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Asistente IA Interno
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-200">
                Risc: baix
              </Badge>
            </CardTitle>
            
            {/* Context Type Selector */}
            <Tabs value={contextType} onValueChange={setContextType}>
              <TabsList className="h-8">
                {CONTEXT_TYPES.map((type) => (
                  <TabsTrigger 
                    key={type.value} 
                    value={type.value}
                    className="text-xs px-2"
                  >
                    <type.icon className="h-3 w-3 mr-1" />
                    {type.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          
          {/* Compliance Note */}
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Notes de Compliment:</span>
            </div>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
              Uso interno exclusivo (no cliente final). Respuestas basadas en documentación oficial. Sin toma de decisiones autónoma.
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium">¡Hola! Soy tu asistente interno</h3>
                <p className="text-sm max-w-md mt-2">
                  Puedo ayudarte a buscar información sobre clientes, normativas, productos y procedimientos. 
                  ¿En qué puedo ayudarte hoy?
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4 max-w-lg">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('¿Cuáles son los requisitos de KYC para nuevos clientes?')}
                  >
                    Requisitos KYC
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('¿Qué productos de inversión tenemos disponibles?')}
                  >
                    Productos inversión
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('¿Cuál es el procedimiento para apertura de cuenta empresa?')}
                  >
                    Apertura cuenta
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('¿Qué dice la normativa PSD2 sobre pagos?')}
                  >
                    Normativa PSD2
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.isSensitive && (
                        <div className="flex items-center gap-1 text-yellow-500 text-xs mb-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Contenido sensible - Requiere revisión</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.sources && message.sources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.sources.map((source, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu consulta..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Todas las conversaciones son registradas para auditoría • GDPR - Uso interno • Políticas internas de seguridad
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
