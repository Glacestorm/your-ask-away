import { CompanyWithDetails } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User, FileText, History, X, Camera, CreditCard, Landmark, Phone, Mail, Globe, MapPin, Users, TrendingUp, Scale, FileCheck, Briefcase, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactsManager } from './ContactsManager';
import { DocumentsManager } from './DocumentsManager';
import { VisitsPanel } from '../map/VisitsPanel';
import { Badge } from '@/components/ui/badge';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import { CompanyPhotosManager } from './CompanyPhotosManager';
import { BankAffiliationsManager } from './BankAffiliationsManager';
import { TPVTerminalsManager } from './TPVTerminalsManager';
import { VisitSheetsHistory } from './VisitSheetsHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CompanyDetailProps {
  company: CompanyWithDetails;
  onClose: () => void;
}

export const CompanyDetail = ({ company, onClose }: CompanyDetailProps) => {
  const { t } = useLanguage();
  
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Enhanced Header */}
      <div className="border-b bg-card/80 backdrop-blur-sm p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-2">
              <div className="p-2 rounded-lg bg-primary/10 mt-1">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold leading-tight mb-1">{company.name}</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {company.address}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
              {company.status && (
                <Badge
                  className="text-xs font-medium"
                  style={{
                    backgroundColor: company.status.color_hex + '20',
                    borderColor: company.status.color_hex,
                    color: company.status.color_hex,
                  }}
                >
                  {company.status.status_name}
                </Badge>
              )}
              {company.parroquia && (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {company.parroquia}
                </Badge>
              )}
              {company.sector && (
                <Badge variant="outline" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {company.sector}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0 hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-3 pb-2 bg-card/50 border-b">
          <TabsList className="grid grid-cols-4 h-auto p-1 gap-1 bg-muted/50">
            <TabsTrigger value="info" className="flex flex-col items-center py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-medium">Info</span>
            </TabsTrigger>
            <TabsTrigger value="relations" className="flex flex-col items-center py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Landmark className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-medium">Relaciones</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="flex flex-col items-center py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Camera className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-medium">Multimedia</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex flex-col items-center py-2 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-4 w-4 mb-1" />
              <span className="text-[10px] font-medium">Actividad</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Info Tab - Redesigned with Cards */}
          <TabsContent value="info" className="p-3 space-y-3 mt-0">
            {/* Quick Actions */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-3 flex flex-wrap gap-2">
                {company.phone && (
                  <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" asChild>
                    <a href={`tel:${company.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Llamar
                    </a>
                  </Button>
                )}
                {company.email && (
                  <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" asChild>
                    <a href={`mailto:${company.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                )}
                {company.website && (
                  <Button size="sm" variant="outline" className="flex-1 min-w-[100px]" asChild>
                    <a href={company.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-3 w-3 mr-1" />
                      Web
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* General Info Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                {company.cnae && (
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <FileCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">CNAE</p>
                      <p className="text-sm break-words">{formatCnaeWithDescription(company.cnae)}</p>
                    </div>
                  </div>
                )}
                {company.sector && (
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Sector</p>
                      <p className="text-sm">{company.sector}</p>
                    </div>
                  </div>
                )}
                {company.oficina && (
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Oficina</p>
                      <p className="text-sm">{company.oficina}</p>
                    </div>
                  </div>
                )}
                {company.gestor && (
                  <div className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                    <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">Gestor</p>
                      <p className="text-sm">{company.gestor.full_name || company.gestor.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Economic Data Card */}
            {(company.employees !== null || company.turnover !== null) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Datos Económicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    {company.employees !== null && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4 text-blue-600" />
                          <p className="text-xs font-medium text-muted-foreground">Empleados</p>
                        </div>
                        <p className="text-lg font-bold">{company.employees}</p>
                      </div>
                    )}
                    {company.turnover !== null && (
                      <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <p className="text-xs font-medium text-muted-foreground">Facturación</p>
                        </div>
                        <p className="text-sm font-bold">
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                            notation: 'compact',
                            maximumFractionDigits: 1,
                          }).format(Number(company.turnover))}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legal Data Card */}
            {(company.tax_id || company.registration_number || company.legal_form) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" />
                    Datos Legales
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4">
                  {company.tax_id && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">NIF</span>
                      <span className="text-sm font-mono">{company.tax_id}</span>
                    </div>
                  )}
                  {company.registration_number && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">Nº Registro</span>
                      <span className="text-sm font-mono">{company.registration_number}</span>
                    </div>
                  )}
                  {company.legal_form && (
                    <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">Forma Legal</span>
                      <span className="text-sm">{company.legal_form}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Products Card */}
            {company.products && company.products.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Productos Contratados
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex flex-wrap gap-2">
                    {company.products.map((product) => (
                      <Badge key={product.id} variant="secondary" className="text-xs">
                        {product.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observations Card */}
            {company.observaciones && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {company.observaciones}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Last Visit Card */}
            {company.fecha_ultima_visita && (
              <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Última Visita</p>
                    <p className="text-sm font-semibold">
                      {new Date(company.fecha_ultima_visita).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coordinates */}
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                📍 {company.latitude.toFixed(6)}, {company.longitude.toFixed(6)}
              </p>
            </div>
          </TabsContent>

          {/* Relations Tab - Banking, TPV, Contacts */}
          <TabsContent value="relations" className="p-3 space-y-3 mt-0">
            <BankAffiliationsManager companyId={company.id} />

            <TPVTerminalsManager companyId={company.id} />

            <ContactsManager companyId={company.id} />
          </TabsContent>

          {/* Media Tab - Photos and Documents */}
          <TabsContent value="media" className="p-3 space-y-3 mt-0">
            <CompanyPhotosManager companyId={company.id} companyName={company.name} />

            <DocumentsManager companyId={company.id} companyName={company.name} />
          </TabsContent>

          {/* Activity Tab - Visits */}
          <TabsContent value="activity" className="p-3 space-y-3 mt-0">
            <VisitSheetsHistory companyId={company.id} />

            <VisitsPanel company={company} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
