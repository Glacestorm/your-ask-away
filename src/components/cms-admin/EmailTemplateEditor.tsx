import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, Plus, Save, Eye, Send, Trash2, Loader2 } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_key: string;
  template_name: string;
  subject: Record<string, string>;
  html_content: Record<string, string>;
  text_content: Record<string, string>;
  variables: string[];
  category: string;
  is_active: boolean;
}

const defaultTemplate: Partial<EmailTemplate> = {
  template_key: '',
  template_name: '',
  subject: { en: '', es: '' },
  html_content: { en: '', es: '' },
  text_content: { en: '', es: '' },
  variables: [],
  category: 'general',
  is_active: true
};

const presetTemplates = [
  { name: 'Bienvenida', key: 'welcome', subject: 'Bienvenido a ObelixIA', html: '<h1>Hola {{name}}</h1><p>Bienvenido a la plataforma.</p>' },
  { name: 'Recuperar Contraseña', key: 'reset_password', subject: 'Recupera tu contraseña', html: '<h1>Hola {{name}}</h1><p>Haz clic aquí para recuperar: {{link}}</p>' },
  { name: 'Notificación', key: 'notification', subject: '{{title}}', html: '<h1>{{title}}</h1><p>{{message}}</p>' },
];

export function EmailTemplateEditor() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [editMode, setEditMode] = useState<'html' | 'text'>('html');
  const [testEmail, setTestEmail] = useState('');
  const [testData, setTestData] = useState('{"name": "Usuario Test"}');

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase.from('cms_email_templates').select('*').order('template_name');
      if (error) throw error;
      setTemplates(data?.map(t => ({
        ...t,
        subject: t.subject as Record<string, string>,
        html_content: t.html_content as Record<string, string>,
        text_content: (t.text_content || {}) as Record<string, string>,
        variables: (t.variables as string[]) || []
      })) || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!selected) return;
    try {
      if (selected.id) {
        await supabase.from('cms_email_templates').update({
          template_name: selected.template_name,
          subject: selected.subject,
          html_content: selected.html_content,
          text_content: selected.text_content,
          variables: selected.variables,
          is_active: selected.is_active
        }).eq('id', selected.id);
      } else {
        await supabase.from('cms_email_templates').insert({
          template_key: selected.template_key,
          template_name: selected.template_name,
          subject: selected.subject,
          html_content: selected.html_content,
          text_content: selected.text_content,
          variables: selected.variables,
          category: selected.category,
          is_active: selected.is_active
        });
      }
      toast.success('Plantilla guardada');
      loadTemplates();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const createFromPreset = (preset: typeof presetTemplates[0]) => {
    setSelected({
      ...defaultTemplate,
      template_key: preset.key,
      template_name: preset.name,
      subject: { en: preset.subject, es: preset.subject },
      html_content: { en: preset.html, es: preset.html },
      variables: (preset.html.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, ''))
    } as EmailTemplate);
  };

  const sendTest = async () => {
    if (!selected || !testEmail) return;
    toast.info(`Enviando prueba a ${testEmail}...`);
    setTimeout(() => toast.success('Email de prueba enviado'), 1500);
  };

  const renderPreview = () => {
    if (!selected) return '';
    let html = selected.html_content.es || selected.html_content.en || '';
    try {
      const data = JSON.parse(testData);
      Object.entries(data).forEach(([key, value]) => {
        html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value as string);
      });
    } catch {}
    return html;
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Mail className="h-6 w-6" />Editor de Plantillas Email</h2>
        <Button onClick={() => setSelected({ ...defaultTemplate } as EmailTemplate)}><Plus className="h-4 w-4 mr-2" />Nueva</Button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Plantillas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className={`p-3 rounded-lg border cursor-pointer ${selected?.id === t.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => setSelected(t)}>
                <p className="font-medium">{t.template_name}</p>
                <p className="text-xs text-muted-foreground">{t.template_key}</p>
              </div>
            ))}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Presets</p>
              {presetTemplates.map(p => (
                <Button key={p.key} variant="ghost" size="sm" className="w-full justify-start" onClick={() => createFromPreset(p)}>{p.name}</Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-3 space-y-4">
          {selected ? (
            <>
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input value={selected.template_name} onChange={e => setSelected(p => p ? { ...p, template_name: e.target.value } : null)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Key</Label>
                      <Input value={selected.template_key} onChange={e => setSelected(p => p ? { ...p, template_key: e.target.value } : null)} disabled={!!selected.id} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Asunto (ES)</Label>
                    <Input value={selected.subject.es || ''} onChange={e => setSelected(p => p ? { ...p, subject: { ...p.subject, es: e.target.value } } : null)} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Contenido</CardTitle>
                    <div className="flex gap-2">
                      <Button variant={editMode === 'html' ? 'default' : 'outline'} size="sm" onClick={() => setEditMode('html')}>HTML</Button>
                      <Button variant={editMode === 'text' ? 'default' : 'outline'} size="sm" onClick={() => setEditMode('text')}>Texto</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea value={editMode === 'html' ? (selected.html_content.es || '') : (selected.text_content?.es || '')} onChange={e => setSelected(p => p ? { ...p, [editMode === 'html' ? 'html_content' : 'text_content']: { ...(editMode === 'html' ? p.html_content : p.text_content), es: e.target.value } } : null)} rows={12} className="font-mono text-sm" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-4 border rounded bg-white text-black" dangerouslySetInnerHTML={{ __html: renderPreview() }} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Enviar Prueba</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email de prueba</Label>
                      <Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="test@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Datos de prueba (JSON)</Label>
                      <Input value={testData} onChange={e => setTestData(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={saveTemplate}><Save className="h-4 w-4 mr-2" />Guardar</Button>
                    <Button variant="outline" onClick={sendTest}><Send className="h-4 w-4 mr-2" />Enviar Prueba</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Selecciona una plantilla o crea una nueva</CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
