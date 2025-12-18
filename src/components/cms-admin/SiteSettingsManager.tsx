import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Palette, Type, Phone, Share2, Code, Save, Loader2 } from 'lucide-react';

interface SiteSettings {
  id?: string;
  site_name: string;
  site_description: string;
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  font_secondary: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_links: Record<string, string>;
  external_scripts: string[];
}

const defaultSettings: SiteSettings = {
  site_name: 'ObelixIA',
  site_description: 'CRM Bancario Inteligente',
  logo_url: '',
  favicon_url: '',
  primary_color: '#1e40af',
  secondary_color: '#059669',
  accent_color: '#f59e0b',
  font_primary: 'Inter',
  font_secondary: 'Space Grotesk',
  contact_email: '',
  contact_phone: '',
  contact_address: '',
  social_links: { linkedin: '', twitter: '', facebook: '' },
  external_scripts: []
};

export function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newScript, setNewScript] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('cms_site_settings')
        .select('*')
        .eq('setting_key', 'general')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...data.setting_value as any, id: data.id });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { id, ...settingValue } = settings;
      
      if (id) {
        await supabase
          .from('cms_site_settings')
          .update({ setting_value: settingValue as any, updated_at: new Date().toISOString() })
          .eq('id', id);
      } else {
        await supabase
          .from('cms_site_settings')
          .insert({ setting_key: 'general', setting_value: settingValue as any });
      }
      
      toast.success('Configuración guardada');
    } catch (error) {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const addScript = () => {
    if (newScript.trim()) {
      setSettings(prev => ({
        ...prev,
        external_scripts: [...prev.external_scripts, newScript.trim()]
      }));
      setNewScript('');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuración del Sitio
        </h2>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Guardar
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="typography">Tipografía</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del sitio</Label>
                  <Input value={settings.site_name} onChange={e => setSettings(p => ({ ...p, site_name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Input value={settings.site_description} onChange={e => setSettings(p => ({ ...p, site_description: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL del Logo</Label>
                  <Input value={settings.logo_url} onChange={e => setSettings(p => ({ ...p, logo_url: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>URL del Favicon</Label>
                  <Input value={settings.favicon_url} onChange={e => setSettings(p => ({ ...p, favicon_url: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Colores Corporativos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={settings.primary_color} onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))} className="w-12 h-10 p-1" />
                    <Input value={settings.primary_color} onChange={e => setSettings(p => ({ ...p, primary_color: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Secundario</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={settings.secondary_color} onChange={e => setSettings(p => ({ ...p, secondary_color: e.target.value }))} className="w-12 h-10 p-1" />
                    <Input value={settings.secondary_color} onChange={e => setSettings(p => ({ ...p, secondary_color: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color Acento</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={settings.accent_color} onChange={e => setSettings(p => ({ ...p, accent_color: e.target.value }))} className="w-12 h-10 p-1" />
                    <Input value={settings.accent_color} onChange={e => setSettings(p => ({ ...p, accent_color: e.target.value }))} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" />Tipografías</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fuente Principal</Label>
                  <Input value={settings.font_primary} onChange={e => setSettings(p => ({ ...p, font_primary: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Fuente Secundaria</Label>
                  <Input value={settings.font_secondary} onChange={e => setSettings(p => ({ ...p, font_secondary: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" />Datos de Contacto</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={settings.contact_email} onChange={e => setSettings(p => ({ ...p, contact_email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={settings.contact_phone} onChange={e => setSettings(p => ({ ...p, contact_phone: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Textarea value={settings.contact_address} onChange={e => setSettings(p => ({ ...p, contact_address: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Share2 className="h-5 w-5" />Redes Sociales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.social_links).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key}</Label>
                  <Input value={value} onChange={e => setSettings(p => ({ ...p, social_links: { ...p.social_links, [key]: e.target.value } }))} placeholder={`URL de ${key}`} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scripts">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" />Scripts Externos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea value={newScript} onChange={e => setNewScript(e.target.value)} placeholder="Pega el script aquí..." className="flex-1" />
                <Button onClick={addScript}>Añadir</Button>
              </div>
              {settings.external_scripts.map((script, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg flex justify-between items-start">
                  <code className="text-xs break-all flex-1">{script.substring(0, 100)}...</code>
                  <Button variant="ghost" size="sm" onClick={() => setSettings(p => ({ ...p, external_scripts: p.external_scripts.filter((_, idx) => idx !== i) }))}>×</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
