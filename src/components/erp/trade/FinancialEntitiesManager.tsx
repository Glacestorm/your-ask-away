/**
 * FinancialEntitiesManager - Gestión de Entidades Financieras
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Search,
  Globe,
  Link2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Plus,
} from 'lucide-react';
import { type FinancialEntity } from '@/hooks/erp/useERPTradeFinance';
import { cn } from '@/lib/utils';

interface FinancialEntitiesManagerProps {
  entities: FinancialEntity[];
}

const API_TYPE_LABELS: Record<string, string> = {
  psd2: 'PSD2 Open Banking',
  swift_gpi: 'SWIFT gpi',
  proprietary: 'API Propietaria',
  iso20022: 'ISO 20022',
};

const OPERATION_LABELS: Record<string, string> = {
  discount: 'Descuento',
  lc_import: 'LC Importación',
  lc_export: 'LC Exportación',
  factoring: 'Factoring',
  confirming: 'Confirming',
  guarantees: 'Garantías',
};

export function FinancialEntitiesManager({ entities }: FinancialEntitiesManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const countries = [...new Set(entities.map(e => e.country))].sort();

  const filteredEntities = entities.filter(entity => {
    const matchesSearch = 
      entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.legal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.swift_bic?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCountry = !selectedCountry || entity.country === selectedCountry;
    
    return matchesSearch && matchesCountry;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Entidades Financieras
              </CardTitle>
              <CardDescription>
                Bancos y entidades disponibles para conexión API
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Añadir Entidad
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, SWIFT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedCountry === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCountry(null)}
              >
                Todos
              </Button>
              {countries.map(country => (
                <Button
                  key={country}
                  variant={selectedCountry === country ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCountry(country)}
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entities Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map((entity) => (
          <Card key={entity.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{entity.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {entity.swift_bic || 'Sin SWIFT'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {entity.country}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legal Name */}
              {entity.legal_name && (
                <p className="text-sm text-muted-foreground">{entity.legal_name}</p>
              )}

              {/* API Type */}
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {API_TYPE_LABELS[entity.api_type || ''] || 'Sin API'}
                </span>
                {entity.sync_status === 'connected' ? (
                  <Badge className="bg-green-600 text-xs ml-auto">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs ml-auto">
                    Disponible
                  </Badge>
                )}
              </div>

              {/* Supported Operations */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Operaciones soportadas:</p>
                <div className="flex flex-wrap gap-1">
                  {entity.supported_operations.map((op) => (
                    <Badge key={op} variant="secondary" className="text-xs">
                      {OPERATION_LABELS[op] || op}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              {(entity.contact_email || entity.contact_phone) && (
                <div className="pt-2 border-t space-y-1">
                  {entity.contact_email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {entity.contact_email}
                    </div>
                  )}
                  {entity.contact_phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {entity.contact_phone}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1">
                  <Link2 className="h-4 w-4 mr-2" />
                  Conectar API
                </Button>
                {entity.api_documentation_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={entity.api_documentation_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEntities.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">
              No se encontraron entidades
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Prueba con otros términos de búsqueda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FinancialEntitiesManager;
