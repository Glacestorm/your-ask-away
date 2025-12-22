import React, { useState } from 'react';
import { DashboardLayout } from '@/layouts';
import { OmnichannelInbox, Conversation, Message } from '@/components/crm/omnichannel';

const demoConversations: Conversation[] = [
  {
    id: '1',
    contact: { id: 'c1', name: 'María García', phone: '+34 612 345 678' },
    channel: 'whatsapp',
    status: 'open',
    priority: 'high',
    assignee: { id: 'a1', name: 'Juan Pérez' },
    lastMessage: { content: 'Hola, necesito ayuda con mi pedido', timestamp: new Date().toISOString(), isFromContact: true },
    unreadCount: 2,
    slaDeadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    tags: ['Soporte', 'Urgente'],
    companyName: 'Acme Corp'
  },
  {
    id: '2',
    contact: { id: 'c2', name: 'Carlos López', phone: '+34 698 765 432' },
    channel: 'instagram',
    status: 'open',
    priority: 'normal',
    lastMessage: { content: '¿Tienen este producto en stock?', timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), isFromContact: true },
    unreadCount: 1,
    tags: ['Ventas']
  },
  {
    id: '3',
    contact: { id: 'c3', name: 'Ana Martínez' },
    channel: 'facebook',
    status: 'pending',
    priority: 'urgent',
    assignee: { id: 'a2', name: 'Laura Sánchez' },
    lastMessage: { content: 'Gracias por la información', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isFromContact: false },
    unreadCount: 0,
    slaDeadline: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    companyName: 'TechStart SL'
  },
  {
    id: '4',
    contact: { id: 'c4', name: 'Pedro Ruiz', email: 'pedro@empresa.com' },
    channel: 'web',
    status: 'open',
    priority: 'low',
    lastMessage: { content: 'Me gustaría solicitar una demo', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isFromContact: true },
    unreadCount: 1,
    tags: ['Demo', 'Lead']
  }
];

const demoMessages: Record<string, Message[]> = {
  '1': [
    { id: 'm1', conversationId: '1', content: '¡Hola! Bienvenido a ObelixIA. ¿En qué puedo ayudarte?', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), isFromContact: false, status: 'read', isAutomated: true },
    { id: 'm2', conversationId: '1', content: 'Hola, necesito ayuda con mi pedido #12345', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), isFromContact: true, status: 'read' },
    { id: 'm3', conversationId: '1', content: 'Claro, déjame revisar el estado de tu pedido...', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), isFromContact: false, status: 'delivered' },
    { id: 'm4', conversationId: '1', content: 'Hola, necesito ayuda con mi pedido', timestamp: new Date().toISOString(), isFromContact: true, status: 'read' },
  ]
};

const OmnichannelPage = () => {
  const [conversations] = useState<Conversation[]>(demoConversations);
  const [currentConversation, setCurrentConversation] = useState<Conversation | undefined>();
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSelectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    setMessages(demoMessages[conversation.id] || []);
  };

  const handleSendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      content,
      timestamp: new Date().toISOString(),
      isFromContact: false,
      status: 'sent'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleAssign = (conversationId: string, assigneeId: string) => {
    console.log('Assign', conversationId, 'to', assigneeId);
  };

  const handleUpdateStatus = (conversationId: string, status: Conversation['status']) => {
    console.log('Update status', conversationId, status);
  };

  const handleAddTag = (conversationId: string, tag: string) => {
    console.log('Add tag', tag, 'to', conversationId);
  };

  return (
    <DashboardLayout title="Inbox Omnicanal">
      <div className="p-4 h-[calc(100vh-4rem)]">
        <OmnichannelInbox 
          conversations={conversations}
          messages={messages}
          currentConversation={currentConversation}
          onSelectConversation={handleSelectConversation}
          onSendMessage={handleSendMessage}
          onAssign={handleAssign}
          onUpdateStatus={handleUpdateStatus}
          onAddTag={handleAddTag}
        />
      </div>
    </DashboardLayout>
  );
};

export default OmnichannelPage;
