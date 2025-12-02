import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CompanyPhoto {
  id: string;
  company_id: string;
  photo_url: string;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}

interface CompanyPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null;
  companyName: string | null;
}

export const CompanyPhotosDialog = ({ 
  open, 
  onOpenChange, 
  companyId,
  companyName 
}: CompanyPhotosDialogProps) => {
  const [photos, setPhotos] = useState<CompanyPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open && companyId) {
      fetchPhotos();
    }
  }, [open, companyId]);

  const fetchPhotos = async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_photos')
        .select('*')
        .eq('company_id', companyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoPublicUrl = (photoUrl: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('company-photos')
      .getPublicUrl(photoUrl);
    return publicUrl;
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleClose = () => {
    onOpenChange(false);
    setPhotos([]);
    setSelectedIndex(0);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Fotos de {companyName || 'Empresa'}
            {photos.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({selectedIndex + 1} de {photos.length})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Camera className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay fotos disponibles</p>
              <p className="text-sm">Esta empresa no tiene fotos registradas</p>
            </div>
          ) : (
            <div className="relative">
              {/* Main photo display */}
              <div className="relative bg-muted rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={getPhotoPublicUrl(photos[selectedIndex].photo_url)}
                  alt={photos[selectedIndex].notes || `Foto ${selectedIndex + 1}`}
                  className="max-w-full max-h-[60vh] object-contain"
                />
                
                {/* Navigation buttons */}
                {photos.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-lg"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Photo notes */}
              {photos[selectedIndex].notes && (
                <p className="mt-3 text-sm text-muted-foreground italic text-center">
                  {photos[selectedIndex].notes}
                </p>
              )}

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                        index === selectedIndex
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-muted-foreground/50'
                      }`}
                    >
                      <img
                        src={getPhotoPublicUrl(photo.photo_url)}
                        alt={photo.notes || `Miniatura ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with close button */}
        <div className="p-4 pt-2 border-t flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
