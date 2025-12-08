import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Photo {
  id: string;
  photo_url: string;
  photo_caption: string | null;
  uploaded_at: string;
}

interface VisitSheetPhotosProps {
  visitSheetId: string | null;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
  disabled?: boolean;
}

export function VisitSheetPhotos({ 
  visitSheetId, 
  photos, 
  onPhotosChange,
  disabled = false 
}: VisitSheetPhotosProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [caption, setCaption] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadPhoto = async (file: File) => {
    if (!user) {
      toast.error('Debes iniciar sesión para subir fotos');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('visit-sheet-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visit-sheet-photos')
        .getPublicUrl(fileName);

      // If we have a visitSheetId, save to database
      if (visitSheetId) {
        const { data, error } = await supabase
          .from('visit_sheet_photos')
          .insert({
            visit_sheet_id: visitSheetId,
            photo_url: publicUrl,
            photo_caption: caption || null,
            uploaded_by: user.id
          })
          .select()
          .single();

        if (error) throw error;
        onPhotosChange([...photos, data as Photo]);
      } else {
        // Temporary photo (not yet saved to DB)
        const tempPhoto: Photo = {
          id: `temp-${Date.now()}`,
          photo_url: publicUrl,
          photo_caption: caption || null,
          uploaded_at: new Date().toISOString()
        };
        onPhotosChange([...photos, tempPhoto]);
      }

      setCaption('');
      toast.success('Foto subida correctamente');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Error al subir la foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 10MB.');
        return;
      }
      uploadPhoto(file);
    }
    e.target.value = '';
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      if (photo.id.startsWith('temp-')) {
        // Temporary photo, just remove from state
        onPhotosChange(photos.filter(p => p.id !== photo.id));
      } else {
        // Delete from database
        const { error } = await supabase
          .from('visit_sheet_photos')
          .delete()
          .eq('id', photo.id);

        if (error) throw error;
        onPhotosChange(photos.filter(p => p.id !== photo.id));
      }
      toast.success('Foto eliminada');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      toast.error('Error al eliminar la foto');
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Camera className="h-4 w-4" />
          Fotos Adjuntas ({photos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Photo Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group aspect-square">
                <img
                  src={photo.photo_url}
                  alt={photo.photo_caption || 'Foto de visita'}
                  className="w-full h-full object-cover rounded-lg cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                />
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo);
                    }}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Controls */}
        {!disabled && (
          <div className="space-y-2">
            <div>
              <Label htmlFor="photo-caption">Descripción (opcional)</Label>
              <Input
                id="photo-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ej: Fachada del local"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-1" />
                )}
                Cámara
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1" />
                )}
                Galería
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {/* Photo Preview Dialog */}
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {selectedPhoto?.photo_caption || 'Foto de visita'}
              </DialogTitle>
            </DialogHeader>
            {selectedPhoto && (
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.photo_caption || 'Foto de visita'}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
