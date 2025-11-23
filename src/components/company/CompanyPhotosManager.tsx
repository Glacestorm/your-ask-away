import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, Trash2, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompanyPhoto {
  id: string;
  company_id: string;
  photo_url: string;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}

interface CompanyPhotosManagerProps {
  companyId: string;
  companyName?: string;
}

export const CompanyPhotosManager = ({ companyId, companyName }: CompanyPhotosManagerProps) => {
  const [photos, setPhotos] = useState<CompanyPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [companyId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_photos')
        .select('*')
        .eq('company_id', companyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast.error('Error al cargar las fotos');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Use JPG, PNG o WEBP');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5242880) {
      toast.error('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Seleccione una foto primero');
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      // Generar nombre único para el archivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${companyId}/${Date.now()}.${fileExt}`;

      // Subir archivo al storage
      const { error: uploadError } = await supabase.storage
        .from('company-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('company-photos')
        .getPublicUrl(fileName);

      // Guardar registro en la base de datos
      const { error: dbError } = await supabase
        .from('company_photos')
        .insert({
          company_id: companyId,
          photo_url: fileName,
          uploaded_by: user.id,
          notes: notes || null,
        });

      if (dbError) throw dbError;

      toast.success('Foto subida correctamente');
      setSelectedFile(null);
      setNotes('');
      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    if (!confirm('¿Está seguro de eliminar esta foto?')) return;

    try {
      // Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from('company-photos')
        .remove([photoUrl]);

      if (storageError) throw storageError;

      // Eliminar de la base de datos
      const { error: dbError } = await supabase
        .from('company_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      toast.success('Foto eliminada');
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  const getPhotoPublicUrl = (photoUrl: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('company-photos')
      .getPublicUrl(photoUrl);
    return publicUrl;
  };

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-background/50">
        <div className="flex items-center gap-2 mb-4">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Subir Nueva Foto</h3>
          {photos.length > 0 && (
            <span className="text-sm text-muted-foreground ml-auto">
              {photos.length}/5 fotos
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="photo-upload">Seleccionar Foto</Label>
            <Input
              id="photo-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo 5MB. Formatos: JPG, PNG, WEBP
            </p>
          </div>

          {selectedFile && (
            <>
              <div>
                <Label htmlFor="photo-notes">Notas (opcional)</Label>
                <Textarea
                  id="photo-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descripción de la foto..."
                  rows={2}
                  disabled={uploading}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-4 w-4" />
                    Subir Foto
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Galería de Fotos</h3>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay fotos aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative group aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer"
                onClick={() => setSelectedPhoto(getPhotoPublicUrl(photo.photo_url))}
              >
                <img
                  src={getPhotoPublicUrl(photo.photo_url)}
                  alt={photo.notes || 'Foto de empresa'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                    {photo.notes && (
                      <p className="text-xs text-white mb-2 line-clamp-2">
                        {photo.notes}
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id, photo.photo_url);
                      }}
                      className="w-full"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Foto de {companyName || 'Empresa'}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Foto ampliada"
                className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => setSelectedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
