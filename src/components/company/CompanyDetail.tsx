import { CompanyWithDetails } from '@/types/database';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, User, FileText, History, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactsManager } from './ContactsManager';
import { DocumentsManager } from './DocumentsManager';
import { VisitsPanel } from '../map/VisitsPanel';
import { Badge } from '@/components/ui/badge';
import { formatCnaeWithDescription } from '@/lib/cnaeDescriptions';
import { CompanyPhotosManager } from './CompanyPhotosManager';

interface CompanyDetailProps {
  company: CompanyWithDetails;
  onClose: () => void;
}

export const CompanyDetail = ({ company, onClose }: CompanyDetailProps) => {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{company.name}</h2>
            <p className="text-sm text-muted-foreground">{company.address}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {company.status && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: company.status.color_hex + '20',
                    borderColor: company.status.color_hex,
                  }}
                >
                  {company.status.status_name}
                </Badge>
              )}
              {company.parroquia && (
                <Badge variant="outline">{company.parroquia}</Badge>
              )}
              {company.sector && (
                <Badge variant="outline">{company.sector}</Badge>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-5">
          <TabsTrigger value="info" className="text-xs">
            <Building2 className="h-4 w-4 mr-1" />
            Info
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs">
            <User className="h-4 w-4 mr-1" />
            Contactos
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-xs">
            <Camera className="h-4 w-4 mr-1" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="documents" className="text-xs">
            <FileText className="h-4 w-4 mr-1" />
            Docs
          </TabsTrigger>
          <TabsTrigger value="visits" className="text-xs">
            <History className="h-4 w-4 mr-1" />
            Visitas
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="info" className="p-4 space-y-4 mt-0">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                Información General
              </h3>
              <div className="space-y-2 text-sm">
                {company.cnae && (
                  <div>
                    <span className="font-medium">CNAE:</span>{' '}
                    <span className="text-muted-foreground">
                      {formatCnaeWithDescription(company.cnae)}
                    </span>
                  </div>
                )}
                {company.sector && (
                  <div>
                    <span className="font-medium">Sector:</span>{' '}
                    <span className="text-muted-foreground">{company.sector}</span>
                  </div>
                )}
                {company.oficina && (
                  <div>
                    <span className="font-medium">Oficina:</span>{' '}
                    <span className="text-muted-foreground">{company.oficina}</span>
                  </div>
                )}
                {company.gestor && (
                  <div>
                    <span className="font-medium">Gestor:</span>{' '}
                    <span className="text-muted-foreground">
                      {company.gestor.full_name || company.gestor.email}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {(company.phone || company.email || company.website) && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Datos de Contacto
                </h3>
                <div className="space-y-2 text-sm">
                  {company.phone && (
                    <div>
                      <span className="font-medium">Teléfono:</span>{' '}
                      <a href={`tel:${company.phone}`} className="text-primary hover:underline">
                        {company.phone}
                      </a>
                    </div>
                  )}
                  {company.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                        {company.email}
                      </a>
                    </div>
                  )}
                  {company.website && (
                    <div>
                      <span className="font-medium">Web:</span>{' '}
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(company.employees !== null || company.turnover !== null) && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Datos Económicos
                </h3>
                <div className="space-y-2 text-sm">
                  {company.employees !== null && (
                    <div>
                      <span className="font-medium">Empleados:</span>{' '}
                      <span className="text-muted-foreground">{company.employees}</span>
                    </div>
                  )}
                  {company.turnover !== null && (
                    <div>
                      <span className="font-medium">Facturación:</span>{' '}
                      <span className="text-muted-foreground">
                        {new Intl.NumberFormat('es-ES', {
                          style: 'currency',
                          currency: 'EUR',
                        }).format(Number(company.turnover))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(company.tax_id || company.registration_number || company.legal_form) && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Datos Legales
                </h3>
                <div className="space-y-2 text-sm">
                  {company.tax_id && (
                    <div>
                      <span className="font-medium">NIF:</span>{' '}
                      <span className="text-muted-foreground">{company.tax_id}</span>
                    </div>
                  )}
                  {company.registration_number && (
                    <div>
                      <span className="font-medium">Nº Registro:</span>{' '}
                      <span className="text-muted-foreground">{company.registration_number}</span>
                    </div>
                  )}
                  {company.legal_form && (
                    <div>
                      <span className="font-medium">Forma Legal:</span>{' '}
                      <span className="text-muted-foreground">{company.legal_form}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {company.products && company.products.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Productos Contratados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {company.products.map((product) => (
                    <Badge key={product.id} variant="secondary">
                      {product.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {company.observaciones && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Observaciones
                </h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {company.observaciones}
                </p>
              </div>
            )}

            {company.fecha_ultima_visita && (
              <div>
                <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                  Última Visita
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(company.fecha_ultima_visita).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Coordenadas: {company.latitude.toFixed(6)}, {company.longitude.toFixed(6)}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="contacts" className="p-4 mt-0">
            <ContactsManager companyId={company.id} />
          </TabsContent>

          <TabsContent value="photos" className="p-4 mt-0">
            <CompanyPhotosManager companyId={company.id} companyName={company.name} />
          </TabsContent>

          <TabsContent value="documents" className="p-4 mt-0">
            <DocumentsManager companyId={company.id} companyName={company.name} />
          </TabsContent>

          <TabsContent value="visits" className="p-4 mt-0">
            <VisitsPanel company={company} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
