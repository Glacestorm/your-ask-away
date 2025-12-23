/**
 * Action Quick Log Component
 * Provides quick buttons to log common actions during a session
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Settings, 
  Database, 
  Wrench, 
  FileSearch, 
  Terminal,
  Camera,
  AlertTriangle,
  Plus
} from 'lucide-react';
import type { ActionType, RiskLevel } from '@/hooks/admin/useSessionActionLogger';

interface ActionQuickLogProps {
  onLogAction: (params: {
    actionType: ActionType;
    description: string;
    componentAffected?: string;
    riskLevel?: RiskLevel;
    requiresApproval?: boolean;
    metadata?: Record<string, unknown>;
  }) => Promise<unknown>;
  isLogging: boolean;
}

const quickActions = [
  { 
    type: 'config_change' as ActionType, 
    label: 'Cambio Config', 
    icon: Settings, 
    risk: 'medium' as RiskLevel,
    color: 'text-blue-500' 
  },
  { 
    type: 'data_access' as ActionType, 
    label: 'Acceso Datos', 
    icon: Database, 
    risk: 'low' as RiskLevel,
    color: 'text-green-500' 
  },
  { 
    type: 'system_repair' as ActionType, 
    label: 'Reparación', 
    icon: Wrench, 
    risk: 'high' as RiskLevel,
    color: 'text-orange-500' 
  },
  { 
    type: 'diagnostic_run' as ActionType, 
    label: 'Diagnóstico', 
    icon: FileSearch, 
    risk: 'low' as RiskLevel,
    color: 'text-purple-500' 
  },
  { 
    type: 'command_execution' as ActionType, 
    label: 'Comando', 
    icon: Terminal, 
    risk: 'high' as RiskLevel,
    color: 'text-red-500' 
  },
  { 
    type: 'screenshot_capture' as ActionType, 
    label: 'Captura', 
    icon: Camera, 
    risk: 'low' as RiskLevel,
    color: 'text-cyan-500' 
  },
];

export function ActionQuickLog({ onLogAction, isLogging }: ActionQuickLogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<typeof quickActions[0] | null>(null);
  const [description, setDescription] = useState('');
  const [component, setComponent] = useState('');
  const [customRisk, setCustomRisk] = useState<RiskLevel | ''>('');
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setSelectedAction(action);
    setCustomRisk(action.risk);
    setRequiresApproval(action.risk === 'high' || action.risk === 'critical');
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedAction || !description.trim()) return;

    await onLogAction({
      actionType: selectedAction.type,
      description: description.trim(),
      componentAffected: component.trim() || undefined,
      riskLevel: customRisk || selectedAction.risk,
      requiresApproval,
    });

    setIsDialogOpen(false);
    setDescription('');
    setComponent('');
    setCustomRisk('');
    setRequiresApproval(false);
    setSelectedAction(null);
  };

  const handleCustomAction = () => {
    setSelectedAction({
      type: 'user_interaction',
      label: 'Acción Personalizada',
      icon: Plus,
      risk: 'low',
      color: 'text-gray-500'
    });
    setCustomRisk('low');
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Registro Rápido de Acciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.type}
                  variant="outline"
                  size="sm"
                  className="flex flex-col h-auto py-3 gap-1"
                  onClick={() => handleQuickAction(action)}
                  disabled={isLogging}
                >
                  <Icon className={`h-4 w-4 ${action.color}`} />
                  <span className="text-xs">{action.label}</span>
                </Button>
              );
            })}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full mt-2"
            onClick={handleCustomAction}
            disabled={isLogging}
          >
            <Plus className="h-3 w-3 mr-1" />
            Acción Personalizada
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAction && (
                <>
                  <selectedAction.icon className={`h-5 w-5 ${selectedAction.color}`} />
                  {selectedAction.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Describe la acción realizada para el registro de auditoría
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe qué acción se realizó..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="component">Componente Afectado</Label>
              <Input
                id="component"
                placeholder="Ej: Base de datos, Configuración, etc."
                value={component}
                onChange={(e) => setComponent(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel de Riesgo</Label>
                <Select 
                  value={customRisk} 
                  onValueChange={(v) => {
                    setCustomRisk(v as RiskLevel);
                    setRequiresApproval(v === 'high' || v === 'critical');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Bajo</SelectItem>
                    <SelectItem value="medium">Medio</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>¿Requiere Aprobación?</Label>
                <Select 
                  value={requiresApproval ? 'yes' : 'no'} 
                  onValueChange={(v) => setRequiresApproval(v === 'yes')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Sí</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!description.trim() || isLogging}
            >
              {isLogging ? 'Registrando...' : 'Registrar Acción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
