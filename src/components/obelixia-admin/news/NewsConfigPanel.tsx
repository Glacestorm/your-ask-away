import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Clock, Database, Tag, Bell, Archive } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConfigSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, any>;
  description: string;
}

export const NewsConfigPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [newKeyword, setNewKeyword] = useState('');
  const [newExcluded, setNewExcluded] = useState('');

  const { data: configs, isLoading } = useQuery({
    queryKey: ['news-admin-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_admin_config')
        .select('*')
        .order('setting_key');
      if (error) throw error;
      return data as ConfigSetting[];
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, any> }) => {
      const { error } = await supabase
        .from('news_admin_config')
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq('setting_key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración actualizada');
      queryClient.invalidateQueries({ queryKey: ['news-admin-config'] });
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const getConfig = (key: string) => configs?.find(c => c.setting_key === key);

  const periodicity = getConfig('fetch_periodicity')?.setting_value?.hours || 4;
  const retentionDays = getConfig('retention_days')?.setting_value?.days || 90;
  const minScore = getConfig('min_relevance_score')?.setting_value?.score || 50;
  const autoArchive = getConfig('auto_archive_important')?.setting_value?.enabled !== false;
  const keywords = getConfig('keywords')?.setting_value || { included: [], excluded: [] };
  const notifications = getConfig('notification_email')?.setting_value || { emails: [], enabled: false };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const updated = { ...keywords, included: [...(keywords.included || []), newKeyword.trim()] };
    updateConfigMutation.mutate({ key: 'keywords', value: updated });
    setNewKeyword('');
  };

  const handleRemoveKeyword = (keyword: string) => {
    const updated = { ...keywords, included: (keywords.included || []).filter((k: string) => k !== keyword) };
    updateConfigMutation.mutate({ key: 'keywords', value: updated });
  };

  const handleAddExcluded = () => {
    if (!newExcluded.trim()) return;
    const updated = { ...keywords, excluded: [...(keywords.excluded || []), newExcluded.trim()] };
    updateConfigMutation.mutate({ key: 'keywords', value: updated });
    setNewExcluded('');
  };

  const handleRemoveExcluded = (keyword: string) => {
    const updated = { ...keywords, excluded: (keywords.excluded || []).filter((k: string) => k !== keyword) };
    updateConfigMutation.mutate({ key: 'keywords', value: updated });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Cargando configuración...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Periodicidad y Retención */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-blue-400" />
            Periodicidad y Retención
          </CardTitle>
          <CardDescription>Configura cuándo y cuánto tiempo se guardan las noticias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-slate-300">Actualizar cada</Label>
            <Select
              value={String(periodicity)}
              onValueChange={(v) => updateConfigMutation.mutate({ key: 'fetch_periodicity', value: { hours: parseInt(v) } })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora</SelectItem>
                <SelectItem value="2">2 horas</SelectItem>
                <SelectItem value="4">4 horas</SelectItem>
                <SelectItem value="6">6 horas</SelectItem>
                <SelectItem value="12">12 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Retención del histórico</Label>
            <Select
              value={String(retentionDays)}
              onValueChange={(v) => updateConfigMutation.mutate({ key: 'retention_days', value: { days: parseInt(v) } })}
            >
              <SelectTrigger className="bg-slate-900 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 días</SelectItem>
                <SelectItem value="60">60 días</SelectItem>
                <SelectItem value="90">90 días</SelectItem>
                <SelectItem value="180">180 días</SelectItem>
                <SelectItem value="365">1 año</SelectItem>
                <SelectItem value="0">Ilimitado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-slate-300">Puntuación mínima de relevancia</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={100}
                value={minScore}
                onChange={(e) => updateConfigMutation.mutate({ key: 'min_relevance_score', value: { score: parseInt(e.target.value) } })}
                className="bg-slate-900 border-slate-600 w-24"
              />
              <span className="text-slate-400 text-sm">/ 100</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">Auto-archivar noticias críticas</Label>
              <p className="text-xs text-slate-500">Las noticias marcadas como críticas se guardarán automáticamente</p>
            </div>
            <Switch
              checked={autoArchive}
              onCheckedChange={(checked) => updateConfigMutation.mutate({ key: 'auto_archive_important', value: { enabled: checked } })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Keywords de inclusión */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Tag className="w-5 h-5 text-emerald-400" />
            Keywords de Inclusión
          </CardTitle>
          <CardDescription>Palabras clave para filtrar noticias relevantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Nueva keyword..."
              className="bg-slate-900 border-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <Button size="sm" onClick={handleAddKeyword} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {(keywords.included || []).map((kw: string) => (
              <Badge key={kw} variant="secondary" className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30">
                {kw}
                <button onClick={() => handleRemoveKeyword(kw)} className="ml-1 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Keywords de exclusión */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Tag className="w-5 h-5 text-red-400" />
            Keywords de Exclusión
          </CardTitle>
          <CardDescription>Palabras clave para excluir noticias no deseadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newExcluded}
              onChange={(e) => setNewExcluded(e.target.value)}
              placeholder="Excluir keyword..."
              className="bg-slate-900 border-slate-600"
              onKeyDown={(e) => e.key === 'Enter' && handleAddExcluded()}
            />
            <Button size="sm" onClick={handleAddExcluded} variant="destructive">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {(keywords.excluded || []).map((kw: string) => (
              <Badge key={kw} variant="secondary" className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
                {kw}
                <button onClick={() => handleRemoveExcluded(kw)} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {(keywords.excluded || []).length === 0 && (
            <p className="text-sm text-slate-500 italic">No hay keywords de exclusión configuradas</p>
          )}
        </CardContent>
      </Card>

      {/* Notificaciones */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5 text-amber-400" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura las alertas por email para noticias importantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-slate-300">Activar notificaciones</Label>
              <p className="text-xs text-slate-500">Recibe alertas de noticias críticas por email</p>
            </div>
            <Switch
              checked={notifications.enabled}
              onCheckedChange={(checked) => 
                updateConfigMutation.mutate({ 
                  key: 'notification_email', 
                  value: { ...notifications, enabled: checked } 
                })
              }
            />
          </div>
          
          <div>
            <Label className="text-slate-300">Emails de notificación</Label>
            <p className="text-xs text-slate-500 mb-2">Separa múltiples emails con comas</p>
            <Input
              value={(notifications.emails || []).join(', ')}
              onChange={(e) => 
                updateConfigMutation.mutate({ 
                  key: 'notification_email', 
                  value: { 
                    ...notifications, 
                    emails: e.target.value.split(',').map((email: string) => email.trim()).filter(Boolean) 
                  } 
                })
              }
              placeholder="email@ejemplo.com, otro@ejemplo.com"
              className="bg-slate-900 border-slate-600"
              disabled={!notifications.enabled}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
