import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Palette, Sun, Moon, Download, Upload, Trash2, Check, Loader2 } from 'lucide-react';

interface Theme {
  id: string;
  theme_name: string;
  is_active: boolean;
  is_dark_mode: boolean;
  color_palette: Record<string, string>;
  created_at: string;
}

const presets = [
  { name: 'ObelixIA Default', colors: { primary: '#1e40af', secondary: '#059669', accent: '#f59e0b', background: '#0f172a' } },
  { name: 'Ocean Blue', colors: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#8b5cf6', background: '#0c4a6e' } },
  { name: 'Forest Green', colors: { primary: '#22c55e', secondary: '#10b981', accent: '#eab308', background: '#14532d' } },
  { name: 'Royal Purple', colors: { primary: '#8b5cf6', secondary: '#a855f7', accent: '#ec4899', background: '#3b0764' } },
];

export function ThemeEditor() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [editedColors, setEditedColors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const { data, error } = await (supabase.from('cms_themes') as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setThemes(data || []);
      const active = data?.find((t: any) => t.is_active);
      if (active) {
        setSelectedTheme(active as Theme);
        setEditedColors(active.color_palette as Record<string, string>);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTheme = async () => {
    if (!selectedTheme) return;
    try {
      await (supabase.from('cms_themes') as any).update({ color_palette: editedColors }).eq('id', selectedTheme.id);
      toast.success('Tema guardado');
      loadThemes();
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const activateTheme = async (theme: Theme) => {
    try {
      await (supabase.from('cms_themes') as any).update({ is_active: false }).neq('id', theme.id);
      await (supabase.from('cms_themes') as any).update({ is_active: true }).eq('id', theme.id);
      toast.success('Tema activado');
      loadThemes();
    } catch (error) {
      toast.error('Error al activar tema');
    }
  };

  const createFromPreset = async (preset: typeof presets[0]) => {
    try {
      await (supabase.from('cms_themes') as any).insert({
        theme_name: preset.name,
        color_palette: preset.colors,
        is_active: false,
        is_dark_mode: true
      });
      toast.success('Tema creado desde preset');
      loadThemes();
    } catch (error) {
      toast.error('Error al crear tema');
    }
  };

  const deleteTheme = async (id: string) => {
    try {
      await (supabase.from('cms_themes') as any).delete().eq('id', id);
      toast.success('Tema eliminado');
      if (selectedTheme?.id === id) setSelectedTheme(null);
      loadThemes();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const exportTheme = () => {
    if (!selectedTheme) return;
    const blob = new Blob([JSON.stringify({ name: selectedTheme.theme_name, colors: editedColors }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${selectedTheme.theme_name}.json`;
    a.click();
  };

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await (supabase.from('cms_themes') as any).insert({
          theme_name: data.name || 'Imported Theme',
          color_palette: data.colors,
          is_active: false,
          is_dark_mode: true
        });
        toast.success('Tema importado');
        loadThemes();
      } catch {
        toast.error('Error al importar');
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Palette className="h-6 w-6" />Editor de Temas</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportTheme} disabled={!selectedTheme}><Download className="h-4 w-4 mr-2" />Exportar</Button>
          <label>
            <Button variant="outline" asChild><span><Upload className="h-4 w-4 mr-2" />Importar</span></Button>
            <input type="file" accept=".json" className="hidden" onChange={importTheme} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle>Temas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {themes.map(theme => (
              <div key={theme.id} className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${selectedTheme?.id === theme.id ? 'border-primary bg-primary/10' : ''}`} onClick={() => { setSelectedTheme(theme); setEditedColors(theme.color_palette as Record<string, string>); }}>
                <div className="flex items-center gap-2">
                  {theme.is_dark_mode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{theme.theme_name}</span>
                  {theme.is_active && <Check className="h-4 w-4 text-green-500" />}
                </div>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteTheme(theme.id); }}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader><CardTitle>Editor de Colores</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selectedTheme ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(editedColors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key.replace('_', ' ')}</Label>
                      <div className="flex gap-2">
                        <Input type="color" value={value} onChange={e => setEditedColors(p => ({ ...p, [key]: e.target.value }))} className="w-12 h-10 p-1" />
                        <Input value={value} onChange={e => setEditedColors(p => ({ ...p, [key]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={saveTheme}>Guardar Cambios</Button>
                  <Button variant="outline" onClick={() => activateTheme(selectedTheme)}>Activar Tema</Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Selecciona un tema para editar</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Presets Predefinidos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {presets.map(preset => (
              <div key={preset.name} className="p-4 border rounded-lg space-y-3">
                <div className="flex gap-1">
                  {Object.values(preset.colors).map((color, i) => (
                    <div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <p className="font-medium">{preset.name}</p>
                <Button size="sm" variant="outline" onClick={() => createFromPreset(preset)}>Usar</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
