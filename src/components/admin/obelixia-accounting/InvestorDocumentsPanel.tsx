/**
 * Investor Documents Panel
 * Phase 15 Extended: Strategic Financial Agent
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Briefcase, RefreshCw, Sparkles, Plus, Download, Eye, Edit, FileText, 
  PresentationIcon, TrendingUp, DollarSign, Share2
} from 'lucide-react';
import { useObelixiaInvestorDocs } from '@/hooks/admin/obelixia-accounting';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function InvestorDocumentsPanel() {
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newDocData, setNewDocData] = useState({
    title: '',
    document_type: 'pitch_deck' as const
  });

  const { documents, isLoading, fetchDocuments, generateDocument, exportDocument } = useObelixiaInvestorDocs();

  useEffect(() => { fetchDocuments(); }, []);

  const handleGenerateDoc = async () => {
    if (!newDocData.title) {
      toast.error('Introduce un nombre para el documento');
      return;
    }
    setIsGenerating(true);
    const result = await generateDocument({
      documentType: newDocData.document_type,
      title: newDocData.title,
      companyInfo: {}
    });
    setIsGenerating(false);
    if (result) {
      setShowNewDoc(false);
      setNewDocData({ title: '', document_type: 'pitch_deck' });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pitch_deck': return <PresentationIcon className="h-4 w-4" />;
      case 'executive_summary': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'completed': return 'bg-green-500/10 text-green-500';
      case 'shared': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Documentos para Inversores
          </h2>
          <p className="text-muted-foreground">Genera documentos profesionales con IA</p>
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
                <p className="text-2xl font-bold">{documents.filter(d => d.document_type === 'pitch_deck').length}</p>
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
                <p className="text-2xl font-bold">{documents.filter(d => d.status === 'shared').length}</p>
              </div>
              <Share2 className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ask Total</p>
                <p className="text-2xl font-bold">{documents.reduce((sum, d) => sum + (d.ask_amount || 0), 0).toLocaleString('es-ES')}€</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {showNewDoc && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Crear Documento para Inversores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input placeholder="Título del documento *" value={newDocData.title} onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })} />
              <Select value={newDocData.document_type} onValueChange={(value: any) => setNewDocData({ ...newDocData, document_type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
                  <SelectItem value="executive_summary">Resumen Ejecutivo</SelectItem>
                  <SelectItem value="one_pager">One Pager</SelectItem>
                  <SelectItem value="teaser">Teaser</SelectItem>
                  <SelectItem value="investor_memo">Investor Memo</SelectItem>
                  <SelectItem value="data_room">Data Room</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNewDoc(false)}>Cancelar</Button>
              <Button onClick={handleGenerateDoc} disabled={isGenerating}>
                {isGenerating ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4 mr-2" />Generar</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">{getTypeIcon(doc.document_type)}</div>
                      <div>
                        <h4 className="font-semibold">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground">{doc.document_type}</p>
                      </div>
                      <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {doc.ask_amount > 0 && <span><DollarSign className="h-3 w-3 inline" /> {doc.ask_amount.toLocaleString('es-ES')}€</span>}
                      <span>Creado: {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: es })}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline"><Eye className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline"><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => exportDocument(doc.id, 'pdf')}><Download className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline"><Share2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {documents.length === 0 && !isLoading && (
            <div className="text-center py-12 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tienes documentos para inversores</p>
              <Button className="mt-4" onClick={() => setShowNewDoc(true)}><Plus className="h-4 w-4 mr-2" />Crear documento</Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default InvestorDocumentsPanel;
