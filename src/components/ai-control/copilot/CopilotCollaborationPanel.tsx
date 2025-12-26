/**
 * CopilotCollaborationPanel - Panel de Colaboración del Copiloto 2026
 * Sugerencias de colaboración, trabajo en equipo y networking interno
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Users, 
  MessageSquare, 
  UserPlus, 
  Handshake,
  Lightbulb,
  Share2,
  Calendar,
  ArrowRight,
  Star,
  Sparkles,
  Building2
} from 'lucide-react';
import { CopilotSuggestion2026 } from '@/hooks/useRoleCopilot2026';
import { cn } from '@/lib/utils';

interface CopilotCollaborationPanelProps {
  suggestions: CopilotSuggestion2026[];
  onExecuteAction: (suggestion: CopilotSuggestion2026, actionId: string) => void;
  className?: string;
}

// Mock data para colaboraciones sugeridas
const mockCollaborations = [
  {
    id: '1',
    type: 'joint_opportunity',
    title: 'Oportunidad Conjunta: Grupo Financiero ABC',
    description: 'María García tiene contactos clave. Colaboración recomendada.',
    colleague: {
      name: 'María García',
      role: 'Gestor Senior',
      avatar: null,
      office: 'Madrid Centro',
    },
    matchScore: 92,
    potentialValue: 45000,
    reason: 'Complementariedad de productos y contactos',
  },
  {
    id: '2',
    type: 'knowledge_share',
    title: 'Compartir: Estrategia Cross-Selling Seguros',
    description: 'Tu técnica de cross-sell podría ayudar al equipo de Barcelona.',
    colleague: {
      name: 'Carlos Ruiz',
      role: 'Director Oficina',
      avatar: null,
      office: 'Barcelona Diagonal',
    },
    matchScore: 85,
    reason: 'Alta tasa de éxito en cross-selling',
  },
  {
    id: '3',
    type: 'mentoring',
    title: 'Mentoría: Nuevo Gestor en tu Oficina',
    description: 'Ana López podría beneficiarse de tu experiencia en retail.',
    colleague: {
      name: 'Ana López',
      role: 'Gestor Junior',
      avatar: null,
      office: 'Madrid Centro',
    },
    matchScore: 78,
    reason: 'Perfil complementario para mentoría',
  },
];

const mockTeamActivity = [
  {
    id: '1',
    user: { name: 'Pedro Sánchez', avatar: null },
    action: 'cerró una oportunidad de €32,000',
    time: 'Hace 2h',
    type: 'success',
  },
  {
    id: '2',
    user: { name: 'Laura Martín', avatar: null },
    action: 'compartió una nueva técnica de cierre',
    time: 'Hace 4h',
    type: 'share',
  },
  {
    id: '3',
    user: { name: 'David Torres', avatar: null },
    action: 'alcanzó el 100% de su objetivo mensual',
    time: 'Hace 6h',
    type: 'achievement',
  },
];

export function CopilotCollaborationPanel({ 
  suggestions, 
  onExecuteAction,
  className 
}: CopilotCollaborationPanelProps) {
  const [selectedCollab, setSelectedCollab] = useState<string | null>(null);

  const getCollabIcon = (type: string) => {
    switch (type) {
      case 'joint_opportunity': return <Handshake className="h-4 w-4" />;
      case 'knowledge_share': return <Share2 className="h-4 w-4" />;
      case 'mentoring': return <Users className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getCollabColor = (type: string) => {
    switch (type) {
      case 'joint_opportunity': return 'from-green-500/20 to-green-600/10 text-green-600';
      case 'knowledge_share': return 'from-blue-500/20 to-blue-600/10 text-blue-600';
      case 'mentoring': return 'from-purple-500/20 to-purple-600/10 text-purple-600';
      default: return 'from-primary/20 to-primary/10 text-primary';
    }
  };

  return (
    <ScrollArea className={cn("h-[400px]", className)}>
      <div className="space-y-4 pr-4">
        {/* Sugerencias de Colaboración IA */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Colaboraciones Sugeridas por IA
          </h3>
          <div className="space-y-3">
            {mockCollaborations.map((collab) => (
              <Card 
                key={collab.id} 
                className={cn(
                  "overflow-hidden cursor-pointer transition-all hover:shadow-md",
                  selectedCollab === collab.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedCollab(collab.id === selectedCollab ? null : collab.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-gradient-to-br",
                      getCollabColor(collab.type)
                    )}>
                      {getCollabIcon(collab.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{collab.title}</h4>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary shrink-0">
                          {collab.matchScore}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{collab.description}</p>
                      
                      {/* Colleague info */}
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={collab.colleague.avatar || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {collab.colleague.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs">
                          <span className="font-medium">{collab.colleague.name}</span>
                          <span className="text-muted-foreground"> · {collab.colleague.role}</span>
                        </div>
                      </div>

                      {collab.potentialValue && (
                        <div className="mt-2 text-xs">
                          <span className="text-muted-foreground">Valor potencial: </span>
                          <span className="font-medium text-green-600">
                            €{collab.potentialValue.toLocaleString()}
                          </span>
                        </div>
                      )}

                      {selectedCollab === collab.id && (
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <Button size="sm" className="h-7 text-xs flex-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contactar
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            Agendar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Actividad del Equipo */}
        <div>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Actividad del Equipo
          </h3>
          <Card>
            <CardContent className="p-3 space-y-3">
              {mockTeamActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {activity.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user.name}</span>
                      <span className="text-muted-foreground"> {activity.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {activity.type === 'success' && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">
                      <Star className="h-3 w-3 mr-1" />
                      Éxito
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Networking Interno */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Red de Expertos</h4>
                <p className="text-xs text-muted-foreground">
                  Conecta con 147 colegas especializados en tu sector
                </p>
              </div>
              <Button size="sm" variant="outline" className="shrink-0">
                Explorar
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

export default CopilotCollaborationPanel;
