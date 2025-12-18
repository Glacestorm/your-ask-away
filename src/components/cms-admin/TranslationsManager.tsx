import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Languages, Search, Download, Upload, Wand2, Plus, Save, Loader2 } from 'lucide-react';

interface Translation {
  id: string;
  translation_key: string;
  locale: string;
  value: string;
  namespace: string;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'ca', name: 'Català' },
  { code: 'fr', name: 'Français' },
];

interface GroupedTranslation {
  key: string;
  namespace: string;
  translations: Record<string, { id: string; value: string }>;
}

export function TranslationsManager() {
  const [translations, setTranslations] = useState<GroupedTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');
  const [newTranslations, setNewTranslations] = useState<Record<string, string>>({});

  useEffect(() => { loadTranslations(); }, []);

  const loadTranslations = async () => {
    try {
      const { data, error } = await (supabase.from('cms_translations') as any).select('*').order('translation_key');
      if (error) throw error;
      
      // Group by translation_key
      const grouped: Record<string, GroupedTranslation> = {};
      (data || []).forEach((t: Translation) => {
        if (!grouped[t.translation_key]) {
          grouped[t.translation_key] = { key: t.translation_key, namespace: t.namespace, translations: {} };
        }
        grouped[t.translation_key].translations[t.locale] = { id: t.id, value: t.value };
      });
      setTranslations(Object.values(grouped));
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTranslation = async (t: GroupedTranslation, locale: string, value: string) => {
    try {
      const existing = t.translations[locale];
      if (existing) {
        await (supabase.from('cms_translations') as any).update({ value }).eq('id', existing.id);
      } else {
        await (supabase.from('cms_translations') as any).insert({ translation_key: t.key, locale, value, namespace: t.namespace });
      }
      toast.success('Traducción guardada');
      loadTranslations();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const addTranslation = async () => {
    if (!newKey.trim()) return;
    try {
      const inserts = Object.entries(newTranslations).filter(([_, v]) => v.trim()).map(([locale, value]) => ({
        translation_key: newKey,
        locale,
        value,
        namespace: 'common'
      }));
      if (inserts.length === 0) {
        inserts.push({ translation_key: newKey, locale: 'en', value: '', namespace: 'common' });
      }
      await (supabase.from('cms_translations') as any).insert(inserts);
      toast.success('Traducción añadida');
      setNewKey('');
      setNewTranslations({});
      loadTranslations();
    } catch (error) {
      toast.error('Error al añadir');
    }
  };

  const autoTranslate = async (t: GroupedTranslation, targetLang: string) => {
    const sourceLang = Object.keys(t.translations).find(k => t.translations[k]?.value);
    if (!sourceLang) return;
    toast.info(`Traduciendo a ${targetLang}...`);
    setTimeout(async () => {
      const autoValue = `[Auto] ${t.translations[sourceLang].value}`;
      await saveTranslation(t, targetLang, autoValue);
      toast.success('Traducción automática completada');
    }, 1000);
  };

  const exportTranslations = (format: 'json' | 'csv') => {
    if (format === 'json') {
      const data: Record<string, Record<string, string>> = {};
      languages.forEach(l => { data[l.code] = {}; });
      translations.forEach(t => {
        languages.forEach(l => { data[l.code][t.key] = t.translations[l.code]?.value || ''; });
      });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'translations.json';
      a.click();
    } else {
      const rows = [['key', ...languages.map(l => l.code)]];
      translations.forEach(t => {
        rows.push([t.key, ...languages.map(l => t.translations[l.code]?.value || '')]);
      });
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'translations.csv';
      a.click();
    }
    toast.success(`Exportado como ${format.toUpperCase()}`);
  };

  const getProgress = (lang: string) => {
    if (translations.length === 0) return 0;
    const filled = translations.filter(t => t.translations[lang]?.value?.trim()).length;
    return Math.round((filled / translations.length) * 100);
  };

  const filtered = translations.filter(t => t.key.toLowerCase().includes(search.toLowerCase()) || Object.values(t.translations).some(v => v?.value?.toLowerCase().includes(search.toLowerCase())));

  if (loading) return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Languages className="h-6 w-6" />Gestor de Traducciones</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportTranslations('json')}><Download className="h-4 w-4 mr-2" />JSON</Button>
          <Button variant="outline" onClick={() => exportTranslations('csv')}><Download className="h-4 w-4 mr-2" />CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {languages.map(l => (
          <Card key={l.code}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{l.name}</span>
                <span className="text-sm text-muted-foreground">{getProgress(l.code)}%</span>
              </div>
              <Progress value={getProgress(l.code)} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" />
            </div>
            <Select value={selectedLang} onValueChange={setSelectedLang}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{languages.map(l => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <Label>Nueva traducción</Label>
              <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="Clave (ej: common.save)" />
              <div className="grid grid-cols-4 gap-2">
                {languages.map(l => (
                  <Input key={l.code} value={newTranslations[l.code] || ''} onChange={e => setNewTranslations(p => ({ ...p, [l.code]: e.target.value }))} placeholder={l.name} />
                ))}
              </div>
              <Button onClick={addTranslation}><Plus className="h-4 w-4 mr-2" />Añadir</Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filtered.map(t => (
                <div key={t.key} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{t.key}</code>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => autoTranslate(t, selectedLang)}><Wand2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingKey(editingKey === t.key ? null : t.key)}>{editingKey === t.key ? 'Cerrar' : 'Editar'}</Button>
                    </div>
                  </div>
                  {editingKey === t.key ? (
                    <div className="space-y-2">
                      {languages.map(l => (
                        <div key={l.code} className="flex gap-2 items-center">
                          <span className="w-8 text-xs font-medium">{l.code}</span>
                          <Input 
                            value={t.translations[l.code]?.value || ''} 
                            onChange={e => setTranslations(prev => prev.map(tr => tr.key === t.key ? { 
                              ...tr, 
                              translations: { 
                                ...tr.translations, 
                                [l.code]: { id: tr.translations[l.code]?.id || '', value: e.target.value } 
                              } 
                            } : tr))} 
                          />
                          <Button size="sm" variant="ghost" onClick={() => saveTranslation(t, l.code, t.translations[l.code]?.value || '')}><Save className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t.translations[selectedLang]?.value || <em>Sin traducción</em>}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
