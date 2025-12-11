import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  created_by: string;
  company_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  reply_to_id?: string;
  is_edited: boolean;
  edited_at?: string;
  deleted_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  last_read_at: string;
  is_muted: boolean;
  joined_at: string;
  user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TypingUser {
  user_id: string;
  full_name: string;
}

export function useRealtimeChat(roomId?: string) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load user's chat rooms
  const loadRooms = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) {
      // Filter rooms where user is a participant
      const roomsWithParticipation = await Promise.all(
        data.map(async (room) => {
          const { data: participation } = await supabase
            .from('chat_participants')
            .select('user_id')
            .eq('room_id', room.id)
            .eq('user_id', user.id)
            .single();
          return participation ? room : null;
        })
      );
      
      setRooms(roomsWithParticipation.filter(Boolean) as ChatRoom[]);
    }
  }, [user]);

  // Load room details
  const loadRoom = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (roomError) throw roomError;
      setCurrentRoom(room as ChatRoom);

      // Load participants
      const { data: parts, error: partsError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('room_id', id);

      if (!partsError && parts) {
        // Load user info separately
        const partsWithUsers = await Promise.all(
          parts.map(async (p) => {
            const { data: userData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', p.user_id)
              .single();
            return { ...p, user: userData } as ChatParticipant;
          })
        );
        setParticipants(partsWithUsers);
      }

      // Load messages
      const { data: msgs, error: msgsError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!msgsError && msgs) {
        // Load sender info separately
        const msgsWithSenders = await Promise.all(
          msgs.map(async (m) => {
            const { data: senderData } = await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .eq('id', m.sender_id)
              .single();
            return { ...m, sender: senderData } as ChatMessage;
          })
        );
        setMessages(msgsWithSenders);
      }

    } catch (error) {
      console.error('Error loading room:', error);
      toast.error('Error carregant la sala');
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to room updates
  useEffect(() => {
    if (!roomId || !user) return;

    loadRoom(roomId);

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          setMessages(prev => [...prev, { ...newMessage, sender }]);

          // Update last read
          if (newMessage.sender_id !== user.id) {
            await supabase
              .from('chat_participants')
              .update({ last_read_at: new Date().toISOString() })
              .eq('room_id', roomId)
              .eq('user_id', user.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_typing',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingData = payload.new;
            if (typingData.user_id !== user.id) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', typingData.user_id)
                .single();
              
              if (userData) {
                setTypingUsers(prev => {
                  const exists = prev.find(u => u.user_id === typingData.user_id);
                  if (exists) return prev;
                  return [...prev, { user_id: typingData.user_id, full_name: userData.full_name }];
                });
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const typingData = payload.old;
            setTypingUsers(prev => prev.filter(u => u.user_id !== typingData.user_id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user, loadRoom]);

  // Send message
  const sendMessage = async (content: string, messageType: 'text' | 'image' | 'file' = 'text', fileUrl?: string) => {
    if (!user || !roomId || !content.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: content.trim(),
          message_type: messageType,
          file_url: fileUrl,
        });

      if (error) throw error;

      // Clear typing indicator
      await stopTyping();

      // Update room timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Error enviant missatge');
    } finally {
      setSendingMessage(false);
    }
  };

  // Typing indicator
  const startTyping = async () => {
    if (!user || !roomId) return;

    try {
      await supabase
        .from('chat_typing')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'room_id,user_id',
        });

      // Auto-remove after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(stopTyping, 3000);
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  };

  const stopTyping = async () => {
    if (!user || !roomId) return;

    try {
      await supabase
        .from('chat_typing')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  };

  // Create new room
  const createRoom = async (
    name: string,
    type: 'direct' | 'group' | 'channel',
    participantIds: string[],
    companyId?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data: room, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          name,
          type,
          created_by: user.id,
          company_id: companyId,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const participantsToAdd = [...new Set([user.id, ...participantIds])];
      const { error: partError } = await supabase
        .from('chat_participants')
        .insert(
          participantsToAdd.map((uid, idx) => ({
            room_id: room.id,
            user_id: uid,
            role: uid === user.id ? 'owner' : 'member',
          }))
        );

      if (partError) throw partError;

      await loadRooms();
      toast.success('Sala creada');
      return room.id;

    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Error creant la sala');
      return null;
    }
  };

  // Edit message
  const editMessage = async (messageId: string, newContent: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({
          content: newContent,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Error editant missatge');
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error eliminant missatge');
    }
  };

  // Get unread count
  const getUnreadCount = useCallback(async (rId: string): Promise<number> => {
    if (!user) return 0;

    const { data: participant } = await supabase
      .from('chat_participants')
      .select('last_read_at')
      .eq('room_id', rId)
      .eq('user_id', user.id)
      .single();

    if (!participant) return 0;

    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', rId)
      .neq('sender_id', user.id)
      .gt('created_at', participant.last_read_at)
      .is('deleted_at', null);

    return count || 0;
  }, [user]);

  // Initial load
  useEffect(() => {
    if (user) {
      loadRooms();
    }
  }, [user, loadRooms]);

  return {
    rooms,
    currentRoom,
    messages,
    participants,
    typingUsers,
    loading,
    sendingMessage,
    loadRooms,
    loadRoom,
    sendMessage,
    createRoom,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    getUnreadCount,
  };
}
