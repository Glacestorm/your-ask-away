/**
 * ModuleTemplatesPanel - Templates predefinidos para crear módulos
 * Galería visual, preview, personalización
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Layout,
  Search,
  Star,
  Download,
  Clock,
  Plus,
  BarChart3,
  Database,
  MessageSquare,
  Workflow,
  Plug,
  FileText,
  Brain,
  Blocks,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { useModuleTemplates, ModuleTemplate, TemplateFilters } from '@/hooks/admin/useModuleTemplates';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ModuleTemplatesPanelProps {
  onCreateModule?: (moduleKey: string, moduleName: string) => void;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  BarChart3,
  Database,
  MessageSquare,
  Workflow,
  Plug,
  FileText,
  Brain,
  Blocks,
  Sparkles
};

export function ModuleTemplatesPanel({ onCreateModule, className }: ModuleTemplatesPanelProps) {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [customization, setCustomization] = useState({
    moduleKey: '',
    moduleName: '',
    description: ''
  });

  const {
    templates,
    selectedTemplate,
    isLoading,
    isCreating,
    fetchTemplates,
    createFromTemplate,
    selectTemplate,
    getCategories
  } = useModuleTemplates();

  const categories = getCategories();

  useEffect(() => {
    fetchTemplates(filters);
  }, [filters, fetchTemplates]);

  const handleCreate = async () => {
    if (!selectedTemplate || !customization.moduleKey || !customization.moduleName) return;
    
    const result = await createFromTemplate(selectedTemplate, customization);
    if (result) {
      setShowCreateDialog(false);
      setCustomization({ moduleKey: '', moduleName: '', description: '' });
      selectTemplate(null);
      onCreateModule?.(result.key, result.name);
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'basic': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-600 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.value === category);
    const IconComponent = iconMap[cat?.icon || 'Blocks'];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Blocks className="h-4 w-4" />;
  };

  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="h-6 w-6" /> : <Blocks className="h-6 w-6" />;
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Templates</CardTitle>
              <CardDescription className="text-xs">
                {templates.length} templates disponibles
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchTemplates(filters)} 
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              className="pl-8"
              value={filters.search || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <Select
            value={filters.category || 'all'}
            onValueChange={(v) => setFilters(prev => ({ 
              ...prev, 
              category: v === 'all' ? undefined : v 
            }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <span className="flex items-center gap-2">
                    {getCategoryIcon(cat.value)} {cat.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid */}
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.map((template, idx) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md group",
                  selectedTemplate?.id === template.id && "ring-2 ring-primary"
                )}
                onClick={() => selectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary group-hover:from-primary group-hover:to-accent group-hover:text-white transition-all">
                    {getIconComponent(template.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{template.name}</h4>
                      {template.isOfficial && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          <CheckCircle className="h-3 w-3 mr-0.5" /> Oficial
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-[10px]", getComplexityColor(template.complexity))}>
                        {template.complexity}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {template.estimatedTime}
                      </span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Download className="h-3 w-3" /> {template.downloads}
                      </span>
                      <span className="text-[10px] text-yellow-600 flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-current" /> {template.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map((feature, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">
                      {feature}
                    </Badge>
                  ))}
                  {template.features.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      +{template.features.length - 3}
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        {/* Create Button */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full gap-2" 
              disabled={!selectedTemplate}
            >
              <Plus className="h-4 w-4" />
              Crear Módulo desde Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear desde Template</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    {getIconComponent(selectedTemplate.icon)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedTemplate.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Clave del Módulo</Label>
                    <Input
                      placeholder="mi-modulo"
                      value={customization.moduleKey}
                      onChange={(e) => setCustomization(prev => ({ 
                        ...prev, 
                        moduleKey: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Nombre del Módulo</Label>
                    <Input
                      placeholder="Mi Módulo"
                      value={customization.moduleName}
                      onChange={(e) => setCustomization(prev => ({ ...prev, moduleName: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Descripción (opcional)</Label>
                    <Input
                      placeholder="Descripción del módulo..."
                      value={customization.description}
                      onChange={(e) => setCustomization(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCreate} 
                  disabled={isCreating || !customization.moduleKey || !customization.moduleName}
                  className="w-full"
                >
                  {isCreating ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Crear Módulo
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default ModuleTemplatesPanel;
