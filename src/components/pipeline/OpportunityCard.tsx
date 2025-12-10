import { Opportunity, OpportunityStage } from '@/hooks/useOpportunities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building2, Calendar, DollarSign, MoreVertical, User, Star, ArrowRight, Trash2, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (id: string) => void;
  onView: (opportunity: Opportunity) => void;
  onMoveStage: (id: string, stage: OpportunityStage) => void;
  isDragging?: boolean;
}

const stageConfig: Record<OpportunityStage, { label: string; color: string; nextStage?: OpportunityStage }> = {
  discovery: { label: 'Descubrimiento', color: 'bg-blue-500', nextStage: 'proposal' },
  proposal: { label: 'Propuesta', color: 'bg-amber-500', nextStage: 'negotiation' },
  negotiation: { label: 'Negociación', color: 'bg-purple-500', nextStage: 'won' },
  won: { label: 'Ganada', color: 'bg-green-500' },
  lost: { label: 'Perdida', color: 'bg-red-500' },
};

export function OpportunityCard({ 
  opportunity, 
  onEdit, 
  onDelete, 
  onView,
  onMoveStage,
  isDragging 
}: OpportunityCardProps) {
  const config = stageConfig[opportunity.stage];
  const nextStage = config.nextStage;

  return (
    <Card 
      className={cn(
        "cursor-pointer hover:shadow-md transition-all duration-200 group",
        isDragging && "opacity-50 rotate-2 scale-105",
        opportunity.company?.is_vip && "ring-2 ring-amber-400/50"
      )}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {opportunity.company?.is_vip && (
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
              )}
              <h4 className="font-semibold text-sm truncate">{opportunity.title}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{opportunity.company?.name || 'Sin empresa'}</span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(opportunity)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(opportunity)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {nextStage && (
                <DropdownMenuItem onClick={() => onMoveStage(opportunity.id, nextStage)}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Mover a {stageConfig[nextStage].label}
                </DropdownMenuItem>
              )}
              {opportunity.stage !== 'won' && opportunity.stage !== 'lost' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onMoveStage(opportunity.id, 'won')}
                    className="text-green-600"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Marcar como Ganada
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onMoveStage(opportunity.id, 'lost')}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Marcar como Perdida
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(opportunity.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Value & Probability */}
        <div className="flex items-center justify-between">
          {opportunity.estimated_value ? (
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <DollarSign className="h-3.5 w-3.5" />
              {new Intl.NumberFormat('es-ES', { 
                style: 'currency', 
                currency: 'EUR',
                notation: 'compact',
                maximumFractionDigits: 1 
              }).format(opportunity.estimated_value)}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sin valor</span>
          )}
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs font-medium",
              opportunity.probability >= 75 && "border-green-500 text-green-600",
              opportunity.probability >= 50 && opportunity.probability < 75 && "border-amber-500 text-amber-600",
              opportunity.probability < 50 && "border-muted-foreground"
            )}
          >
            {opportunity.probability}%
          </Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          {opportunity.owner && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{opportunity.owner.full_name?.split(' ')[0] || 'Sin asignar'}</span>
            </div>
          )}
          
          {opportunity.estimated_close_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(opportunity.estimated_close_date), 'dd MMM', { locale: es })}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
