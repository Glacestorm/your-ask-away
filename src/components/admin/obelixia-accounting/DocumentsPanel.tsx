/**
 * DocumentsPanel - Phase 11C
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Search, FileText, Brain, Archive } from 'lucide-react';
import { useObelixiaDocuments } from '@/hooks/admin/obelixia-accounting';
import { cn } from '@/lib/utils';

export function DocumentsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isLoading, documents, searchResults, fetchDocuments, semanticSearch, analyzeDocument } = useObelixiaDocuments();

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleSearch = () => {
    if (searchQuery.trim()) semanticSearch(searchQuery);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión Documental IA</h2>
          <p className="text-muted-foreground">Archivo digital con OCR y búsqueda semántica</p>
        </div>
        <Button onClick={() => fetchDocuments()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      <div className="flex gap-2">
        <Input 
          placeholder="Buscar documentos..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" /> Buscar
        </Button>
      </div>

      <ScrollArea className="h-[500px]">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm truncate">{doc.name}</CardTitle>
                </div>
                <Badge variant="outline">{doc.type}</Badge>
              </CardHeader>
              <CardContent>
                {doc.aiAnalysis && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{doc.aiAnalysis.summary}</p>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => analyzeDocument(doc.id)}>
                    <Brain className="h-3 w-3 mr-1" /> Analizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default DocumentsPanel;
