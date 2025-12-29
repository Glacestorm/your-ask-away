/**
 * Investor Documents Panel
 * Phase 15 Extended: Strategic Financial Agent
 * Suite de documentos para inversores con IA
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Briefcase, 
  RefreshCw, 
  Sparkles, 
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  FileText,
  PresentationIcon,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Share2,
  Mail
} from 'lucide-react';
import { useObelixiaInvestorDocs } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function InvestorDocumentsPanel() {
  const [activeTab, setActiveTab] = useState('documents');
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocData, setNewDocData] = useState({
    document_name: '',
    document_type: 'pitch_deck',
    target_audience: 'vc',
    funding_stage: 'seed'
  });

  const {
    documents,
    isLoading,
    isGenerating,
    fetchDocuments,
    generateDocument,
    updateDocument,
    deleteDocument,
    exportDocument
  } = useObelixiaInvestorDocs();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleGenerateDoc = async () => {
    if (!newDocData.document_name) {
      toast.error('Introduce un nombre para el documento');
      return;
    }
    const result = await generateDocument(newDocData);
    if (result) {
      setShowNewDoc(false);
      setNewDocData({ document_name: '', document_type: 'pitch_deck', target_audience: 'vc', funding_stage: 'seed' });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pitch_deck': return <PresentationIcon className="h-4 w-4" />;
      case 'executive_summary': return <FileText className="h-4 w-4" />;
      case 'financial_model': return <TrendingUp className="h-4 w-4" />;
      case 'term_sheet': return <Briefcase className="h-4 w-4" />;
      case 'data_room': return <Building2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pitch_deck': return 'Pitch Deck';
      case 'executive_summary': return 'Resumen Ejecutivo';
      case 'financial_model': return 'Modelo Financiero';
      case 'term_sheet': return 'Term Sheet';
      case 'data_room': return 'Data Room';
      case 'investor_update': return 'Investor Update';
      default: return type;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'vc': return 'Venture Capital';
      case 'angel': return 'Angel Investors';
      case 'pe': return 'Private Equity';
      case 'bank': return 'Bancos';
      case 'corporate': return 'Corporate';
      default: return audience;
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'pre_seed': return 'Pre-Seed';
      case 'seed': return 'Seed';
      case 'series_a': return 'Serie A';
      case 'series_b': return 'Serie B';
      case 'series_c': return 'Serie C+';
      case 'growth': return 'Growth';
      default: return stage;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'shared': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Documentos para Inversores
          </h2>
          <p className="text-muted-foreground">
            Genera documentos profesionales para captación de inversión
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fetchDocuments()} variant="outline" disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Actualizar
          </Button>
          <Button onClick={() => setShowNewDoc(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Documento
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documentos</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pitch Decks</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.document_type === 'pitch_deck').length}
                </p>
              </div>
              <PresentationIcon className="h-8 w-8 text-purple-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compartidos</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.status === 'shared').length}
                </p>
              </div>
              <Share2 className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inversión Objetivo</p>
                <p className="text-2xl font-bold">
                  {documents.reduce((sum, d) => sum + (Number(d.funding_amount) || 0), 0).toLocaleString('es-ES')}€
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Document Form */}
      {showNewDoc && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Crear Documento para Inversores
            </CardTitle>
            <CardDescription>
              La IA generará un documento profesional adaptado a tu audiencia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre del Documento *</label>
                <Input
                  placeholder="Ej: Pitch Deck Serie A 2025"
                  value={newDocData.document_name}
                  onChange={(e) => setNewDocData({ ...newDocData, document_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Documento *</label>
                <Select
                  value={newDocData.document_type}
                  onValueChange={(value) => setNewDocData({ ...newDocData, document_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
                    <SelectItem value="executive_summary">Resumen Ejecutivo</SelectItem>
                    <SelectItem value="financial_model">Modelo Financiero</SelectItem>
                    <SelectItem value="term_sheet">Term Sheet</SelectItem>
                    <SelectItem value="data_room">Data Room Index</SelectItem>
                    <SelectItem value="investor_update">Investor Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audiencia Objetivo</label>
                <Select
                  value={newDocData.target_audience}
                  onValueChange={(value) => setNewDocData({ ...newDocData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vc">Venture Capital</SelectItem>
                    <SelectItem value="angel">Angel Investors</SelectItem>
                    <SelectItem value="pe">Private Equity</SelectItem>
                    <SelectItem value="bank">Bancos</SelectItem>
                    <SelectItem value="corporate">Corporate VC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Etapa de Financiación</label>
                <Select
                  value={newDocData.funding_stage}
                  onValueChange={(value) => setNewDocData({ ...newDocData, funding_stage: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                    <SelectItem value="seed">Seed</SelectItem>
                    <SelectItem value="series_a">Serie A</SelectItem>
                    <SelectItem value="series_b">Serie B</SelectItem>
                    <SelectItem value="series_c">Serie C+</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewDoc(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateDoc} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">
            <Briefcase className="h-4 w-4 mr-2" />
            Mis Documentos
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Plantillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {getTypeIcon(doc.document_type || '')}
                          </div>
                          <div>
                            <h4 className="font-semibold">{doc.document_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {getTypeLabel(doc.document_type || '')}
                            </p>
                          </div>
                          <Badge className={getStatusColor(doc.status || '')}>
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">
                            <Users className="h-3 w-3 mr-1" />
                            {getAudienceLabel(doc.target_audience || '')}
                          </Badge>
                          <Badge variant="outline">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {getStageLabel(doc.funding_stage || '')}
                          </Badge>
                          {doc.funding_amount && (
                            <Badge variant="outline">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {Number(doc.funding_amount).toLocaleString('es-ES')}€
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Creado: {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => exportDocument(doc.id, 'pdf')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {documents.length === 0 && !isLoading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tienes documentos para inversores</p>
                  <Button className="mt-4" onClick={() => setShowNewDoc(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear tu primer documento
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Pitch Deck Startup', icon: PresentationIcon, desc: 'Presentación para VCs y angels', type: 'pitch_deck' },
              { name: 'Executive Summary', icon: FileText, desc: 'Resumen ejecutivo de 2 páginas', type: 'executive_summary' },
              { name: 'Financial Model', icon: TrendingUp, desc: 'Proyecciones financieras 5 años', type: 'financial_model' },
              { name: 'Term Sheet', icon: Briefcase, desc: 'Términos de inversión', type: 'term_sheet' },
              { name: 'Data Room Index', icon: Building2, desc: 'Estructura de documentación', type: 'data_room' },
              { name: 'Investor Update', icon: Mail, desc: 'Actualización mensual', type: 'investor_update' },
            ].map((template) => (
              <Card key={template.name} className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <template.icon className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{template.desc}</p>
                  <Button 
                    className="mt-4" 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setNewDocData({ ...newDocData, document_type: template.type });
                      setShowNewDoc(true);
                    }}
                  >
                    Usar Plantilla
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InvestorDocumentsPanel;
