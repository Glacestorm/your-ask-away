import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BookOpen, 
  Send,
  Maximize2,
  Minimize2,
  Sparkles,
  FileText,
  Link2,
  RefreshCw,
  Plus,
  Search,
  Tag,
  TrendingUp,
  Clock,
  ThumbsUp,
  Eye,
  Edit,
  Trash2,
  Database,
  Brain,
  Lightbulb,
  MessageSquare,
  FolderOpen,
  Settings,
  Upload,
  Download,
  Filter,
  BarChart3,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useKnowledgeBaseRAG, KnowledgeArticle } from '@/hooks/admin/useKnowledgeBaseRAG';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface KnowledgeBaseRAGPanelProps {
  className?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: FolderOpen },
  { id: 'productos', label: 'Productos', icon: Layers },
  { id: 'procesos', label: 'Procesos', icon: Settings },
  { id: 'normativa', label: 'Normativa', icon: FileText },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'guias', label: 'Guías', icon: BookOpen },
  { id: 'troubleshooting', label: 'Solución de Problemas', icon: AlertCircle },
];

export function KnowledgeBaseRAGPanel({ className }: KnowledgeBaseRAGPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [inputQuery, setInputQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeArticle | null>(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    category: 'productos',
    tags: ''
  });
  
  const {
    isLoading,
    response,
    articles,
    results,
    error,
    askQuestion,
    semanticSearch,
    fetchArticles,
    addArticle,
    updateArticle,
    reindexKnowledgeBase
  } = useKnowledgeBaseRAG();

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    
    if (activeTab === 'search') {
      await semanticSearch(inputQuery);
    } else {
      await askQuestion(inputQuery);
    }
  }, [inputQuery, activeTab, askQuestion, semanticSearch]);

  const handleAddArticle = useCallback(async () => {
    if (!articleForm.title.trim() || !articleForm.content.trim()) return;
    
    const newArticle: Partial<KnowledgeArticle> = {
      title: articleForm.title,
      content: articleForm.content,
      category: articleForm.category,
      tags: articleForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      last_updated: new Date().toISOString(),
      view_count: 0,
      helpful_count: 0
    };
    
    if (editingArticle) {
      await updateArticle(editingArticle.id, newArticle);
    } else {
      await addArticle(newArticle);
    }
    
    setShowAddDialog(false);
    setEditingArticle(null);
    setArticleForm({ title: '', content: '', category: 'productos', tags: '' });
    fetchArticles();
  }, [articleForm, editingArticle, addArticle, updateArticle, fetchArticles]);

  const openEditDialog = useCallback((article: KnowledgeArticle) => {
    setEditingArticle(article);
    setArticleForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags.join(', ')
    });
    setShowAddDialog(true);
  }, []);

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  // Stats calculation
  const stats = {
    totalArticles: articles.length,
    totalViews: articles.reduce((sum, a) => sum + (a.view_count || 0), 0),
    totalHelpful: articles.reduce((sum, a) => sum + (a.helpful_count || 0), 0),
    categories: [...new Set(articles.map(a => a.category))].length,
    recentUpdates: articles.filter(a => {
      const updated = new Date(a.last_updated);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return updated > weekAgo;
    }).length
  };

  return (
    <Card className={cn(
      "transition-all duration-300 overflow-hidden",
      isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
      className
    )}>
      <CardHeader className="pb-2 bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Base de Conocimiento RAG
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  IA
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {stats.totalArticles} artículos • {stats.categories} categorías
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
                  </DialogTitle>
                  <DialogDescription>
                    Añade conocimiento a la base de datos para mejorar las respuestas de IA.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Título</label>
                    <Input
                      value={articleForm.title}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título del artículo..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoría</label>
                    <Select 
                      value={articleForm.category} 
                      onValueChange={(val) => setArticleForm(prev => ({ ...prev, category: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <cat.icon className="h-4 w-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contenido</label>
                    <Textarea
                      value={articleForm.content}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Contenido detallado del artículo..."
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Etiquetas (separadas por coma)</label>
                    <Input
                      value={articleForm.tags}
                      onChange={(e) => setArticleForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="etiqueta1, etiqueta2, etiqueta3..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setShowAddDialog(false);
                    setEditingArticle(null);
                    setArticleForm({ title: '', content: '', category: 'productos', tags: '' });
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddArticle} disabled={!articleForm.title.trim() || !articleForm.content.trim()}>
                    {editingArticle ? 'Guardar Cambios' : 'Añadir Artículo'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => reindexKnowledgeBase()}
              disabled={isLoading}
              className="h-8 w-8"
              title="Reindexar base de conocimiento"
            >
              <Database className={cn("h-4 w-4", isLoading && "animate-pulse")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fetchArticles()}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="search" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="ask" className="text-xs">
              <MessageSquare className="h-3 w-3 mr-1" />
              Preguntar
            </TabsTrigger>
            <TabsTrigger value="articles" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Artículos
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              <BarChart3 className="h-3 w-3 mr-1" />
              Stats
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="flex-1 mt-0 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Buscar en la base de conocimiento..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !inputQuery.trim()}>
                {isLoading ? (
                  <Sparkles className="h-4 w-4 animate-pulse" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </form>

            <ScrollArea className={isExpanded ? "h-[calc(100vh-360px)]" : "h-[200px]"}>
              <div className="space-y-2">
                {results.length > 0 ? (
                  results.map((result, index) => (
                    <div key={index} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{result.article.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {result.answer_snippet || result.article.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {result.article.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Similitud: {(result.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge 
                            variant={result.similarity > 0.8 ? "default" : result.similarity > 0.5 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {result.similarity > 0.8 ? <CheckCircle className="h-3 w-3" /> : 
                             result.similarity > 0.5 ? <AlertCircle className="h-3 w-3" /> : 
                             <XCircle className="h-3 w-3" />}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : !isLoading && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Escribe para buscar en {stats.totalArticles} artículos</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Ask Tab */}
          <TabsContent value="ask" className="flex-1 mt-0 space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Haz una pregunta a la IA..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !inputQuery.trim()}>
                {isLoading ? (
                  <Sparkles className="h-4 w-4 animate-pulse" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>

            <ScrollArea className={isExpanded ? "h-[calc(100vh-360px)]" : "h-[200px]"}>
              {response ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border bg-gradient-to-r from-primary/5 to-secondary/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Respuesta IA</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Confianza: {(response.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </div>

                  {response.sources && response.sources.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        Fuentes ({response.sources.length})
                      </span>
                      {response.sources.map((source, index) => (
                        <div key={index} className="p-2 rounded-lg border bg-muted/30 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{source.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {(source.relevance * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {response.follow_up_questions && response.follow_up_questions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        Preguntas relacionadas
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {response.follow_up_questions.map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setInputQuery(q);
                            }}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : !isLoading && (
                <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Haz una pregunta para obtener una respuesta basada en tu base de conocimiento</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles" className="flex-1 mt-0 space-y-3">
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] h-8">
                  <Filter className="h-3 w-3 mr-2" />
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-4 w-4" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs">
                {filteredArticles.length} artículos
              </Badge>
            </div>

            <ScrollArea className={isExpanded ? "h-[calc(100vh-400px)]" : "h-[180px]"}>
              <div className="space-y-2">
                {filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <div key={article.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium">{article.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {article.content.substring(0, 100)}...
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIES.find(c => c.id === article.category)?.label || article.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {article.view_count || 0}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              {article.helpful_count || 0}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(article.last_updated), { locale: es, addSuffix: true })}
                            </span>
                          </div>
                          {article.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              <Tag className="h-3 w-3 text-muted-foreground" />
                              {article.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {article.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{article.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => openEditDialog(article)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay artículos en esta categoría</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowAddDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Añadir Artículo
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="flex-1 mt-0 space-y-3">
            <ScrollArea className={isExpanded ? "h-[calc(100vh-320px)]" : "h-[220px]"}>
              <div className="space-y-4">
                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-1 text-emerald-500" />
                    <p className="text-2xl font-bold">{stats.totalArticles}</p>
                    <p className="text-xs text-muted-foreground">Artículos</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-center">
                    <FolderOpen className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                    <p className="text-2xl font-bold">{stats.categories}</p>
                    <p className="text-xs text-muted-foreground">Categorías</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-500/10 to-pink-500/10 text-center">
                    <Eye className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-2xl font-bold">{stats.totalViews}</p>
                    <p className="text-xs text-muted-foreground">Vistas</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-center">
                    <ThumbsUp className="h-6 w-6 mx-auto mb-1 text-amber-500" />
                    <p className="text-2xl font-bold">{stats.totalHelpful}</p>
                    <p className="text-xs text-muted-foreground">Votos Útiles</p>
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="p-3 rounded-lg border bg-card">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Distribución por Categoría
                  </h4>
                  <div className="space-y-2">
                    {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                      const count = articles.filter(a => a.category === cat.id).length;
                      const percentage = stats.totalArticles > 0 ? (count / stats.totalArticles) * 100 : 0;
                      return (
                        <div key={cat.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <cat.icon className="h-3 w-3" />
                              {cat.label}
                            </span>
                            <span className="text-muted-foreground">{count}</span>
                          </div>
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="p-3 rounded-lg border bg-card">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Actividad Reciente
                  </h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Actualizados esta semana</span>
                    <Badge variant="secondary">{stats.recentUpdates}</Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => reindexKnowledgeBase()}
                    disabled={isLoading}
                  >
                    <Database className="h-4 w-4 mr-1" />
                    Reindexar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Importar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-2 p-2 rounded-lg border border-destructive/50 bg-destructive/10 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KnowledgeBaseRAGPanel;
