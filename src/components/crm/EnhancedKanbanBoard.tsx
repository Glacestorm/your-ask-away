import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, Filter, Plus, Clock, AlertTriangle, Zap, 
  ArrowUpDown, Eye, MoreHorizontal, TrendingUp, User,
  Calendar, DollarSign, Star, MessageSquare, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: number;
  probability?: number;
  assignee?: { id: string; name: string; avatar?: string };
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  automationStatus?: 'pending' | 'running' | 'completed';
  slaStatus?: 'on_track' | 'at_risk' | 'breached';
  lastActivity?: string;
  unreadMessages?: number;
  isVip?: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  items: KanbanItem[];
  automations?: { name: string; isActive: boolean }[];
}

interface EnhancedKanbanBoardProps {
  columns: KanbanColumn[];
  onMoveItem: (itemId: string, fromColumn: string, toColumn: string) => void;
  onItemClick?: (item: KanbanItem) => void;
  onAddItem?: (columnId: string) => void;
  title?: string;
}

function SortableCard({ item, onClick }: { item: KanbanItem; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'high': return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      case 'medium': return 'border-l-amber-500';
      default: return 'border-l-muted';
    }
  };

  const getSlaStatusIcon = (status?: string) => {
    switch (status) {
      case 'at_risk': return <Clock className="h-3 w-3 text-amber-500" />;
      case 'breached': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <Card 
        className={cn(
          "border-l-4 hover:shadow-lg transition-all duration-200 group",
          getPriorityColor(item.priority),
          item.isVip && "ring-2 ring-amber-400/50"
        )}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {item.isVip && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                )}
                <h4 className="font-semibold text-sm truncate">{item.title}</h4>
              </div>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {item.unreadMessages && item.unreadMessages > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {item.unreadMessages}
                </Badge>
              )}
              {getSlaStatusIcon(item.slaStatus)}
              {item.automationStatus === 'running' && (
                <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
              )}
            </div>
          </div>

          {/* Value & Probability */}
          <div className="flex items-center justify-between">
            {item.value !== undefined ? (
              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                <DollarSign className="h-3.5 w-3.5" />
                {new Intl.NumberFormat('es-ES', { 
                  style: 'currency', 
                  currency: 'EUR',
                  notation: 'compact',
                  maximumFractionDigits: 1 
                }).format(item.value)}
              </div>
            ) : (
              <span />
            )}
            
            {item.probability !== undefined && (
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs font-medium",
                  item.probability >= 75 && "border-green-500 text-green-600",
                  item.probability >= 50 && item.probability < 75 && "border-amber-500 text-amber-600",
                  item.probability < 50 && "border-muted-foreground"
                )}
              >
                {item.probability}%
              </Badge>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
            {item.assignee && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[80px]">{item.assignee.name.split(' ')[0]}</span>
                  </TooltipTrigger>
                  <TooltipContent>{item.assignee.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {item.dueDate && (
              <div className={cn(
                "flex items-center gap-1",
                new Date(item.dueDate) < new Date() && "text-red-500"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(item.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EnhancedKanbanBoard({ 
  columns, 
  onMoveItem, 
  onItemClick, 
  onAddItem,
  title 
}: EnhancedKanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [slaFilter, setSlaFilter] = useState<string>('all');
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const filteredColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      items: col.items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
        const matchesSla = slaFilter === 'all' || item.slaStatus === slaFilter;
        return matchesSearch && matchesPriority && matchesSla;
      })
    }));
  }, [columns, searchTerm, priorityFilter, slaFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const item = columns.flatMap(c => c.items).find(i => i.id === active.id);
    setActiveItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find source and destination columns
    const sourceColumn = columns.find(c => c.items.some(i => i.id === activeId));
    const destColumn = columns.find(c => c.id === overId || c.items.some(i => i.id === overId));
    
    if (sourceColumn && destColumn && sourceColumn.id !== destColumn.id) {
      onMoveItem(activeId, sourceColumn.id, destColumn.id);
    }
  };

  const totalItems = columns.reduce((sum, col) => sum + col.items.length, 0);
  const totalValue = columns.reduce((sum, col) => 
    sum + col.items.reduce((s, i) => s + (i.value || 0), 0), 0
  );

  return (
    <div className="space-y-4">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          {title && <h2 className="text-xl font-semibold">{title}</h2>}
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{totalItems} elementos</span>
            <span>•</span>
            <span className="text-green-600 font-medium">
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', notation: 'compact' }).format(totalValue)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[200px]"
            />
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={slaFilter} onValueChange={setSlaFilter}>
            <SelectTrigger className="w-[130px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="SLA" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="on_track">En tiempo</SelectItem>
              <SelectItem value="at_risk">En riesgo</SelectItem>
              <SelectItem value="breached">Vencido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {filteredColumns.map((column) => (
            <Card 
              key={column.id} 
              className={cn("min-h-[450px] flex flex-col", column.bgColor)}
            >
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className={cn("flex items-center gap-2", column.color)}>
                    {column.icon}
                    {column.title}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {column.items.length}
                    </Badge>
                    {column.automations?.some(a => a.isActive) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Zap className="h-3.5 w-3.5 text-primary" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Automatizaciones activas:</p>
                            <ul className="text-xs">
                              {column.automations.filter(a => a.isActive).map((a, i) => (
                                <li key={i}>• {a.name}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardTitle>
                {column.items.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {new Intl.NumberFormat('es-ES', { 
                      style: 'currency', 
                      currency: 'EUR', 
                      notation: 'compact' 
                    }).format(column.items.reduce((s, i) => s + (i.value || 0), 0))}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="p-2 flex-1 flex flex-col">
                <SortableContext 
                  items={column.items.map(i => i.id)} 
                  strategy={verticalListSortingStrategy}
                  id={column.id}
                >
                  <ScrollArea className="flex-1 h-[350px] pr-2">
                    <div className="space-y-2">
                      <AnimatePresence>
                        {column.items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SortableCard 
                              item={item} 
                              onClick={() => onItemClick?.(item)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {column.items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Sin elementos
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SortableContext>
                
                {onAddItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 border-dashed border"
                    onClick={() => onAddItem(column.id)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Añadir
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <Card className="border-l-4 border-l-primary shadow-2xl rotate-3">
              <CardContent className="p-3">
                <h4 className="font-semibold text-sm">{activeItem.title}</h4>
                {activeItem.subtitle && (
                  <p className="text-xs text-muted-foreground">{activeItem.subtitle}</p>
                )}
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
