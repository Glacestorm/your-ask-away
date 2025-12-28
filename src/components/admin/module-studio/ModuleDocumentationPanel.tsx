/**
 * ModuleDocumentationPanel - Documentation Generator para módulos
 * Generación automática de docs, API reference, ejemplos
 * Enhanced with more interactivity
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  FileText, 
  RefreshCw, 
  Sparkles,
  Maximize2,
  Minimize2,
  Book,
  Code,
  Copy,
  Check,
  Download,
  FileCode,
  Search,
  Eye,
  Edit,
  ChevronDown,
  FileJson,
  FileType
} from 'lucide-react';
import { useModuleDocumentationGenerator } from '@/hooks/admin/useModuleDocumentationGenerator';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ModuleDocContext {
  moduleKey: string;
  moduleName?: string;
}

interface ModuleDocumentationPanelProps {
  context: ModuleDocContext | null;
  className?: string;
}

export function ModuleDocumentationPanel({ context, className }: ModuleDocumentationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('pages');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [showPagePreview, setShowPagePreview] = useState(false);

  const {
    isLoading,
    pages,
    apiReferences,
    examples,
    activeJob,
    stats,
    generateDocumentation,
    getDocumentation,
    exportDocumentation,
  } = useModuleDocumentationGenerator();

  const handleGenerateAll = useCallback(async () => {
    if (context?.moduleKey) {
      await generateDocumentation(context.moduleKey, {
        includeApi: true,
        includeExamples: true,
        includeChangelog: true,
      });
      toast.success('Documentación generada con IA');
    }
  }, [context?.moduleKey, generateDocumentation]);

  const handleCopy = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleExport = useCallback(async (format: 'markdown' | 'html' | 'pdf') => {
    if (context?.moduleKey) {
      const url = await exportDocumentation(context.moduleKey, format);
      if (url) {
        toast.success(`Exportado como ${format.toUpperCase()}`);
        window.open(url, '_blank');
      }
    }
  }, [context?.moduleKey, exportDocumentation]);

  const handlePreviewPage = (page: any) => {
    setSelectedPage(page);
    setShowPagePreview(true);
  };

  // Filter content based on search
  const filteredPages = pages?.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredApiRefs = apiReferences?.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredExamples = examples?.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!context) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-6 text-center">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para generar docs</p>
        </CardContent>
      </Card>
    );
  }

  const hasPages = filteredPages.length > 0;
  const hasApiRefs = filteredApiRefs.length > 0;
  const hasExamples = filteredExamples.length > 0;

  return (
    <TooltipProvider>
      <Card className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "fixed inset-4 z-50 shadow-2xl" : "",
        className
      )}>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div 
                className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="h-5 w-5 text-white" />
              </motion.div>
              <div>
                <CardTitle className="text-base">Documentation Generator</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {stats?.last_generated 
                    ? `Generado ${formatDistanceToNow(new Date(stats.last_generated), { locale: es, addSuffix: true })}`
                    : 'Sin generar aún'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleGenerateAll}
                disabled={isLoading}
                className="h-8 w-8"
                title="Generar con IA"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50">
                  <Download className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Exportar como</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('markdown')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Markdown (.md)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('html')}>
                    <FileCode className="h-4 w-4 mr-2" />
                    HTML (.html)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <FileType className="h-4 w-4 mr-2" />
                    PDF (.pdf)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className={cn("pt-3", isExpanded ? "h-[calc(100%-80px)]" : "")}>
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar en documentación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {/* Animated Quick Stats */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge 
                variant={hasPages ? 'default' : 'outline'} 
                className="text-xs cursor-pointer"
                onClick={() => setActiveTab('pages')}
              >
                <Book className="h-3 w-3 mr-1" />
                {filteredPages.length} Pages
              </Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge 
                variant={hasApiRefs ? 'default' : 'outline'} 
                className="text-xs cursor-pointer"
                onClick={() => setActiveTab('api')}
              >
                <Code className="h-3 w-3 mr-1" />
                {filteredApiRefs.length} API
              </Badge>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Badge 
                variant={hasExamples ? 'default' : 'outline'} 
                className="text-xs cursor-pointer"
                onClick={() => setActiveTab('examples')}
              >
                <FileCode className="h-3 w-3 mr-1" />
                {filteredExamples.length} Examples
              </Badge>
            </motion.div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="pages" className="text-xs">Páginas</TabsTrigger>
              <TabsTrigger value="api" className="text-xs">API Ref</TabsTrigger>
              <TabsTrigger value="examples" className="text-xs">Ejemplos</TabsTrigger>
            </TabsList>

            <TabsContent value="pages" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                <AnimatePresence mode="popLayout">
                  {hasPages ? (
                    <div className="space-y-2">
                      {filteredPages.map((page, index) => (
                        <motion.div 
                          key={page.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handlePreviewPage(page)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{page.title}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">{page.category}</Badge>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => { e.stopPropagation(); handlePreviewPage(page); }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {page.content?.slice(0, 100)}...
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      className="text-center py-8 text-muted-foreground text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Genera documentación con IA</p>
                      <Button 
                        size="sm" 
                        className="mt-3"
                        onClick={handleGenerateAll}
                        disabled={isLoading}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generar Docs
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="api" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                <AnimatePresence mode="popLayout">
                  {hasApiRefs ? (
                    <div className="space-y-2">
                      {filteredApiRefs.map((api, index) => (
                        <motion.div 
                          key={api.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium font-mono">{api.name}</span>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">{api.type}</Badge>
                              {api.signature && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => handleCopy(api.signature, api.id)}
                                  title="Copiar firma"
                                >
                                  {copiedId === api.id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{api.description}</p>
                          {api.signature && (
                            <pre className="mt-2 text-xs p-2 bg-muted/50 rounded font-mono overflow-x-auto">
                              {api.signature}
                            </pre>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>API Reference no generada</p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="examples" className="flex-1 mt-0">
              <ScrollArea className={isExpanded ? "h-[calc(100vh-350px)]" : "h-[200px]"}>
                <AnimatePresence mode="popLayout">
                  {hasExamples ? (
                    <div className="space-y-3">
                      {filteredExamples.map((example, index) => (
                        <motion.div 
                          key={example.id} 
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{example.title}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={() => handleCopy(example.code, example.id)}
                              title="Copiar código"
                            >
                              {copiedId === example.id ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <pre className="text-xs p-2 bg-muted/50 rounded font-mono overflow-x-auto max-h-32">
                            {example.code}
                          </pre>
                          {example.description && (
                            <p className="text-xs text-muted-foreground mt-2">{example.description}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <FileCode className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Ejemplos no generados</p>
                    </div>
                  )}
                </AnimatePresence>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Page Preview Dialog */}
        <Dialog open={showPagePreview} onOpenChange={setShowPagePreview}>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                {selectedPage?.title}
              </DialogTitle>
              <DialogDescription>
                {selectedPage?.category && (
                  <Badge variant="outline" className="mt-1">{selectedPage.category}</Badge>
                )}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="prose prose-sm dark:prose-invert">
                <pre className="whitespace-pre-wrap text-sm">
                  {selectedPage?.content}
                </pre>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline"
                onClick={() => selectedPage && handleCopy(selectedPage.content, 'page-content')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}

export default ModuleDocumentationPanel;
