import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  MessageSquare, 
  Send, 
  Plus, 
  FileText, 
  History, 
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

interface SMSNotification {
  id: string;
  phone_number: string;
  message: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  error_message: string | null;
  contact_name: string | null;
  created_at: string;
}

export function SMSManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('send');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [smsHistory, setSmsHistory] = useState<SMSNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Send SMS form
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [contactName, setContactName] = useState('');
  
  // Template form
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateCategory, setTemplateCategory] = useState('general');

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, []);

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('sms_templates')
      .select('*')
      .order('usage_count', { ascending: false });
    
    if (!error && data) {
      setTemplates(data);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sms_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (!error && data) {
      setSmsHistory(data);
    }
    setLoading(false);
  };

  const handleSendSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error('Introdueix el telèfon i el missatge');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          phone_number: phoneNumber,
          message,
          user_id: user?.id,
          contact_name: contactName || undefined,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success('SMS enviat correctament');
        setPhoneNumber('');
        setMessage('');
        setContactName('');
        loadHistory();
        
        // Update template usage count
        if (selectedTemplate) {
          await supabase
            .from('sms_templates')
            .update({ usage_count: templates.find(t => t.id === selectedTemplate)!.usage_count + 1 })
            .eq('id', selectedTemplate);
          loadTemplates();
        }
      } else {
        toast.error(data.error || 'Error enviant SMS');
      }
    } catch (error: any) {
      console.error('Send SMS error:', error);
      toast.error(error.message || 'Error enviant SMS');
    } finally {
      setSending(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName || !templateContent) {
      toast.error('Nom i contingut són obligatoris');
      return;
    }

    // Extract variables from content (format: {{variable}})
    const variables = templateContent.match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{\{|\}\}/g, '')) || [];

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from('sms_templates')
          .update({
            name: templateName,
            content: templateContent,
            category: templateCategory,
            variables,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Plantilla actualitzada');
      } else {
        const { error } = await supabase
          .from('sms_templates')
          .insert({
            name: templateName,
            content: templateContent,
            category: templateCategory,
            variables,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success('Plantilla creada');
      }

      setShowTemplateDialog(false);
      resetTemplateForm();
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error guardant plantilla');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;
      toast.success('Plantilla eliminada');
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || 'Error eliminant plantilla');
    }
  };

  const handleEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateContent(template.content);
    setTemplateCategory(template.category);
    setShowTemplateDialog(true);
  };

  const resetTemplateForm = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateContent('');
    setTemplateCategory('general');
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Enviat</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Lliurat</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Gestió SMS
        </CardTitle>
        <CardDescription>
          Envia SMS i gestiona plantilles de missatges
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="send" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Plantilles
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Send SMS Tab */}
          <TabsContent value="send" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Telèfon destinatari</Label>
                <Input
                  placeholder="+376 XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div>
                <Label>Nom contacte (opcional)</Label>
                <Input
                  placeholder="Nom del contacte"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Plantilla (opcional)</Label>
              <Select value={selectedTemplate} onValueChange={handleSelectTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una plantilla..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.is_active).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Missatge</Label>
              <Textarea
                placeholder="Escriu el missatge..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/160 caràcters (1 SMS)
              </p>
            </div>

            <Button onClick={handleSendSMS} disabled={sending} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviant...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar SMS
                </>
              )}
            </Button>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {templates.filter(t => t.is_active).length} plantilles actives
              </p>
              <Dialog open={showTemplateDialog} onOpenChange={(open) => {
                setShowTemplateDialog(open);
                if (!open) resetTemplateForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Plantilla
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? 'Editar Plantilla' : 'Nova Plantilla'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Ex: Recordatori visita"
                      />
                    </div>
                    <div>
                      <Label>Categoria</Label>
                      <Select value={templateCategory} onValueChange={setTemplateCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="reminder">Recordatori</SelectItem>
                          <SelectItem value="promotion">Promoció</SelectItem>
                          <SelectItem value="notification">Notificació</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Contingut</Label>
                      <Textarea
                        value={templateContent}
                        onChange={(e) => setTemplateContent(e.target.value)}
                        placeholder="Escriu el contingut. Usa {{variable}} per variables dinàmiques."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Variables: {'{{nom}}'}, {'{{empresa}}'}, {'{{data}}'}
                      </p>
                    </div>
                    <Button onClick={handleSaveTemplate} className="w-full">
                      {editingTemplate ? 'Actualitzar' : 'Crear'} Plantilla
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {templates.filter(t => t.is_active).map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{template.name}</h4>
                            <Badge variant="outline">{template.category}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {template.usage_count} usos
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.content}
                          </p>
                          {template.variables.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {template.variables.map((v) => (
                                <Badge key={v} variant="outline" className="text-xs">
                                  {'{{'}{v}{'}}'}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Últims {smsHistory.length} missatges
              </p>
              <Button size="sm" variant="outline" onClick={loadHistory} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualitzar
              </Button>
            </div>

            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Destinatari</TableHead>
                    <TableHead>Missatge</TableHead>
                    <TableHead>Estat</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {smsHistory.map((sms) => (
                    <TableRow key={sms.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sms.phone_number}</p>
                          {sms.contact_name && (
                            <p className="text-xs text-muted-foreground">{sms.contact_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm">{sms.message}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(sms.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(sms.created_at), 'dd/MM/yyyy HH:mm', { locale: ca })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
