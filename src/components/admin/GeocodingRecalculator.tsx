import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GeocodingResult {
  companyId: string;
  companyName: string;
  success: boolean;
  oldLat?: number;
  oldLng?: number;
  newLat?: number;
  newLng?: number;
  error?: string;
}

export function GeocodingRecalculator() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const geocodeAddress = async (address: string, parroquia: string): Promise<{ latitude: number | null; longitude: number | null; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address, parroquia }
      });

      if (error) {
        return { latitude: null, longitude: null, error: error.message };
      }

      return {
        latitude: data?.latitude || null,
        longitude: data?.longitude || null,
        error: data?.error
      };
    } catch (err) {
      return { latitude: null, longitude: null, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const recalculateAll = async () => {
    setIsRunning(true);
    setResults([]);
    setSuccessCount(0);
    setErrorCount(0);
    setProgress(0);

    try {
      // Fetch all companies
      const { data: companies, error: fetchError } = await supabase
        .from('companies')
        .select('id, name, address, parroquia, latitude, longitude')
        .order('name');

      if (fetchError) {
        toast.error('Error al obtenir empreses: ' + fetchError.message);
        setIsRunning(false);
        return;
      }

      if (!companies || companies.length === 0) {
        toast.info('No hi ha empreses per processar');
        setIsRunning(false);
        return;
      }

      setTotal(companies.length);
      toast.info(`Processant ${companies.length} empreses...`);

      let success = 0;
      let errors = 0;

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        setProcessed(i + 1);
        setProgress(((i + 1) / companies.length) * 100);

        // Geocode the address
        const { latitude, longitude, error } = await geocodeAddress(company.address, company.parroquia);

        const result: GeocodingResult = {
          companyId: company.id,
          companyName: company.name,
          success: false,
          oldLat: company.latitude,
          oldLng: company.longitude
        };

        if (latitude && longitude) {
          // Update company coordinates
          const { error: updateError } = await supabase
            .from('companies')
            .update({ latitude, longitude, updated_at: new Date().toISOString() })
            .eq('id', company.id);

          if (updateError) {
            result.error = updateError.message;
            errors++;
          } else {
            result.success = true;
            result.newLat = latitude;
            result.newLng = longitude;
            success++;
          }
        } else {
          result.error = error || 'No es van poder obtenir coordenades';
          errors++;
        }

        setResults(prev => [...prev, result]);
        setSuccessCount(success);
        setErrorCount(errors);

        // Delay between requests to respect Nominatim rate limit (1 request per second)
        if (i < companies.length - 1) {
          await delay(1100);
        }
      }

      toast.success(`Procés completat: ${success} èxits, ${errors} errors`);
    } catch (err) {
      toast.error('Error durant el procés: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Recalcular Geolocalització
          </CardTitle>
          <CardDescription>
            Actualitza les coordenades de totes les empreses utilitzant el servei de geocodificació.
            Aquest procés pot trigar diversos minuts degut als límits de velocitat del servei.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={recalculateAll} 
              disabled={isRunning}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Processant...' : 'Iniciar Recàlcul'}
            </Button>

            {total > 0 && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="secondary">{processed} / {total}</Badge>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {successCount}
                </Badge>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {errorCount}
                </Badge>
              </div>
            )}
          </div>

          {isRunning && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {Math.round(progress)}% completat - Aproximadament {Math.ceil((total - processed) * 1.1 / 60)} minuts restants
              </p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2">Empresa</th>
                    <th className="text-left p-2">Estat</th>
                    <th className="text-left p-2">Coordenades Antigues</th>
                    <th className="text-left p-2">Coordenades Noves</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(-50).reverse().map((result, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-medium">{result.companyName}</td>
                      <td className="p-2">
                        {result.success ? (
                          <Badge variant="default" className="bg-green-600 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Èxit
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground font-mono text-xs">
                        {result.oldLat?.toFixed(5)}, {result.oldLng?.toFixed(5)}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {result.success ? (
                          <span className="text-green-600">
                            {result.newLat?.toFixed(5)}, {result.newLng?.toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-destructive text-xs">{result.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Nota important:</p>
                <ul className="list-disc list-inside mt-1 text-muted-foreground space-y-1">
                  <li>El servei de geocodificació (Nominatim) té un límit d'1 petició per segon</li>
                  <li>Per a 1000 empreses, el procés trigarà aproximadament 17 minuts</li>
                  <li>Les coordenades s'actualitzen immediatament a mesura que es processen</li>
                  <li>Pots tancar aquesta finestra i el procés continuarà</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
