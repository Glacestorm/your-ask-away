import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Save, Plus, Globe, Twitter, FileText, Loader2 } from 'lucide-react';

interface SEOMeta {
  id: string;
  page_id: string | null;
  page_path: string;
  title: string;
  description: string;
  keywords: string[];
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_card: string;
  twitter_title: string;
  twitter_description: string;
  twitter_image: string;
  canonical_url: string;
  structured_data: Record<string, any>;
}

export function SEOManager() {
  const [seoMetas, setSeoMetas] = useState<SEOMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SEOMeta | null>(null);
  const [robotsTxt, setRobotsTxt] = useState('User-agent: *\nAllow: /');
  const [sitemapConfig, setSitemapConfig] = useState({ frequency: 'weekly', priority: 0.5 });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const { data, error } = await supabase.from('cms_seo_meta').select('*').order('page_path');
      if (error) throw error;
      setSeoMetas(data?.map(s => ({
        ...s,
        keywords: (s.keywords as string[]) || [],
        structured_data: (s.structured_data as Record<string, any>) || {}
      })) || []);

      const { data: settings } = await supabase.from('cms_site_settings').select('setting_value').eq('setting_key', 'seo').single();
      if (settings?.setting_value) {
        const seoSettings = settings.setting_value as any;
        setRobotsTxt(seoSettings.robots_txt || robotsTxt);
        setSitemapConfig(seoSettings.sitemap || sitemapConfig);
      }
    } catch (error) {
      console.error('Error loading SEO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeta = async () => {
    const path = prompt('Ruta de la página (ej: /about):');
    if (!path) return;
    try {
      const { data, error } = await supabase.from('cms_seo_meta').insert({
        page_path: path,
        title: '',
        description: '',
        keywords: [],
        og_title: '',
        og_description: '',
        og_image: '',
        twitter_card: 'summary_large_image',
        twitter_title: '',
        twitter_description: '',
        twitter_image: '',
        canonical_url: '',
        structured_data: {}
      }).select().single();
      if (error) throw error;
      toast.success('Meta SEO creado');
      loadData();
      setSelected(data as any);
    } catch (error) {
      toast.error('Error al crear');
    }
  };

  const saveMeta = async () => {
    if (!selected) return;
    try {
      await supabase.from('cms_seo_meta').update({
        title: selected.title,
        description: selected.description,
        keywords: selected.keywords,
        og_title: selected.og_title,
        og_description: selected.og_description,
        og_image: selected.og_image,
        twitter_card: selected.twitter_card,
        twitter_title: selected.twitter_title,
        twitter_description: selected.twitter_description,
        twitter_image: selected.twitter_image,
        canonical_url: selected.canonical_url,
        structured_data: selected.structured_data
      }).eq('id', selected.id);
      toast.success('SEO guardado');
      loadData();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const saveGlobalSEO = async () => {
    try {
      await supabase.from('cms_site_settings').upsert({
        setting_key: 'seo',
        setting_value: { robots_txt: robotsTxt, sitemap: sitemapConfig }
      }, { onConflict: 'setting_key' });
      toast.success('Configuración SEO guardada');
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Search className="h-6 w-6" />Gestor SEO</h2>
        <Button onClick={createMeta}><Plus className="h-4 w-4 mr-2" />Nueva Página</Button>
      </div>

      <Tabs defaultValue="pages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pages">Páginas</TabsTrigger>
          <TabsTrigger value="robots">Robots.txt</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        </TabsList>

        <TabsContent value="pages">
          <div className="grid grid-cols-3 gap-6">
            <Card className="col-span-1">
              <CardHeader><CardTitle>Páginas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {seoMetas.map(meta => (
                  <div key={meta.id} className={`p-3 rounded-lg border cursor-pointer ${selected?.id === meta.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => setSelected(meta)}>
                    <p className="font-medium truncate">{meta.page_path}</p>
                    <p className="text-xs text-muted-foreground truncate">{meta.title || 'Sin título'}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader><CardTitle>{selected ? `SEO: ${selected.page_path}` : 'Selecciona una página'}</CardTitle></CardHeader>
              <CardContent>
                {selected ? (
                  <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="basic">Básico</TabsTrigger>
                      <TabsTrigger value="og">Open Graph</TabsTrigger>
                      <TabsTrigger value="twitter">Twitter</TabsTrigger>
                      <TabsTrigger value="schema">Schema</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label>Título (60 chars max)</Label>
                        <Input value={selected.title} onChange={e => setSelected(p => p ? { ...p, title: e.target.value } : null)} maxLength={60} />
                        <p className="text-xs text-muted-foreground">{selected.title.length}/60</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción (160 chars max)</Label>
                        <Textarea value={selected.description} onChange={e => setSelected(p => p ? { ...p, description: e.target.value } : null)} maxLength={160} />
                        <p className="text-xs text-muted-foreground">{selected.description.length}/160</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Keywords (separadas por coma)</Label>
                        <Input value={selected.keywords.join(', ')} onChange={e => setSelected(p => p ? { ...p, keywords: e.target.value.split(',').map(k => k.trim()) } : null)} />
                      </div>
                      <div className="space-y-2">
                        <Label>URL Canónica</Label>
                        <Input value={selected.canonical_url} onChange={e => setSelected(p => p ? { ...p, canonical_url: e.target.value } : null)} />
                      </div>
                    </TabsContent>

                    <TabsContent value="og" className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Globe className="h-4 w-4" />Open Graph para Facebook, LinkedIn, etc.</div>
                      <div className="space-y-2">
                        <Label>OG Título</Label>
                        <Input value={selected.og_title} onChange={e => setSelected(p => p ? { ...p, og_title: e.target.value } : null)} />
                      </div>
                      <div className="space-y-2">
                        <Label>OG Descripción</Label>
                        <Textarea value={selected.og_description} onChange={e => setSelected(p => p ? { ...p, og_description: e.target.value } : null)} />
                      </div>
                      <div className="space-y-2">
                        <Label>OG Imagen URL</Label>
                        <Input value={selected.og_image} onChange={e => setSelected(p => p ? { ...p, og_image: e.target.value } : null)} />
                      </div>
                    </TabsContent>

                    <TabsContent value="twitter" className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><Twitter className="h-4 w-4" />Twitter Cards</div>
                      <div className="space-y-2">
                        <Label>Card Type</Label>
                        <Input value={selected.twitter_card} onChange={e => setSelected(p => p ? { ...p, twitter_card: e.target.value } : null)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter Título</Label>
                        <Input value={selected.twitter_title} onChange={e => setSelected(p => p ? { ...p, twitter_title: e.target.value } : null)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Twitter Descripción</Label>
                        <Textarea value={selected.twitter_description} onChange={e => setSelected(p => p ? { ...p, twitter_description: e.target.value } : null)} />
                      </div>
                    </TabsContent>

                    <TabsContent value="schema" className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2"><FileText className="h-4 w-4" />Structured Data (JSON-LD)</div>
                      <Textarea value={JSON.stringify(selected.structured_data, null, 2)} onChange={e => { try { setSelected(p => p ? { ...p, structured_data: JSON.parse(e.target.value) } : null); } catch {} }} rows={10} className="font-mono text-sm" />
                    </TabsContent>

                    <Button onClick={saveMeta} className="w-full"><Save className="h-4 w-4 mr-2" />Guardar SEO</Button>
                  </Tabs>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Selecciona una página</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="robots">
          <Card>
            <CardHeader><CardTitle>Robots.txt</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={robotsTxt} onChange={e => setRobotsTxt(e.target.value)} rows={10} className="font-mono" />
              <Button onClick={saveGlobalSEO}><Save className="h-4 w-4 mr-2" />Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card>
            <CardHeader><CardTitle>Configuración Sitemap</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frecuencia de actualización</Label>
                  <Input value={sitemapConfig.frequency} onChange={e => setSitemapConfig(p => ({ ...p, frequency: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Prioridad default (0-1)</Label>
                  <Input type="number" step="0.1" min="0" max="1" value={sitemapConfig.priority} onChange={e => setSitemapConfig(p => ({ ...p, priority: parseFloat(e.target.value) }))} />
                </div>
              </div>
              <Button onClick={saveGlobalSEO}><Save className="h-4 w-4 mr-2" />Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
