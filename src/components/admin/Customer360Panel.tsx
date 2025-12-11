import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Search, Eye, ArrowLeft } from 'lucide-react';
import { Customer360Dashboard } from '@/components/dashboard/Customer360Dashboard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface Company {
  id: string;
  name: string;
  sector: string | null;
  parroquia: string;
  gestor_id: string | null;
}

export function Customer360Panel() {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-cdp-search', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('companies')
        .select('id, name, sector, parroquia, gestor_id')
        .order('name')
        .limit(50);

      if (searchTerm.length >= 2) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Company[];
    },
    enabled: searchTerm.length >= 2 || searchTerm.length === 0,
  });

  if (selectedCompany) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCompany(null)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la lista
        </Button>
        <Customer360Dashboard 
          companyId={selectedCompany.id} 
          companyName={selectedCompany.name} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="h-6 w-6 text-primary" />
          Customer Data Platform 360°
        </h2>
        <p className="text-muted-foreground">
          Selecciona una empresa para ver su perfil completo 360°
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Empresa
          </CardTitle>
          <CardDescription>
            Escribe al menos 2 caracteres para buscar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nombre de empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando empresas...
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm.length < 2 
                  ? 'Escribe al menos 2 caracteres para buscar' 
                  : 'No se encontraron empresas'}
              </div>
            ) : (
              <div className="grid gap-2">
                {companies.map((company) => (
                  <Card 
                    key={company.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedCompany(company)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {company.sector || 'Sin sector'} • {company.parroquia}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        Ver 360°
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
