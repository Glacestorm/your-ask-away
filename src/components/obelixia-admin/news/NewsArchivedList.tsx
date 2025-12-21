import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Archive, Search, ExternalLink, Star, Tag, 
  Calendar, TrendingUp, Filter, Download
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArchivedArticle {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  source_name: string;
  source_url: string;
  published_at: string;
  relevance_score: number;
  importance_level: string;
  product_connection: string | null;
  detected_trends: string[] | null;
  archive_reason: string | null;
  tags: string[] | null;
}

export const NewsArchivedList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importanceFilter, setImportanceFilter] = useState<string>('all');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['archived-articles', searchQuery, categoryFilter, importanceFilter],
    queryFn: async () => {
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('is_archived', true)
        .order('published_at', { ascending: false });
      
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (importanceFilter !== 'all') {
        query = query.eq('importance_level', importanceFilter);
      }
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as ArchivedArticle[];
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['archived-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('category')
        .eq('is_archived', true);
      if (error) throw error;
      const unique = [...new Set(data?.map(d => d.category).filter(Boolean))];
      return unique;
    }
  });

  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('news_articles')
        .update({ is_archived: false, archive_reason: null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Artículo desarchivado');
      queryClient.invalidateQueries({ queryKey: ['archived-articles'] });
    }
  });

  const getImportanceBadge = (level: string) => {
    const styles: Record<string, string> = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/50',
      high: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      medium: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      low: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    };
    const labels: Record<string, string> = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo'
    };
    return (
      <Badge className={styles[level] || styles.medium}>
        {labels[level] || level}
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (!articles || articles.length === 0) return;
    
    const headers = ['Título', 'Categoría', 'Fuente', 'Fecha', 'Relevancia', 'Importancia', 'Conexión Producto'];
    const rows = articles.map(a => [
      a.title,
      a.category,
      a.source_name,
      format(new Date(a.published_at), 'dd/MM/yyyy'),
      a.relevance_score,
      a.importance_level,
      a.product_connection || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `noticias-archivadas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando histórico...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-purple-400" />
            Histórico Importante
          </h3>
          <p className="text-sm text-slate-400">{articles?.length || 0} artículos archivados</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportToCSV}
          disabled={!articles || articles.length === 0}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en histórico..."
            className="pl-10 bg-slate-800 border-slate-600"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories?.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={importanceFilter} onValueChange={setImportanceFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-600">
            <SelectValue placeholder="Importancia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Medio</SelectItem>
            <SelectItem value="low">Bajo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Articles List */}
      {articles?.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No hay artículos archivados</p>
            <p className="text-sm text-slate-500">Las noticias importantes se archivarán automáticamente</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3">
            {articles?.map((article) => (
              <Card key={article.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Star className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <Badge variant="outline" className="text-xs">{article.category}</Badge>
                        {getImportanceBadge(article.importance_level)}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          article.relevance_score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                          article.relevance_score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {article.relevance_score}%
                        </span>
                      </div>
                      
                      <h4 className="font-medium text-white text-sm mb-1 line-clamp-2">
                        {article.title}
                      </h4>
                      
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                        {article.excerpt}
                      </p>

                      {/* Product Connection */}
                      {article.product_connection && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 mb-2">
                          <p className="text-xs text-purple-400">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            {article.product_connection}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {article.tags.slice(0, 4).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(article.published_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span>{article.source_name}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unarchiveMutation.mutate(article.id)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Desarchivar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
