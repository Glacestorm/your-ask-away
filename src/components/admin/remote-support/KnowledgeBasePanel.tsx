import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  BookOpen,
  Search,
  FileText,
  HelpCircle,
  Wrench,
  AlertCircle,
  FileCode,
  MessageSquare,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Tag,
  FolderOpen,
  Cpu,
  Zap
} from 'lucide-react';
import { useKnowledgeBase, type KnowledgeDocument } from '@/hooks/admin/support/useKnowledgeBase';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface KnowledgeBasePanelProps {
  onDocumentSelect?: (doc: KnowledgeDocument) => void;
  className?: string;
}

export function KnowledgeBasePanel({ 
  onDocumentSelect,
  className 
}: KnowledgeBasePanelProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);

  const {
    isLoading,
    isSearching,
    documents,
    searchResults,
    categories,
    fetchDocuments,
    searchDocuments,
    recordDocumentFeedback,
    incrementViewCount,
    generateEmbeddingsBulk,
    getDocumentStats
  } = useKnowledgeBase();

  const stats = getDocumentStats();

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    await searchDocuments({
      query: searchQuery,
      category: selectedCategory || undefined,
      useSemantic: true
    });
    setActiveTab('search');
  }, [searchQuery, selectedCategory, searchDocuments]);

  const handleDocumentClick = useCallback((doc: KnowledgeDocument) => {
    incrementViewCount(doc.id);
    onDocumentSelect?.(doc);
  }, [incrementViewCount, onDocumentSelect]);

  const handleGenerateEmbeddings = useCallback(async () => {
    setIsGeneratingEmbeddings(true);
    try {
      await generateEmbeddingsBulk();
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }, [generateEmbeddingsBulk]);

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4 text-blue-400" />;
      case 'faq': return <HelpCircle className="h-4 w-4 text-green-400" />;
      case 'procedure': return <Wrench className="h-4 w-4 text-orange-400" />;
      case 'troubleshooting': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'template': return <FileCode className="h-4 w-4 text-purple-400" />;
      case 'script': return <MessageSquare className="h-4 w-4 text-cyan-400" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getEmbeddingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 text-xs">IA Ready</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-400 text-xs">Procesando</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Pendiente</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 text-xs">Error</Badge>;
      default:
        return null;
    }
  };

  const filteredDocs = selectedCategory 
    ? documents.filter(d => d.category === selectedCategory)
    : documents;

  return (
    <Card className={cn("transition-all duration-300 overflow-hidden", className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Base de Conocimiento
                <Badge variant="outline" className="text-xs">IA</Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {stats.totalDocs} documentos • {categories.length} categorías
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchDocuments()}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar en la base de conocimiento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
          <Button 
            size="sm" 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            {isSearching ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 mb-3">
            <TabsTrigger value="browse" className="text-xs">
              <FolderOpen className="h-3 w-3 mr-1" />
              Explorar
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs">
              <Search className="h-3 w-3 mr-1" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-0">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 mb-3">
              <Button
                variant={selectedCategory === null ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="text-xs h-7"
              >
                Todos
              </Button>
              {categories.slice(0, 5).map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs h-7"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {filteredDocs.map((doc) => (
                  <div 
                    key={doc.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleDocumentClick(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getDocTypeIcon(doc.document_type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {doc.category} {doc.subcategory && `• ${doc.subcategory}`}
                          </p>
                        </div>
                      </div>
                      {getEmbeddingStatusBadge(doc.embedding_status)}
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {doc.view_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-green-400" />
                          {doc.helpful_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3 text-red-400" />
                          {doc.not_helpful_count}
                        </span>
                      </div>
                      <span>{formatDistanceToNow(new Date(doc.updated_at), { locale: es, addSuffix: true })}</span>
                    </div>

                    {doc.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {doc.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px] py-0">
                            <Tag className="h-2 w-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 3 && (
                          <Badge variant="outline" className="text-[10px] py-0">
                            +{doc.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {filteredDocs.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay documentos</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Crear documento
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="mt-0">
            <ScrollArea className="h-[320px]">
              <div className="space-y-2">
                {searchResults.map((result, idx) => (
                  <div 
                    key={result.document.id}
                    className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleDocumentClick(result.document)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{result.document.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Relevancia: {(result.relevanceScore * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      {getDocTypeIcon(result.document.document_type)}
                    </div>
                    
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {result.snippet}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          recordDocumentFeedback(result.document.id, true);
                        }}
                      >
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        Útil
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          recordDocumentFeedback(result.document.id, false);
                        }}
                      >
                        <ThumbsDown className="h-3 w-3 mr-1" />
                        No útil
                      </Button>
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Sin resultados para "{searchQuery}"</p>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Ingresa un término de búsqueda</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="mt-0">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Total Docs</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{stats.totalDocs}</p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">Total Vistas</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats.totalViews}</p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-yellow-500/10 to-amber-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <ThumbsUp className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">% Útil</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {(stats.helpfulRatio * 100).toFixed(0)}%
                </p>
              </div>

              <div className="p-3 rounded-lg border bg-gradient-to-br from-purple-500/10 to-violet-500/10">
              <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Embeddings Pend.</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{stats.pendingEmbeddings}</p>
                {stats.pendingEmbeddings > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full text-xs"
                    onClick={handleGenerateEmbeddings}
                    disabled={isGeneratingEmbeddings}
                  >
                    {isGeneratingEmbeddings ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3 mr-1" />
                    )}
                    Generar
                  </Button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg border">
              <h4 className="text-sm font-medium mb-2">Por Tipo</h4>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {getDocTypeIcon(type)}
                      <span className="capitalize">{type}</span>
                    </div>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default KnowledgeBasePanel;
