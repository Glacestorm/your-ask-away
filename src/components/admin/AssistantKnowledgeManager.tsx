import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText, Link, Upload, Trash2, Plus, ExternalLink,
  FileStack, ClipboardList, Users, BookOpen, Package
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface KnowledgeDocument {
  id: string;
  title: string;
  description: string | null;
  document_type: string;
  content_type: string;
  content: string | null;
  file_url: string | null;
  external_url: string | null;
  is_active: boolean | null;
  created_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'normativas', label: 'Normativas', icon: FileText },
  { value: 'productos', label: 'Productos', icon: Package },
  { value: 'procedimientos', label: 'Procedimientos', icon: BookOpen },
  { value: 'formularios_internos', label: 'Formularios Internos', icon: ClipboardList },
  { value: 'formularios_clientes', label: 'Formularios Clientes', icon: Users },
];

export function AssistantKnowledgeManager() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('normativas');
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'normativas',
    content_type: 'text',
    content: '',
    external_url: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assistant_knowledge_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFormData(prev => ({ ...prev, content_type: 'pdf' }));
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    if (!formData.title.trim()) {
      toast.error('El título es obligatorio');
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;

      // Upload PDF if selected
      if (selectedFile && formData.content_type === 'pdf') {
        const fileName = `${Date.now()}_${selectedFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assistant-documents')
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage
          .from('assistant-documents')
          .getPublicUrl(fileName);
        
        fileUrl = urlData.publicUrl;
      }

      // Insert document record
      const { error } = await supabase
        .from('assistant_knowledge_documents')
        .insert({
          title: formData.title,
          description: formData.description || null,
          document_type: formData.document_type,
          content_type: formData.content_type,
          content: formData.content_type === 'text' ? formData.content : null,
          file_url: fileUrl,
          external_url: formData.content_type === 'url' ? formData.external_url : null,
          created_by: user.id,
        });

      if (error) throw error;

      toast.success('Documento añadido correctamente');
      setIsDialogOpen(false);
      resetForm();
      loadDocuments();
    } catch (error) {
      console.error('Error adding document:', error);
      toast.error('Error al añadir el documento');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      document_type: 'normativas',
      content_type: 'text',
      content: '',
      external_url: '',
    });
    setSelectedFile(null);
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase
      .from('assistant_knowledge_documents')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Documento eliminado');
      loadDocuments();
    } else {
      toast.error('Error al eliminar el documento');
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('assistant_knowledge_documents')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (!error) {
      loadDocuments();
    }
  };

  const filteredDocuments = documents.filter(d => d.document_type === selectedType);

  const getTypeIcon = (type: string) => {
    const found = DOCUMENT_TYPES.find(t => t.value === type);
    return found ? found.icon : FileText;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileStack className="h-5 w-5" />
            Base de Conocimiento del Asistente
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Añadir Documento de Conocimiento</DialogTitle>
                <DialogDescription>
                  Añade documentos que el asistente utilizará para responder consultas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de documento *</Label>
                    <Select
                      value={formData.document_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de contenido *</Label>
                    <Select
                      value={formData.content_type}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Texto</SelectItem>
                        <SelectItem value="pdf">Archivo PDF</SelectItem>
                        <SelectItem value="url">URL Externa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej: Normativa PSD2 - Servicios de Pago"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descripción breve del contenido..."
                    rows={2}
                  />
                </div>

                {formData.content_type === 'text' && (
                  <div className="space-y-2">
                    <Label>Contenido *</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Escribe o pega el contenido aquí..."
                      rows={8}
                    />
                  </div>
                )}

                {formData.content_type === 'pdf' && (
                  <div className="space-y-2">
                    <Label>Archivo PDF *</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Seleccionado: {selectedFile.name}
                      </p>
                    )}
                  </div>
                )}

                {formData.content_type === 'url' && (
                  <div className="space-y-2">
                    <Label>URL Externa *</Label>
                    <Input
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, external_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? 'Subiendo...' : 'Añadir Documento'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid grid-cols-5 w-full">
            {DOCUMENT_TYPES.map(type => (
              <TabsTrigger key={type.value} value={type.value} className="text-xs">
                <type.icon className="h-4 w-4 mr-1" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedType} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando documentos...
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay documentos en esta categoría
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredDocuments.map(doc => {
                    const Icon = getTypeIcon(doc.document_type);
                    return (
                      <div
                        key={doc.id}
                        className={`p-3 rounded-lg border ${doc.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <h4 className="font-medium truncate">{doc.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {doc.content_type === 'pdf' ? 'PDF' : doc.content_type === 'url' ? 'URL' : 'Texto'}
                              </Badge>
                              {!doc.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Inactivo
                                </Badge>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Añadido: {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.external_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(doc.external_url!, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleActive(doc.id, doc.is_active)}
                            >
                              {doc.is_active ? 'Desactivar' : 'Activar'}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteDocument(doc.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
