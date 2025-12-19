import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RuleTrigger } from '../types';
import { Zap, Clock, MousePointer, Webhook, FileText, Database } from 'lucide-react';

interface TriggerEditorProps {
  trigger: RuleTrigger;
  onChange: (trigger: RuleTrigger) => void;
}

const TRIGGER_TYPES = [
  { value: 'form_submitted', label: 'Formulario Enviado', icon: FileText, description: 'Cuando se envía un formulario' },
  { value: 'record_created', label: 'Registro Creado', icon: Database, description: 'Al crear un nuevo registro' },
  { value: 'record_updated', label: 'Registro Actualizado', icon: Database, description: 'Al actualizar un registro' },
  { value: 'record_deleted', label: 'Registro Eliminado', icon: Database, description: 'Al eliminar un registro' },
  { value: 'schedule', label: 'Programado', icon: Clock, description: 'Ejecutar según horario' },
  { value: 'manual', label: 'Manual', icon: MousePointer, description: 'Ejecutar manualmente' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Llamada externa' },
];

export const TriggerEditor: React.FC<TriggerEditorProps> = ({ trigger, onChange }) => {
  const selectedType = TRIGGER_TYPES.find(t => t.value === trigger.type);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Disparador (Trigger)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TRIGGER_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = trigger.type === type.value;
            return (
              <button
                key={type.value}
                onClick={() => onChange({ ...trigger, type: type.value as RuleTrigger['type'] })}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            );
          })}
        </div>

        {selectedType && (
          <p className="text-sm text-muted-foreground">{selectedType.description}</p>
        )}

        {/* Configuración específica según el tipo */}
        {trigger.type === 'form_submitted' && (
          <div className="space-y-3">
            <div>
              <Label>ID del Formulario</Label>
              <Input
                placeholder="form_id o form_key"
                value={trigger.config?.form_id || ''}
                onChange={(e) => onChange({
                  ...trigger,
                  config: { ...trigger.config, form_id: e.target.value }
                })}
              />
            </div>
          </div>
        )}

        {(trigger.type === 'record_created' || trigger.type === 'record_updated' || trigger.type === 'record_deleted') && (
          <div className="space-y-3">
            <div>
              <Label>Tabla</Label>
              <Select
                value={trigger.config?.table || ''}
                onValueChange={(value) => onChange({
                  ...trigger,
                  config: { ...trigger.config, table: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="companies">Empresas</SelectItem>
                  <SelectItem value="visits">Visitas</SelectItem>
                  <SelectItem value="visit_sheets">Fichas de Visita</SelectItem>
                  <SelectItem value="lowcode_form_submissions">Envíos de Formularios</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {trigger.type === 'schedule' && (
          <div className="space-y-3">
            <div>
              <Label>Expresión Cron</Label>
              <Input
                placeholder="0 9 * * 1-5 (Lunes a Viernes a las 9:00)"
                value={trigger.config?.cron || ''}
                onChange={(e) => onChange({
                  ...trigger,
                  config: { ...trigger.config, cron: e.target.value }
                })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: minuto hora día-mes mes día-semana
              </p>
            </div>
            <div>
              <Label>Zona Horaria</Label>
              <Select
                value={trigger.config?.timezone || 'Europe/Madrid'}
                onValueChange={(value) => onChange({
                  ...trigger,
                  config: { ...trigger.config, timezone: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Europe/Madrid">Europe/Madrid</SelectItem>
                  <SelectItem value="America/Mexico_City">America/Mexico_City</SelectItem>
                  <SelectItem value="America/Argentina/Buenos_Aires">America/Buenos_Aires</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {trigger.type === 'webhook' && (
          <div className="space-y-3">
            <div>
              <Label>Método HTTP</Label>
              <Select
                value={trigger.config?.method || 'POST'}
                onValueChange={(value) => onChange({
                  ...trigger,
                  config: { ...trigger.config, method: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Secret Key (opcional)</Label>
              <Input
                type="password"
                placeholder="Para validar requests"
                value={trigger.config?.secret || ''}
                onChange={(e) => onChange({
                  ...trigger,
                  config: { ...trigger.config, secret: e.target.value }
                })}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
