import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Image, Download, Loader2, Sun, Moon, Mountain, Satellite, Map as MapIcon, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaticMapExportProps {
  center?: { latitude: number; longitude: number };
  markers?: Array<{ latitude: number; longitude: number; name?: string }>;
}

type MapStyle = 'streets-v12' | 'outdoors-v12' | 'light-v11' | 'dark-v11' | 'satellite-v9' | 'satellite-streets-v12';

export function StaticMapExport({ center, markers = [] }: StaticMapExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [style, setStyle] = useState<MapStyle>('streets-v12');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [zoom, setZoom] = useState(12);
  const [includeMarkers, setIncludeMarkers] = useState(true);
  const [retina, setRetina] = useState(true);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const styleOptions = [
    { value: 'streets-v12', label: 'Calles', icon: <MapIcon className="h-4 w-4" /> },
    { value: 'outdoors-v12', label: 'Exterior', icon: <Mountain className="h-4 w-4" /> },
    { value: 'light-v11', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark-v11', label: 'Oscuro', icon: <Moon className="h-4 w-4" /> },
    { value: 'satellite-v9', label: 'Satélite', icon: <Satellite className="h-4 w-4" /> },
    { value: 'satellite-streets-v12', label: 'Satélite + Calles', icon: <Satellite className="h-4 w-4" /> },
  ];

  const generateStaticMap = async () => {
    if (!center && markers.length === 0) {
      toast.error('Se necesita un centro o marcadores');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody: any = {
        style,
        width: Math.min(width, 1280),
        height: Math.min(height, 1280),
        retina,
      };

      if (center) {
        requestBody.center = center;
        requestBody.zoom = zoom;
      }

      if (includeMarkers && markers.length > 0) {
        requestBody.markers = markers.slice(0, 10).map((m, i) => ({
          latitude: m.latitude,
          longitude: m.longitude,
          color: 'ff0000',
          label: String(i + 1),
          size: 's',
        }));
      }

      const { data, error } = await supabase.functions.invoke('mapbox-static', {
        body: requestBody,
      });

      if (error) throw error;

      if (data.success) {
        setGeneratedImage(data.image_base64);
        toast.success('Imagen generada correctamente');
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error generating static map:', error);
      toast.error(error.message || 'Error al generar imagen');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `mapa_${style}_${width}x${height}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagen descargada');
  };

  const copyToClipboard = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      toast.success('Imagen copiada al portapapeles');
    } catch (error) {
      toast.error('No se pudo copiar la imagen');
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card shadow-lg"
        >
          <Image className="mr-2 h-4 w-4" />
          Exportar Imagen
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-2 w-80 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Image className="h-4 w-4 text-purple-500" />
              Generar Imagen Estática
            </CardTitle>
            <CardDescription className="text-xs">
              Exporta el mapa como imagen PNG
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Style Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Estilo de mapa</Label>
              <Select value={style} onValueChange={(v) => setStyle(v as MapStyle)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        {opt.icon}
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Ancho (px)</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.min(1280, Number(e.target.value)))}
                  min={100}
                  max={1280}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Alto (px)</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.min(1280, Number(e.target.value)))}
                  min={100}
                  max={1280}
                  className="h-8"
                />
              </div>
            </div>

            {/* Zoom (if center is available) */}
            {center && (
              <div className="space-y-1">
                <Label className="text-xs">Zoom: {zoom}</Label>
                <Input
                  type="range"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  min={1}
                  max={20}
                  className="h-2"
                />
              </div>
            )}

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="retina"
                  checked={retina}
                  onCheckedChange={(c) => setRetina(c as boolean)}
                />
                <Label htmlFor="retina" className="text-xs">
                  Alta resolución (Retina @2x)
                </Label>
              </div>
              {markers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMarkers"
                    checked={includeMarkers}
                    onCheckedChange={(c) => setIncludeMarkers(c as boolean)}
                  />
                  <Label htmlFor="includeMarkers" className="text-xs">
                    Incluir marcadores ({Math.min(markers.length, 10)})
                  </Label>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button 
              onClick={generateStaticMap} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Image className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Generando...' : 'Generar Imagen'}
            </Button>

            {/* Preview */}
            {generatedImage && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Vista previa</Label>
                <div className="relative aspect-video rounded-lg border overflow-hidden">
                  <img 
                    src={generatedImage} 
                    alt="Generated map" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={downloadImage} 
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Descargar
                  </Button>
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copiar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
