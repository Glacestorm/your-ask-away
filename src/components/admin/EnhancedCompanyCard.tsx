import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, Phone, Mail, Users, TrendingUp, Eye, Trash2, Pencil, 
  Calendar, Building2, Euro, Briefcase, Globe, FileText, Clock,
  CheckCircle2, AlertCircle, Package, Star
} from 'lucide-react';
import { CompanyWithDetails } from '@/types/database';
import { CompanyDataCompleteness } from './CompanyDataCompleteness';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, formatDistanceToNow } from 'date-fns';
import { es, ca } from 'date-fns/locale';

interface EnhancedCompanyCardProps {
  company: CompanyWithDetails;
  photoUrl: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onPhotoClick: (url: string) => void;
}

export function EnhancedCompanyCard({
  company,
  photoUrl,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onPhotoClick,
}: EnhancedCompanyCardProps) {
  const { t, language } = useLanguage();
  const dateLocale = language === 'ca' ? ca : es;

  const isGeolocated = company.latitude !== 0 && company.longitude !== 0 && 
    company.latitude !== 42.5063 && company.longitude !== 1.5218;

  const avgLinkage = Math.round(
    (((company as any).vinculacion_entidad_1 || 0) +
    ((company as any).vinculacion_entidad_2 || 0) +
    ((company as any).vinculacion_entidad_3 || 0)) / 3
  );

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return null;
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const getLastVisitInfo = () => {
    if (!company.fecha_ultima_visita) return null;
    const date = new Date(company.fecha_ultima_visita);
    return {
      formatted: format(date, 'dd MMM yyyy', { locale: dateLocale }),
      relative: formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
    };
  };

  const lastVisit = getLastVisitInfo();

  return (
    <Card className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/50 hover:border-primary/30">
      {/* Background Photo with Blur */}
      {photoUrl && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105 cursor-pointer"
          style={{
            backgroundImage: `url(${photoUrl})`,
            filter: 'blur(20px) brightness(0.3)',
          }}
          onClick={() => onPhotoClick(photoUrl)}
        />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/98 via-background/90 to-background/80" />
      
      <CardContent className="relative p-5 space-y-4 z-10">
        {/* Header with Name and Badges */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg leading-tight text-foreground drop-shadow-md line-clamp-2">
              {company.name}
            </h3>
            <div className="flex gap-1.5 flex-shrink-0">
              {/* Geolocation */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isGeolocated 
                        ? 'bg-emerald-500/90 border-emerald-400' 
                        : 'bg-destructive/90 border-destructive'
                    }`}>
                      <MapPin className="h-3 w-3 text-white" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isGeolocated ? t('companyForm.geolocated') : t('companyForm.notGeolocated')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Data Completeness */}
              <CompanyDataCompleteness company={company} />
            </div>
          </div>

          {/* Status, VIP and Client Type Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* VIP Badge */}
            {(company as any).is_vip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge className="text-xs font-semibold shadow-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      VIP
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {(company as any).vip_notes || 'Client VIP'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <Badge 
              className="text-xs font-semibold shadow-sm"
              style={{ 
                backgroundColor: `${company.status?.color_hex || '#6b7280'}`,
                color: '#ffffff',
              }}
            >
              {company.status?.status_name || 'N/A'}
            </Badge>
            
            {(company as any).client_type && (
              <Badge variant={(company as any).client_type === 'cliente' ? 'default' : 'secondary'} className="text-xs">
                {(company as any).client_type === 'cliente' ? 'Cliente' : 'Potencial'}
              </Badge>
            )}

            {(company as any).oficina && (
              <Badge variant="outline" className="text-xs gap-1">
                <Building2 className="h-3 w-3" />
                {(company as any).oficina}
              </Badge>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* Vinculación */}
          {avgLinkage > 0 && (
            <div className="bg-primary/10 rounded-lg p-2.5 border border-primary/20">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs text-muted-foreground">Vinculació</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">{avgLinkage}%</span>
                <Progress value={avgLinkage} className="h-1.5 flex-1" />
              </div>
            </div>
          )}

          {/* Facturación */}
          {(company as any).facturacion_anual && (
            <div className="bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Euro className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Facturació</span>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                {formatCurrency((company as any).facturacion_anual)}
              </span>
            </div>
          )}

          {/* Empleados */}
          {(company as any).employees && (
            <div className="bg-blue-500/10 rounded-lg p-2.5 border border-blue-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-xs text-muted-foreground">Empleats</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{(company as any).employees}</span>
            </div>
          )}

          {/* Última visita */}
          {lastVisit && (
            <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs text-muted-foreground">Última visita</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs font-semibold text-amber-700 cursor-help">
                      {lastVisit.relative}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{lastVisit.formatted}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Contact & Location Info */}
        <div className="space-y-2">
          {/* Address */}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-foreground truncate">{company.address}</p>
              <p className="text-xs text-muted-foreground">{company.parroquia}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            {(company as any).phone ? (
              <a 
                href={`tel:${(company as any).phone}`}
                className="text-foreground hover:text-primary transition-colors truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {(company as any).phone}
              </a>
            ) : (
              <span className="text-muted-foreground text-xs italic">Sense telèfon</span>
            )}
          </div>

          {/* Email */}
          {(company as any).email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a 
                href={`mailto:${(company as any).email}`}
                className="text-foreground hover:text-primary transition-colors truncate text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {(company as any).email}
              </a>
            </div>
          )}

          {/* Website */}
          {(company as any).website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <a 
                href={(company as any).website.startsWith('http') ? (company as any).website : `https://${(company as any).website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors truncate text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {(company as any).website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Sector & Manager */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
          {/* Sector/CNAE */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {(company as any).sector || company.cnae || 'Sense sector'}
            </span>
          </div>

          {/* Manager */}
          {company.gestor && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                {company.gestor.full_name || company.gestor.email?.split('@')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {(company as any).tags && (company as any).tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(company as any).tags.slice(0, 4).map((tag: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs py-0 px-1.5">
                {tag}
              </Badge>
            ))}
            {(company as any).tags.length > 4 && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5">
                +{(company as any).tags.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* BP & NRT */}
        {((company as any).bp || (company as any).tax_id) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
            {(company as any).bp && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>BP: {(company as any).bp}</span>
              </div>
            )}
            {(company as any).tax_id && (
              <div className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span>NRT: {(company as any).tax_id}</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            {canEdit ? (
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Eye className="h-3.5 w-3.5 mr-1.5" />
            )}
            {canEdit ? 'Editar' : 'Veure'}
          </Button>
          {canDelete && (
            <Button 
              variant="outline" 
              size="sm"
              className="shadow-md bg-background/80 hover:bg-destructive/20 text-destructive hover:text-destructive border-destructive/30"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
