/**
 * WhatsApp Business Panel - Complete Integration Dashboard
 * Fase 1.2 - Enterprise SaaS 2025-2026
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  MessageCircle,
  Send,
  RefreshCw,
  Phone,
  Users,
  FileText,
  Bot,
  Settings,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  TrendingUp,
  MessageSquare,
  Link2,
  Search,
  ChevronRight,
  Sparkles,
  Mail,
  User
} from 'lucide-react';
import { useWhatsAppBusiness } from '@/hooks/admin/integrations/useWhatsAppBusiness';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

export function WhatsAppBusinessPanel() {
  const [activeTab, setActiveTab] = useState('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  const {
    templates,
    conversations,
    stats,
    isLoading,
    isConnected,
    lastRefresh,
    fetchTemplates,
    sendTemplate,
    sendMessage,
    fetchConversations,
    syncContacts,
    getChatbotResponse,
    updateCRM,
    startAutoRefresh,
    stopAutoRefresh
  } = useWhatsAppBusiness();

  useEffect(() => {
    startAutoRefresh(30000);
    return () => stopAutoRefresh();
  }, [startAutoRefresh, stopAutoRefresh]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    await sendMessage(selectedConversation, newMessage);
    setNewMessage('');
    await fetchConversations();
  }, [selectedConversation, newMessage, sendMessage, fetchConversations]);

  const handleSendTemplate = useCallback(async (phone: string) => {
    if (!selectedTemplate) {
      toast.error('Selecciona un template');
      return;
    }
    await sendTemplate(phone, selectedTemplate, templateParams);
    setSelectedTemplate('');
    setTemplateParams({});
  }, [selectedTemplate, templateParams, sendTemplate]);

  const handleGenerateAIResponse = useCallback(async () => {
    if (!selectedConversation) return;

    const conv = conversations.find(c => c.phoneNumber === selectedConversation);
    if (!conv?.messages.length) return;

    const lastMessage = conv.messages[conv.messages.length - 1];
    if (lastMessage.direction !== 'inbound') {
      toast.error('Selecciona un mensaje entrante');
      return;
    }

    const response = await getChatbotResponse(selectedConversation, lastMessage.content);
    if (response) {
      setNewMessage(response.message);
      toast.success(`Intent: ${response.intent}, Sentiment: ${response.sentiment}`);
    }
  }, [selectedConversation, conversations, getChatbotResponse]);

  const selectedConv = conversations.find(c => c.phoneNumber === selectedConversation);
  const filteredConversations = conversations.filter(c => 
    c.phoneNumber.includes(searchQuery) || 
    c.contactName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-500';
      case 'delivered': return 'text-green-500';
      case 'read': return 'text-emerald-600';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalMessages || 0}</p>
                <p className="text-xs text-muted-foreground">Total Mensajes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.messagesSent || 0}</p>
                <p className="text-xs text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.messagesReceived || 0}</p>
                <p className="text-xs text-muted-foreground">Recibidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.deliveryRate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Tasa Entrega</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{stats?.readRate?.toFixed(1) || 0}%</p>
                <p className="text-xs text-muted-foreground">Tasa Lectura</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          isConnected 
            ? "bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/50" 
            : "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/50"
        )}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              )}
              <div>
                <p className="text-sm font-medium">{isConnected ? 'Conectado' : 'Demo'}</p>
                <p className="text-xs text-muted-foreground">Estado API</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversaciones
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="chatbot" className="gap-2">
            <Bot className="h-4 w-4" />
            Chatbot IA
          </TabsTrigger>
          <TabsTrigger value="sync" className="gap-2">
            <Link2 className="h-4 w-4" />
            Sincronización
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Conversaciones</CardTitle>
                  <Button variant="ghost" size="icon" onClick={fetchConversations} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No hay conversaciones
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <div
                        key={conv.phoneNumber}
                        onClick={() => setSelectedConversation(conv.phoneNumber)}
                        className={cn(
                          "p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                          selectedConversation === conv.phoneNumber && "bg-primary/10"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conv.contactName || conv.phoneNumber}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="ml-2">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage?.content || 'Sin mensajes'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {conv.lastActivity && formatDistanceToNow(conv.lastActivity, { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat View */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2 border-b">
                {selectedConv ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {selectedConv.contactName || selectedConv.phoneNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{selectedConv.phoneNumber}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedConv.crmCompanyId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateCRM(selectedConv.phoneNumber, selectedConv.crmCompanyId!)}
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Sync CRM
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <CardTitle className="text-base text-muted-foreground">
                    Selecciona una conversación
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {selectedConv ? (
                  <>
                    <ScrollArea className="h-[350px] p-4">
                      <div className="space-y-4">
                        {selectedConv.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg p-3",
                                msg.direction === 'outbound'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-muted'
                              )}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs opacity-70">
                                  {format(msg.createdAt, 'HH:mm')}
                                </span>
                                {msg.direction === 'outbound' && (
                                  <CheckCircle className={cn("h-3 w-3", getStatusColor(msg.status))} />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateAIResponse}
                          title="Generar respuesta IA"
                        >
                          <Sparkles className="h-4 w-4" />
                        </Button>
                        <Textarea
                          placeholder="Escribe un mensaje..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1 min-h-[40px] max-h-[120px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-[450px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Selecciona una conversación para ver los mensajes</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Templates Aprobados</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={isLoading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <Card key={template.name} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                        <Badge variant={template.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {template.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <span>🌐 {template.language}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedTemplate(template.name)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Usar Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedTemplate && (
                <Card className="mt-4 border-primary">
                  <CardHeader>
                    <CardTitle className="text-base">Enviar Template: {selectedTemplate}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Número de teléfono</Label>
                      <Input
                        placeholder="+34612345678"
                        onChange={(e) => setTemplateParams(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Parámetro 1 (opcional)</Label>
                      <Input
                        placeholder="Nombre del cliente"
                        onChange={(e) => setTemplateParams(prev => ({ ...prev, param1: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSendTemplate(templateParams.phone || '')}
                        disabled={!templateParams.phone}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedTemplate('')}>
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot Tab */}
        <TabsContent value="chatbot" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Configuración del Chatbot IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Chatbot Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Respuestas automáticas con IA
                    </p>
                  </div>
                  <Switch
                    checked={chatbotEnabled}
                    onCheckedChange={setChatbotEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-respuesta</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar respuestas automáticamente
                    </p>
                  </div>
                  <Switch />
                </div>

                <div>
                  <Label>Horario de atención</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Input type="time" defaultValue="09:00" />
                    <Input type="time" defaultValue="18:00" />
                  </div>
                </div>

                <div>
                  <Label>Mensaje fuera de horario</Label>
                  <Textarea
                    placeholder="Gracias por contactarnos. Nuestro horario de atención es de 9:00 a 18:00..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Intents Detectados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { intent: 'consulta_producto', count: 45, trend: '+12%' },
                    { intent: 'soporte_tecnico', count: 32, trend: '+5%' },
                    { intent: 'precio_cotizacion', count: 28, trend: '+18%' },
                    { intent: 'agendar_cita', count: 21, trend: '-3%' },
                    { intent: 'queja_reclamo', count: 12, trend: '-8%' },
                  ].map((item) => (
                    <div key={item.intent} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{item.intent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{item.count}</span>
                        <Badge variant={item.trend.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                          {item.trend}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  Sincronización CRM
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-sincronización</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar contactos automáticamente
                    </p>
                  </div>
                  <Switch
                    checked={autoSyncEnabled}
                    onCheckedChange={setAutoSyncEnabled}
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Última sincronización</span>
                    <span className="text-sm text-muted-foreground">
                      {lastRefresh ? formatDistanceToNow(lastRefresh, { addSuffix: true, locale: es }) : 'Nunca'}
                    </span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>

                <Button onClick={syncContacts} disabled={isLoading} className="w-full">
                  <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                  Sincronizar Ahora
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mapeo de Campos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { wa: 'phone_number', crm: 'phone', synced: true },
                    { wa: 'display_name', crm: 'contact_name', synced: true },
                    { wa: 'profile_picture', crm: 'avatar_url', synced: false },
                    { wa: 'status', crm: 'wa_status', synced: false },
                  ].map((field) => (
                    <div key={field.wa} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.wa}</Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{field.crm}</Badge>
                      </div>
                      <Switch checked={field.synced} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuración de WhatsApp Business API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Modo Demostración</p>
                    <p className="text-sm text-muted-foreground">
                      Para conectar con WhatsApp Business API en producción, configure las siguientes variables de entorno:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 list-disc list-inside">
                      <li>WHATSAPP_API_TOKEN</li>
                      <li>WHATSAPP_PHONE_NUMBER_ID</li>
                      <li>WHATSAPP_WEBHOOK_VERIFY_TOKEN</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Label>Webhook URL</Label>
                <Input
                  readOnly
                  value={`${window.location.origin}/functions/v1/whatsapp-business-api`}
                  className="mt-2 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Configure esta URL en Meta Business Suite
                </p>
              </div>

              <div>
                <Label>Webhook Verify Token</Label>
                <Input
                  type="password"
                  placeholder="Configure WHATSAPP_WEBHOOK_VERIFY_TOKEN"
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WhatsAppBusinessPanel;
