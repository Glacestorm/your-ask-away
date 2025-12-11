import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, Send, Loader2, AlertTriangle, Shield, MessageSquare,
  Building, FileText, Package, BookOpen, History, Trash2, RotateCcw,
  Mic, MicOff, Volume2, VolumeX, ClipboardList, Users, Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { AssistantKnowledgeManager } from './AssistantKnowledgeManager';
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
  inputMethod?: 'text' | 'voice';
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
  { value: 'internal_forms', label: 'Form. Internos', icon: ClipboardList },
  { value: 'client_forms', label: 'Form. Clientes', icon: Users },
];

export function InternalAssistantChat() {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextType, setContextType] = useState('clients');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showKnowledgeManager, setShowKnowledgeManager] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [pendingVoiceMessage, setPendingVoiceMessage] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Voice chat hook
  const { 
    isListening, 
    isSpeaking, 
    isSupported: voiceSupported,
    transcript,
    error: voiceChatError,
    toggleListening,
    speak,
    stopSpeaking
  } = useVoiceChat({
    language: 'es-ES',
    onTranscript: (text) => {
      console.log('Voice transcript received:', text);
      setInput(text);
      setPendingVoiceMessage(true);
    },
  });

  // Log voice support status on mount
  useEffect(() => {
    console.log('Voice chat support status:', voiceSupported);
    console.log('SpeechRecognition available:', !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition));
    console.log('SpeechSynthesis available:', 'speechSynthesis' in window);
  }, [voiceSupported]);

  // Handle voice errors
  useEffect(() => {
    if (voiceChatError) {
      console.error('Voice chat error:', voiceChatError);
      if (voiceChatError === 'not-allowed' || voiceChatError === 'microphone-permission') {
        setVoiceError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
        toast.error('Permiso de micrófono denegado');
      } else if (voiceChatError === 'no-speech') {
        setVoiceError('No se detectó ninguna voz. Intenta hablar más alto.');
      } else if (voiceChatError === 'network') {
        setVoiceError('Error de red. Verifica tu conexión.');
      } else if (voiceChatError === 'not-supported') {
        setVoiceError('Tu navegador no soporta reconocimiento de voz.');
      } else {
        setVoiceError(`Error: ${voiceChatError}`);
      }
    } else {
      setVoiceError(null);
    }
  }, [voiceChatError]);

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

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-send when voice recording ends and we have a transcript
  useEffect(() => {
    if (!isListening && pendingVoiceMessage && input.trim()) {
      sendVoiceMessage();
      setPendingVoiceMessage(false);
    }
  }, [isListening, pendingVoiceMessage, input]);

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

    // Also save to audit log (permanent, cannot be deleted by user)
    if (user) {
      await supabase
        .from('assistant_conversation_audit')
        .insert({
          conversation_id: conversationId,
          user_id: user.id,
          role: message.role,
          content: message.content,
          context: contextType,
          input_method: message.inputMethod || 'text',
        });
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

  const sendMessageInternal = async (inputMethod: 'text' | 'voice' = 'text') => {
    if (!input.trim() || !user || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
      inputMethod,
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
        inputMethod: 'text', // Assistant always responds as text
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(convId, assistantMessage);

      // Auto-speak response if enabled or if user sent voice message
      if ((autoSpeak || inputMethod === 'voice') && voiceSupported) {
        speak(data.message);
      }

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

  const sendMessage = () => sendMessageInternal('text');
  const sendVoiceMessage = () => sendMessageInternal('voice');

  const deleteConversation = async (convId: string) => {
    // Mark as deleted in audit (for auditor visibility)
    if (user) {
      await supabase
        .from('assistant_conversation_audit')
        .update({ user_deleted_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .eq('user_id', user.id);
    }

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
    
    // Mark all as deleted in audit
    await supabase
      .from('assistant_conversation_audit')
      .update({ user_deleted_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('user_deleted_at', null);

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

  const handleSpeakMessage = (content: string) => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speak(content);
    }
  };

  if (showKnowledgeManager) {
    return (
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => setShowKnowledgeManager(false)}
          className="mb-4"
        >
          ← Volver al Chat
        </Button>
        <AssistantKnowledgeManager />
      </div>
    );
  }

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

          <Button 
            variant="ghost" 
            className="w-full mb-2 text-muted-foreground"
            onClick={() => setShowKnowledgeManager(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Gestionar Conocimiento
          </Button>
          
          <ScrollArea className="h-[calc(100vh-22rem)]">
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Asistente IA Interno
              <Badge variant="outline" className="ml-2 bg-green-500/10 text-green-600 border-green-200">
                Risc: baix
              </Badge>
            </CardTitle>
            
            {/* Voice Controls */}
            {voiceSupported && (
              <div className="flex items-center gap-2">
                <Button
                  variant={autoSpeak ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoSpeak(!autoSpeak)}
                  title={autoSpeak ? "Desactivar respuestas por voz" : "Activar respuestas por voz"}
                >
                  {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
          
          {/* Context Type Selector */}
          <div className="mt-2">
            <Tabs value={contextType} onValueChange={setContextType}>
              <TabsList className="h-8 flex-wrap">
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
                  Puedo ayudarte a buscar información sobre clientes, normativas, productos, procedimientos y formularios. 
                  {voiceSupported && ' También puedes hablarme usando el micrófono.'}
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
                    onClick={() => setInput('¿Qué formularios necesita rellenar un nuevo cliente?')}
                  >
                    Formularios cliente
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
                      {/* Voice indicator for user messages */}
                      {message.role === 'user' && message.inputMethod === 'voice' && (
                        <div className="flex items-center gap-1 text-primary-foreground/70 text-xs mb-1">
                          <Mic className="h-3 w-3" />
                          <span>Mensaje de voz</span>
                        </div>
                      )}
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
                      {/* Voice button for assistant messages */}
                      {message.role === 'assistant' && voiceSupported && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-6 text-xs"
                          onClick={() => handleSpeakMessage(message.content)}
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-3 w-3 mr-1" />
                              Detener
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3 w-3 mr-1" />
                              Escuchar
                            </>
                          )}
                        </Button>
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
            {/* Voice error message */}
            {voiceError && (
              <div className="mb-2 p-2 bg-destructive/10 border border-destructive/30 rounded-md">
                <p className="text-xs text-destructive">{voiceError}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              {/* Voice Input Button - always show for debugging */}
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={() => {
                  console.log('Mic button clicked, voiceSupported:', voiceSupported, 'isListening:', isListening);
                  if (!voiceSupported) {
                    toast.error('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
                    return;
                  }
                  toggleListening();
                }}
                disabled={isLoading}
                title={!voiceSupported ? "Reconocimiento de voz no soportado" : isListening ? "Detener grabación" : "Hablar"}
                className={`${isListening ? "animate-pulse" : ""} ${!voiceSupported ? "opacity-50" : ""}`}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? "Escuchando..." : "Escribe tu consulta..."}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={sendMessage} 
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isListening && (
              <p className="text-xs text-muted-foreground mt-2 text-center animate-pulse">
                🎙️ Grabando... Habla ahora
              </p>
            )}
            
            {/* Debug info */}
            {!voiceSupported && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                ⚠️ Reconocimiento de voz no disponible. Usa Chrome, Edge o Safari.
              </p>
            )}
            
            {/* Legal Audit Notice */}
            <div className="mt-3 pt-3 border-t border-muted">
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                <Shield className="h-3 w-3 inline-block mr-1 align-middle" />
                <strong>Aviso de Retención de Datos:</strong> De conformidad con el Reglamento (UE) 2016/679 (RGPD), la Llei 29/2021 de Protecció de Dades d'Andorra (APDA) y las normativas bancarias aplicables, 
                todas las conversaciones con este asistente son registradas y almacenadas con fines de auditoría interna, control de cumplimiento normativo y supervisión de calidad. 
                Los datos serán conservados durante el período legalmente establecido y podrán ser accedidos exclusivamente por el personal autorizado de auditoría y cumplimiento. 
                El uso de este servicio implica su consentimiento a dicho tratamiento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
