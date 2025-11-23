import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { CompanyDocument } from '@/types/database';
import { documentUploadSchema, DocumentUploadFormData } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Download, Trash2, FileText, Upload, File, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DocumentsManagerProps {
  companyId: string;
  companyName: string;
}

export const DocumentsManager = ({ companyId, companyName }: DocumentsManagerProps) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
  });

  useEffect(() => {
    fetchDocuments();
  }, [companyId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_documents')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      toast.error('Error al cargar documentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue('file', file);
      if (!register('document_name').name) {
        setValue('document_name', file.name);
      }
    }
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile || !user) return;

    try {
      setUploading(true);

      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${companyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(fileName);

      // Insert document record
      const { error: insertError } = await supabase
        .from('company_documents')
        .insert({
          company_id: companyId,
          document_name: data.document_name,
          document_type: data.document_type,
          document_url: urlData.publicUrl,
          file_size: selectedFile.size,
          uploaded_by: user.id,
          notes: data.notes,
        });

      if (insertError) throw insertError;

      toast.success('Documento subido correctamente');
      fetchDocuments();
      handleCloseDialog();
    } catch (error: any) {
      toast.error('Error al subir documento: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: CompanyDocument) => {
    if (!doc.document_url) return;

    try {
      const response = await fetch(doc.document_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.document_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Documento descargado');
    } catch (error: any) {
      toast.error('Error al descargar: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocumentId) return;

    const doc = documents.find(d => d.id === deleteDocumentId);
    if (!doc) return;

    try {
      // Delete from storage
      if (doc.document_url) {
        const fileName = doc.document_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('company-documents')
            .remove([`${companyId}/${fileName}`]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('company_documents')
        .delete()
        .eq('id', deleteDocumentId);

      if (error) throw error;

      toast.success('Documento eliminado correctamente');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    } finally {
      setDeleteDocumentId(null);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFile(null);
    reset({
      document_name: '',
      document_type: '',
      notes: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['xls', 'xlsx'].includes(ext || '')) return '📊';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) return '🖼️';
    return '📁';
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Cargando documentos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documentos ({documents.length})
        </h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="file">Archivo *</Label>
                <div className="mt-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo
                  </Button>
                  {selectedFile && (
                    <div className="mt-2 p-3 bg-muted rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4" />
                        <span className="text-sm">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(selectedFile.size)})
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="text-sm text-destructive mt-1">{errors.file.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document_name">Nombre del Documento *</Label>
                <Input
                  id="document_name"
                  {...register('document_name')}
                  placeholder="Contrato 2024"
                />
                {errors.document_name && (
                  <p className="text-sm text-destructive mt-1">{errors.document_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="document_type">Tipo de Documento</Label>
                <Input
                  id="document_type"
                  {...register('document_type')}
                  placeholder="Contrato, Factura, etc."
                />
                {errors.document_type && (
                  <p className="text-sm text-destructive mt-1">{errors.document_type.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Información adicional sobre este documento..."
                  rows={3}
                />
                {errors.notes && (
                  <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading || !selectedFile}>
                  {uploading ? 'Subiendo...' : 'Subir'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No hay documentos</p>
          <p className="text-sm">Sube el primer documento de esta empresa</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getFileIcon(doc.document_name)}</span>
                    <h4 className="font-semibold">{doc.document_name}</h4>
                  </div>
                  {doc.document_type && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Tipo: {doc.document_type}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Tamaño: {formatFileSize(doc.file_size)} • 
                    Subido {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: es })}
                  </p>
                  {doc.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{doc.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteDocumentId(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteDocumentId} onOpenChange={() => setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente del almacenamiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
