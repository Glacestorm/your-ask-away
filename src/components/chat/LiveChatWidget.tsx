import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2,
  Users,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveChatWidgetProps {
  companyId: string;
  companyName: string;
  className?: string;
}

export function LiveChatWidget({ companyId, companyName, className }: LiveChatWidgetProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [roomId, setRoomId] = useState<string | undefined>();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    currentRoom,
    messages,
    participants,
    typingUsers,
    loading,
    sendingMessage,
    sendMessage,
    createRoom,
    startTyping,
    getUnreadCount,
  } = useRealtimeChat(roomId);

  // Find or create room for this company
  useEffect(() => {
    const findOrCreateRoom = async () => {
      if (!user || !companyId) return;

      // Try to find existing room for this company
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('company_id', companyId)
        .limit(1);

      if (rooms && rooms.length > 0) {
        setRoomId(rooms[0].id);
        
        // Get unread count
        const count = await getUnreadCount(rooms[0].id);
        setUnreadCount(count);
      }
    };

    findOrCreateRoom();
  }, [user, companyId, getUnreadCount]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Reset unread count when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    // Create room if doesn't exist
    if (!roomId) {
      const newRoomId = await createRoom(
        `Chat - ${companyName}`,
        'group',
        [],
        companyId
      );
      if (newRoomId) {
        setRoomId(newRoomId);
        // Wait a bit for room to be ready
        await new Promise(r => setTimeout(r, 500));
      }
    }

    await sendMessage(messageInput);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    if (roomId) {
      startTyping();
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Ahir ${format(date, 'HH:mm')}`;
    return format(date, 'dd/MM HH:mm', { locale: ca });
  };

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className={cn(
              'shadow-2xl border-2 border-primary/20',
              isMinimized ? 'w-80' : 'w-96 h-[500px]'
            )}>
              <CardHeader className="py-3 px-4 border-b bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      {companyName}
                    </CardTitle>
                    {participants.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {participants.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? (
                        <Maximize2 className="h-4 w-4" />
                      ) : (
                        <Minimize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <CardContent className="p-0 flex flex-col h-[calc(500px-60px)]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          Inicia una conversa amb {companyName}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isOwn = msg.sender_id === user?.id;
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                'flex gap-2',
                                isOwn ? 'flex-row-reverse' : 'flex-row'
                              )}
                            >
                              <Avatar className="h-7 w-7 flex-shrink-0">
                                <AvatarImage src={msg.sender?.avatar_url} />
                                <AvatarFallback className="text-xs">
                                  {msg.sender?.full_name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={cn(
                                  'max-w-[75%] rounded-2xl px-3 py-2',
                                  isOwn 
                                    ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                    : 'bg-muted rounded-bl-sm'
                                )}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-0.5 opacity-70">
                                    {msg.sender?.full_name}
                                  </p>
                                )}
                                <p className="text-sm">{msg.content}</p>
                                <div className={cn(
                                  'flex items-center gap-1 mt-0.5 text-[10px] opacity-60',
                                  isOwn ? 'justify-end' : 'justify-start'
                                )}>
                                  <span>{formatMessageDate(msg.created_at)}</span>
                                  {isOwn && <CheckCheck className="h-3 w-3" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Typing Indicator */}
                  {typingUsers.length > 0 && (
                    <div className="px-4 py-1 text-xs text-muted-foreground border-t bg-muted/30">
                      <span className="flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        {typingUsers.map(u => u.full_name).join(', ')} escriu...
                      </span>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-3 border-t flex gap-2">
                    <Input
                      value={messageInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Escriu un missatge..."
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!messageInput.trim() || sendingMessage}
                      size="icon"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          <Button
            size="lg"
            className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow relative"
            onClick={() => setIsOpen(true)}
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs"
                variant="destructive"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
