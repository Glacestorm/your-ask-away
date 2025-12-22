import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageSquare, Send, Phone, Video, MoreVertical, Search,
  Paperclip, Smile, Clock, CheckCheck, User, Tag, Archive,
  Star, Filter, SortAsc, AlertCircle, Zap, Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Channel icons
const WhatsAppIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export interface Conversation {
  id: string;
  contact: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
    email?: string;
  };
  channel: 'whatsapp' | 'instagram' | 'facebook' | 'web' | 'email';
  status: 'open' | 'pending' | 'resolved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignee?: { id: string; name: string; avatar?: string };
  lastMessage?: {
    content: string;
    timestamp: string;
    isFromContact: boolean;
  };
  unreadCount: number;
  slaDeadline?: string;
  tags?: string[];
  companyId?: string;
  companyName?: string;
  sentimentScore?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  timestamp: string;
  isFromContact: boolean;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: { type: string; url: string; name: string }[];
  isAutomated?: boolean;
}

interface OmnichannelInboxProps {
  conversations: Conversation[];
  messages: Message[];
  currentConversation?: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  onSendMessage: (conversationId: string, content: string, attachments?: File[]) => void;
  onAssign: (conversationId: string, assigneeId: string) => void;
  onUpdateStatus: (conversationId: string, status: Conversation['status']) => void;
  onAddTag: (conversationId: string, tag: string) => void;
  currentUserId?: string;
  isLoading?: boolean;
}

export function OmnichannelInbox({
  conversations,
  messages,
  currentConversation,
  onSelectConversation,
  onSendMessage,
  onAssign,
  onUpdateStatus,
  onAddTag,
  currentUserId,
  isLoading = false
}: OmnichannelInboxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [messageInput, setMessageInput] = useState('');
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickReplies = [
    "¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?",
    "Un momento, estoy revisando tu solicitud.",
    "¿Me podrías proporcionar más detalles?",
    "Tu solicitud ha sido procesada. ¿Hay algo más en lo que pueda ayudarte?",
    "Gracias por tu paciencia. Estamos trabajando en ello."
  ];

  const getChannelIcon = (channel: Conversation['channel']) => {
    switch (channel) {
      case 'whatsapp': return <WhatsAppIcon />;
      case 'instagram': return <InstagramIcon />;
      case 'facebook': return <FacebookIcon />;
      case 'web': return <MessageSquare className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: Conversation['channel']) => {
    switch (channel) {
      case 'whatsapp': return 'text-green-500';
      case 'instagram': return 'text-pink-500';
      case 'facebook': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = channelFilter === 'all' || conv.channel === channelFilter;
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !currentConversation) return;
    onSendMessage(currentConversation.id, messageInput);
    setMessageInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getSlaStatus = (deadline?: string) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMinutes = (deadlineDate.getTime() - now.getTime()) / (1000 * 60);
    
    if (diffMinutes < 0) return { status: 'breached', color: 'text-red-500', bg: 'bg-red-100' };
    if (diffMinutes < 30) return { status: 'at_risk', color: 'text-amber-500', bg: 'bg-amber-100' };
    return { status: 'on_track', color: 'text-green-500', bg: 'bg-green-100' };
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversaciones</CardTitle>
            <Badge variant="secondary">{filteredConversations.length}</Badge>
          </div>
          
          <div className="space-y-2 mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="resolved">Resuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              <AnimatePresence>
                {filteredConversations.map((conversation) => {
                  const sla = getSlaStatus(conversation.slaDeadline);
                  
                  return (
                    <motion.div
                      key={conversation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <div
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-colors",
                          currentConversation?.id === conversation.id 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted/50",
                          conversation.priority === 'urgent' && "border-l-4 border-l-red-500"
                        )}
                        onClick={() => onSelectConversation(conversation)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={conversation.contact.avatar} />
                              <AvatarFallback>
                                {conversation.contact.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background",
                              getChannelColor(conversation.channel)
                            )}>
                              {getChannelIcon(conversation.channel)}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm truncate">
                                {conversation.contact.name}
                              </h4>
                              <div className="flex items-center gap-1">
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 min-w-5 p-0 flex items-center justify-center text-[10px]">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                                {sla && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Clock className={cn("h-3.5 w-3.5", sla.color)} />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        SLA: {sla.status === 'breached' ? 'Vencido' : sla.status === 'at_risk' ? 'En riesgo' : 'En tiempo'}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                            
                            {conversation.companyName && (
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.companyName}
                              </p>
                            )}
                            
                            {conversation.lastMessage && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {conversation.lastMessage.isFromContact ? '' : 'Tú: '}
                                {conversation.lastMessage.content}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-1 mt-1">
                              {conversation.tags?.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  {tag}
                                </Badge>
                              ))}
                              {conversation.assignee && (
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  → {conversation.assignee.name.split(' ')[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {filteredConversations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay conversaciones
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <CardHeader className="pb-3 flex-shrink-0 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentConversation.contact.avatar} />
                      <AvatarFallback>
                        {currentConversation.contact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background",
                      getChannelColor(currentConversation.channel)
                    )}>
                      {getChannelIcon(currentConversation.channel)}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold">{currentConversation.contact.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {currentConversation.contact.phone && (
                        <span>{currentConversation.contact.phone}</span>
                      )}
                      {currentConversation.companyName && (
                        <>
                          <span>•</span>
                          <span>{currentConversation.companyName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select 
                    value={currentConversation.status} 
                    onValueChange={(value) => onUpdateStatus(currentConversation.id, value as Conversation['status'])}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Abierto</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="resolved">Resuelto</SelectItem>
                      <SelectItem value="archived">Archivado</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Llamar</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Video className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Videollamada</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        message.isFromContact ? "justify-start" : "justify-end"
                      )}
                    >
                      <div className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.isFromContact 
                          ? "bg-muted" 
                          : "bg-primary text-primary-foreground",
                        message.isAutomated && "border-2 border-dashed border-primary/30"
                      )}>
                        {message.isAutomated && (
                          <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                            <Bot className="h-3 w-3" />
                            Respuesta automática
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className={cn(
                          "flex items-center justify-end gap-1 mt-1 text-xs",
                          message.isFromContact ? "text-muted-foreground" : "text-primary-foreground/70"
                        )}>
                          <span>
                            {new Date(message.timestamp).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                          {!message.isFromContact && message.status === 'read' && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t flex-shrink-0">
              {/* Quick Replies */}
              <AnimatePresence>
                {showQuickReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {quickReplies.map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setMessageInput(reply);
                          setShowQuickReplies(false);
                        }}
                      >
                        {reply.substring(0, 40)}...
                      </Button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Escribe un mensaje..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[44px] max-h-32 resize-none pr-20"
                    rows={1}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Respuestas rápidas</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="h-11"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Selecciona una conversación para comenzar</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
