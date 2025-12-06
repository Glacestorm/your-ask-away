import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Eye, Edit, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface CompaniesDashboardCardProps {
  onNavigate?: (section: string) => void;
}

export function CompaniesDashboardCard({ onNavigate }: CompaniesDashboardCardProps) {
  const navigate = useNavigate();
  const { isAuditor, isCommercialDirector, isSuperAdmin, isCommercialManager, isOfficeDirector } = useAuth();
  
  // Auditors cannot see companies at all
  if (isAuditor) {
    return null;
  }

  const handleClick = () => {
    if (onNavigate) {
      onNavigate('companies');
    } else {
      navigate('/admin?section=companies');
    }
  };

  // Determine access level for display
  const getAccessBadge = () => {
    if (isSuperAdmin || isCommercialDirector || isCommercialManager) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Users className="h-3 w-3 mr-1" />
          Accés complet
        </Badge>
      );
    }
    if (isOfficeDirector) {
      return (
        <Badge variant="outline" className="text-xs">
          <Edit className="h-3 w-3 mr-1" />
          La meva oficina
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        <Eye className="h-3 w-3 mr-1" />
          Les meves empreses
      </Badge>
    );
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20 group"
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-teal-500/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          {getAccessBadge()}
        </div>
        <CardTitle className="text-lg mt-3 group-hover:text-teal-600 transition-colors">
          Gestió Empreses
        </CardTitle>
        <CardDescription className="text-sm">
          Administra i edita les dades de les empreses assignades
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <Edit className="h-3 w-3 mr-1" />
          Editar, veure i gestionar empreses
        </div>
      </CardContent>
    </Card>
  );
}
