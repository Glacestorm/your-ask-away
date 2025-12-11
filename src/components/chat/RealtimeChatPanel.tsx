import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  Users, 
  Hash, 
  User,
  MoreVertical,
  Edit,
  Trash,
  Loader2,
  Check,
  CheckCheck
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ca } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeChatPanelProps {
  companyId?: string;
  className?: string;
}

export function RealtimeChatPanel({ companyId, className }: RealtimeChatPanelProps) {
  const { user } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>();
  const [messageInput, setMessageInput] = useState('');
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState<'direct' | 'group' | 'channel'>('group');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    rooms,
    currentRoom,
    messages,
    participants,
    typingUsers,
    loading,
    sendingMessage,
    sendMessage,
    createRoom,
    startTyping,
    loadRooms,
  } = useRealtimeChat(selectedRoomId);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available users for new room
  useEffect(() => {
    const loadUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .neq('id', user?.id)
        .order('full_name');
      
      if (data) setAvailableUsers(data);
    };
    loadUsers();
  }, [user]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
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
    startTyping();
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    
    const roomId = await createRoom(newRoomName, newRoomType, selectedUsers, companyId);
    if (roomId) {
      setSelectedRoomId(roomId);
      setShowNewRoomDialog(false);
      setNewRoomName('');
      setSelectedUsers([]);
    }
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Ahir ${format(date, 'HH:mm')}`;
    return format(date, 'dd/MM HH:mm', { locale: ca });
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'direct': return <User className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      case 'channel': return <Hash className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn('flex flex-col h-[600px]', className)}>
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat en Temps Real
          </CardTitle>
          <Dialog open={showNewRoomDialog} onOpenChange={setShowNewRoomDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nova Sala
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nova Sala</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nom de la sala</Label>
                  <Input 
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="Ex: Equip Comercial"
                  />
                </div>
                <div>
                  <Label>Tipus</Label>
                  <Select value={newRoomType} onValueChange={(v) => setNewRoomType(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Directe</SelectItem>
                      <SelectItem value="group">Grup</SelectItem>
                      <SelectItem value="channel">Canal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Participants</Label>
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1">
                    {availableUsers.map((u) => (
                      <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }
                          }}
                        />
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback>{u.full_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.full_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreateRoom} className="w-full">
                  Crear Sala
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Room List */}
        <div className="w-1/3 border-r overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hi ha sales
                </p>
              ) : (
                rooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={cn(
                      'w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors',
                      selectedRoomId === room.id 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted'
                    )}
                  >
                    {getRoomIcon(room.type)}
                    <span className="truncate text-sm font-medium">{room.name}</span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedRoomId ? (
            <>
              {/* Room Header */}
              <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentRoom && getRoomIcon(currentRoom.type)}
                  <span className="font-medium">{currentRoom?.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {participants.length} participants
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hi ha missatges. Comença la conversa!
                  </p>
                ) : (
                  <div className="space-y-4">
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
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={msg.sender?.avatar_url} />
                            <AvatarFallback>
                              {msg.sender?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg px-3 py-2',
                              isOwn 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            )}
                          >
                            {!isOwn && (
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {msg.sender?.full_name}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <div className={cn(
                              'flex items-center gap-1 mt-1 text-xs opacity-60',
                              isOwn ? 'justify-end' : 'justify-start'
                            )}>
                              <span>{formatMessageDate(msg.created_at)}</span>
                              {isOwn && <CheckCheck className="h-3 w-3" />}
                              {msg.is_edited && <span>(editat)</span>}
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
                <div className="px-4 py-1 text-xs text-muted-foreground">
                  {typingUsers.map(u => u.full_name).join(', ')} està escrivint...
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Selecciona una sala per començar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
