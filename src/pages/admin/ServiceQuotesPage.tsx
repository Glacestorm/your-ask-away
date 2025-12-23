import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Plus, List } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ServiceQuoteBuilder } from '@/components/admin/service-quotes/ServiceQuoteBuilder';
import { ServiceQuotesList } from '@/components/admin/service-quotes/ServiceQuotesList';

export default function ServiceQuotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const installationId = searchParams.get('installation') || undefined;
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'list');

  const handleViewQuote = (quoteId: string) => {
    navigate(`/admin/service-quotes?tab=builder&quote=${quoteId}`);
  };

  const handleCreateNew = () => {
    setActiveTab('builder');
  };

  const handleComplete = () => {
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Presupuestos de Servicio</h1>
                <p className="text-sm text-muted-foreground">
                  Gestiona y crea presupuestos para servicios técnicos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listado
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Presupuesto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <ServiceQuotesList
              installationId={installationId}
              onCreateNew={handleCreateNew}
              onViewQuote={handleViewQuote}
            />
          </TabsContent>

          <TabsContent value="builder" className="space-y-4">
            <ServiceQuoteBuilder
              installationId={installationId}
              onComplete={handleComplete}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
