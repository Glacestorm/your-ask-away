import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Type, 
  Square, 
  LayoutGrid, 
  Table, 
  FileText, 
  BarChart3,
  Image,
  List,
  Calendar,
  Map,
  Gauge,
  Bell,
  CreditCard,
  Users,
  Settings
} from 'lucide-react';

interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
}

const COMPONENTS = [
  { type: 'heading', label: 'Encabezado', icon: Type, category: 'Básicos' },
  { type: 'text', label: 'Texto', icon: FileText, category: 'Básicos' },
  { type: 'card', label: 'Tarjeta', icon: Square, category: 'Básicos' },
  { type: 'grid', label: 'Grid', icon: LayoutGrid, category: 'Layout' },
  { type: 'table', label: 'Tabla', icon: Table, category: 'Datos' },
  { type: 'list', label: 'Lista', icon: List, category: 'Datos' },
  { type: 'chart', label: 'Gráfico', icon: BarChart3, category: 'Datos' },
  { type: 'kpi', label: 'KPI', icon: Gauge, category: 'Datos' },
  { type: 'form', label: 'Formulario', icon: FileText, category: 'Interactivo' },
  { type: 'calendar', label: 'Calendario', icon: Calendar, category: 'Interactivo' },
  { type: 'map', label: 'Mapa', icon: Map, category: 'Interactivo' },
  { type: 'image', label: 'Imagen', icon: Image, category: 'Media' },
  { type: 'alert', label: 'Alerta', icon: Bell, category: 'UI' },
  { type: 'stats_card', label: 'Stats Card', icon: CreditCard, category: 'UI' },
  { type: 'user_list', label: 'Lista Usuarios', icon: Users, category: 'Widgets' },
  { type: 'settings', label: 'Configuración', icon: Settings, category: 'Widgets' },
];

export function ComponentPalette({ onAddComponent }: ComponentPaletteProps) {
  const categories = [...new Set(COMPONENTS.map(c => c.category))];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Componentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] px-4">
          {categories.map((category) => (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {COMPONENTS.filter(c => c.category === category).map((component) => {
                  const Icon = component.icon;
                  return (
                    <button
                      key={component.type}
                      onClick={() => onAddComponent(component.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-center"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{component.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
