import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Phone, 
  Mail, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Zap,
  Heart,
  Star,
  Clock,
  Filter
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface JourneyEvent {
  id: string;
  type: 'interaction' | 'milestone' | 'health_change' | 'support' | 'renewal' | 'expansion' | 'risk' | 'nps';
  title: string;
  description: string;
  timestamp: string;
  impact?: 'positive' | 'negative' | 'neutral';
  metadata?: Record<string, unknown>;
}

interface CustomerJourneyTimelineProps {
  companyId: string;
  companyName: string;
  events?: JourneyEvent[];
}

const eventIcons: Record<string, React.ReactNode> = {
  interaction: <MessageSquare className="h-4 w-4" />,
  milestone: <Star className="h-4 w-4" />,
  health_change: <Heart className="h-4 w-4" />,
  support: <Phone className="h-4 w-4" />,
  renewal: <Calendar className="h-4 w-4" />,
  expansion: <TrendingUp className="h-4 w-4" />,
  risk: <AlertTriangle className="h-4 w-4" />,
  nps: <Users className="h-4 w-4" />
};

const eventColors: Record<string, string> = {
  interaction: 'bg-blue-500',
  milestone: 'bg-yellow-500',
  health_change: 'bg-purple-500',
  support: 'bg-green-500',
  renewal: 'bg-indigo-500',
  expansion: 'bg-emerald-500',
  risk: 'bg-red-500',
  nps: 'bg-pink-500'
};

// Mock data for demonstration
const mockEvents: JourneyEvent[] = [
  {
    id: '1',
    type: 'milestone',
    title: 'Onboarding completado',
    description: 'El cliente completó todos los pasos de onboarding',
    timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'positive'
  },
  {
    id: '2',
    type: 'interaction',
    title: 'QBR trimestral',
    description: 'Revisión de negocio con el cliente. Satisfacción alta.',
    timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'positive'
  },
  {
    id: '3',
    type: 'support',
    title: 'Ticket de soporte resuelto',
    description: 'Problema de integración API resuelto en 2 horas',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'positive'
  },
  {
    id: '4',
    type: 'health_change',
    title: 'Health Score bajó',
    description: 'Disminución del 15% en uso de funciones clave',
    timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'negative'
  },
  {
    id: '5',
    type: 'risk',
    title: 'Señal de riesgo detectada',
    description: 'Usuario principal no ha iniciado sesión en 14 días',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'negative'
  },
  {
    id: '6',
    type: 'interaction',
    title: 'Llamada de seguimiento',
    description: 'CSM contactó al cliente para entender baja actividad',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'neutral'
  },
  {
    id: '7',
    type: 'nps',
    title: 'Encuesta NPS respondida',
    description: 'Puntuación: 8 (Pasivo). Comentario sobre necesidad de nuevas funciones.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'neutral'
  },
  {
    id: '8',
    type: 'expansion',
    title: 'Oportunidad de upsell identificada',
    description: 'Cliente interesado en módulo de analytics avanzado',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    impact: 'positive'
  }
];

export const CustomerJourneyTimeline: React.FC<CustomerJourneyTimelineProps> = ({
  companyId,
  companyName,
  events = mockEvents
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30d');

  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'positive') return event.impact === 'positive';
    if (selectedFilter === 'negative') return event.impact === 'negative';
    return event.type === selectedFilter;
  });

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactIcon = (impact?: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <TrendingDown className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  // Calculate journey health metrics
  const positiveEvents = events.filter(e => e.impact === 'positive').length;
  const negativeEvents = events.filter(e => e.impact === 'negative').length;
  const journeyScore = Math.round((positiveEvents / (positiveEvents + negativeEvents || 1)) * 100);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Customer Journey: {companyName}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Timeline completo de interacciones y eventos del cliente
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Journey Score</p>
              <p className={`text-2xl font-bold ${journeyScore >= 70 ? 'text-green-500' : journeyScore >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                {journeyScore}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total Eventos</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Button
            variant={selectedFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('all')}
          >
            Todos
          </Button>
          <Button
            variant={selectedFilter === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('positive')}
            className="text-green-600"
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Positivos
          </Button>
          <Button
            variant={selectedFilter === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('negative')}
            className="text-red-600"
          >
            <TrendingDown className="h-3 w-3 mr-1" />
            Negativos
          </Button>
          <Button
            variant={selectedFilter === 'interaction' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('interaction')}
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Interacciones
          </Button>
          <Button
            variant={selectedFilter === 'support' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('support')}
          >
            <Phone className="h-3 w-3 mr-1" />
            Soporte
          </Button>
          <Button
            variant={selectedFilter === 'risk' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter('risk')}
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            Riesgos
          </Button>
        </div>

        {/* Timeline */}
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Events */}
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${eventColors[event.type]} text-white shadow-lg`}>
                    {eventIcons[event.type]}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.impact && (
                            <span className={`flex items-center gap-1 text-xs ${getImpactColor(event.impact)}`}>
                              {getImpactIcon(event.impact)}
                              {event.impact === 'positive' ? 'Positivo' : event.impact === 'negative' ? 'Negativo' : 'Neutral'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.timestamp), 'dd MMM yyyy', { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Event type badge */}
                    <Badge variant="outline" className="mt-2 text-xs">
                      {event.type === 'interaction' && 'Interacción'}
                      {event.type === 'milestone' && 'Hito'}
                      {event.type === 'health_change' && 'Cambio de Salud'}
                      {event.type === 'support' && 'Soporte'}
                      {event.type === 'renewal' && 'Renovación'}
                      {event.type === 'expansion' && 'Expansión'}
                      {event.type === 'risk' && 'Riesgo'}
                      {event.type === 'nps' && 'NPS'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>

        {/* Journey Summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xl font-bold">{positiveEvents}</span>
            </div>
            <p className="text-xs text-muted-foreground">Eventos Positivos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-red-500">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xl font-bold">{negativeEvents}</span>
            </div>
            <p className="text-xs text-muted-foreground">Eventos Negativos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xl font-bold">{events.filter(e => e.type === 'interaction').length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Interacciones</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-purple-500">
              <Star className="h-4 w-4" />
              <span className="text-xl font-bold">{events.filter(e => e.type === 'milestone').length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Hitos</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerJourneyTimeline;
