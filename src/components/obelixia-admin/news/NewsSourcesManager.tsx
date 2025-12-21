import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, ExternalLink, RefreshCw, AlertCircle, 
  CheckCircle, Clock, Rss, BarChart3 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NewsSource {
  id: string;
  name: string;
  url: string;
  category: string;
  is_active: boolean;
  articles_fetched: number;
  articles_relevant: number;
  last_fetch_at: string | null;
  error_count: number;
  last_error: string | null;
  created_at: string;
}

const CATEGORIES = [
  'Legal', 'Tecnología', 'Economía', 'Ciberseguridad', 
  'Normativa', 'Protección Datos', 'Finanzas', 'Fiscal', 'Empresarial'
];

export const NewsSourcesManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'Empresarial' });

  const { data: sources, isLoading } = useQuery({
    queryKey: ['news-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_sources')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as NewsSource[];
    }
  });

  const addSourceMutation = useMutation({
    mutationFn: async (source: { name: string; url: string; category: string }) => {
      const { error } = await supabase.from('news_sources').insert(source);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fuente añadida correctamente');
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
      setIsDialogOpen(false);
      setNewSource({ name: '', url: '', category: 'Empresarial' });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const toggleSourceMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('news_sources')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news_sources').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fuente eliminada');
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const getRelevanceRate = (source: NewsSource) => {
    if (source.articles_fetched === 0) return 0;
    return Math.round((source.articles_relevant / source.articles_fetched) * 100);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando fuentes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Fuentes RSS</h3>
          <p className="text-sm text-slate-400">
            {sources?.filter(s => s.is_active).length} activas de {sources?.length} totales
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Añadir Fuente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Nueva Fuente RSS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label className="text-slate-300">Nombre</Label>
                <Input
                  value={newSource.name}
                  onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                  placeholder="Ej: El Economista - Legal"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">URL del Feed RSS</Label>
                <Input
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  placeholder="https://ejemplo.com/rss/feed.xml"
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div>
                <Label className="text-slate-300">Categoría</Label>
                <Select
                  value={newSource.category}
                  onValueChange={(v) => setNewSource({ ...newSource, category: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addSourceMutation.mutate(newSource)}
                disabled={!newSource.name || !newSource.url || addSourceMutation.isPending}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Añadir Fuente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources?.map((source) => (
          <Card 
            key={source.id} 
            className={`bg-slate-800/50 border-slate-700 ${!source.is_active ? 'opacity-60' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Rss className={`w-4 h-4 ${source.is_active ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <h4 className="font-medium text-white text-sm">{source.name}</h4>
                </div>
                <Switch
                  checked={source.is_active}
                  onCheckedChange={(checked) => 
                    toggleSourceMutation.mutate({ id: source.id, is_active: checked })
                  }
                />
              </div>

              <Badge variant="outline" className="mb-3 text-xs">
                {source.category}
              </Badge>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-slate-900/50 p-2 rounded">
                  <span className="text-slate-400">Artículos</span>
                  <p className="text-white font-medium">{source.articles_fetched}</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded">
                  <span className="text-slate-400">Relevancia</span>
                  <p className={`font-medium ${
                    getRelevanceRate(source) >= 50 ? 'text-emerald-400' : 
                    getRelevanceRate(source) >= 25 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {getRelevanceRate(source)}%
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-xs mb-3">
                {source.error_count > 0 ? (
                  <div className="flex items-center gap-1 text-red-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>{source.error_count} errores</span>
                  </div>
                ) : source.last_fetch_at ? (
                  <div className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    <span>Hace {formatDistanceToNow(new Date(source.last_fetch_at), { locale: es })}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Pendiente</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver Feed
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('¿Eliminar esta fuente?')) {
                      deleteSourceMutation.mutate(source.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
