import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Fingerprint,
  CreditCard,
  QrCode,
  Smartphone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Building2,
  Globe,
  Key,
  FileCheck,
  Clock
} from 'lucide-react';
import { useEIDAS } from '@/hooks/useEIDAS';
import { cn } from '@/lib/utils';
import { QualifiedTrustServiceProvider } from '@/lib/eidas/types';

export function EIDASVerificationPanel() {
  const {
    state,
    isLoading,
    createDID,
    getDIDs,
    initiateKYCVerification,
    checkWallet,
    getTrustProviders,
    getKYCHistory,
    formatDIDDisplay,
    getSupportedCredentialTypes
  } = useEIDAS();

  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [trustProviders, setTrustProviders] = useState<QualifiedTrustServiceProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  // Load trust providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      setIsLoadingProviders(true);
      const providers = await getTrustProviders();
      setTrustProviders(providers);
      setIsLoadingProviders(false);
    };
    loadProviders();
  }, [getTrustProviders]);

  const handleInitiateKYC = async () => {
    const result = await initiateKYCVerification();
    if (result) {
      setQrData(result.qrData);
      setDeepLink(result.deepLink);
      setShowQRDialog(true);
    }
  };

  const handleCreateDID = async () => {
    await createDID();
  };

  const credentialTypes = getSupportedCredentialTypes();
  const kycHistory = getKYCHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Verificació eIDAS 2.0
          </h2>
          <p className="text-muted-foreground">
            Integració amb EUDI Wallet i Identitat Digital Europea
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={state.walletAvailable ? 'default' : 'secondary'}>
            {state.walletAvailable ? 'Wallet Disponible' : 'Wallet No Detectat'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => checkWallet()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error.message}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="verification">Verificació KYC</TabsTrigger>
          <TabsTrigger value="credentials">Credencials</TabsTrigger>
          <TabsTrigger value="did">Identitat DID</TabsTrigger>
          <TabsTrigger value="trust">Serveis de Confiança</TabsTrigger>
        </TabsList>

        {/* KYC Verification Tab */}
        <TabsContent value="verification" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Initiate Verification Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Verificació d'Identitat
                </CardTitle>
                <CardDescription>
                  Inicia el procés KYC/AML amb EUDI Wallet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Utilitza el teu EUDI Wallet per verificar la teva identitat de forma segura i complint amb eIDAS 2.0.
                  </p>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Verificació d'identitat qualificada
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Comprovació AML automàtica
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Compliment normatiu europeu
                    </li>
                  </ul>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleInitiateKYC}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4 mr-2" />
                  )}
                  Iniciar Verificació
                </Button>
              </CardContent>
            </Card>

            {/* Supported Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credencials Suportades
                </CardTitle>
                <CardDescription>
                  Tipus de credencials EUDI Wallet acceptades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {credentialTypes.map((cred) => (
                    <div 
                      key={cred.type}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{cred.name}</p>
                          <p className="text-xs text-muted-foreground">{cred.type}</p>
                        </div>
                      </div>
                      <Badge variant={
                        cred.assuranceLevel === 'high' ? 'default' :
                        cred.assuranceLevel === 'substantial' ? 'secondary' : 'outline'
                      }>
                        {cred.assuranceLevel.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KYC History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Verificacions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kycHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No hi ha verificacions anteriors
                </p>
              ) : (
                <div className="space-y-2">
                  {kycHistory.slice(0, 5).map((result) => (
                    <div 
                      key={result.requestId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {result.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : result.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            Verificació {result.requestId.substring(0, 8)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : 'Pendent'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.riskScore !== undefined && (
                          <Badge variant={result.riskScore < 20 ? 'default' : 'destructive'}>
                            Risc: {result.riskScore}
                          </Badge>
                        )}
                        <Badge variant={
                          result.status === 'completed' ? 'default' :
                          result.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {result.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Les Meves Credencials Verificables</CardTitle>
              <CardDescription>
                Credencials W3C VC emmagatzemades localment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {state.credentials.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No tens credencials verificables emmagatzemades
                  </p>
                  <Button variant="outline" className="mt-4" onClick={handleInitiateKYC}>
                    Obtenir Credencials
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.credentials.map((cred) => (
                    <div key={cred.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{cred.type[1] || cred.type[0]}</h4>
                        <Badge>{cred.proof?.type || 'No proof'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Emissor: {typeof cred.issuer === 'string' ? formatDIDDisplay(cred.issuer) : formatDIDDisplay(cred.issuer.id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Emès: {new Date(cred.issuanceDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DID Tab */}
        <TabsContent value="did" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Identitat Descentralitzada (DID)
              </CardTitle>
              <CardDescription>
                Gestiona els teus identificadors descentralitzats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.primaryDID ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">DID Principal</span>
                      <Badge>Actiu</Badge>
                    </div>
                    <p className="font-mono text-xs break-all">{state.primaryDID.id}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mètode: {state.primaryDID.method} | 
                      Creat: {new Date(state.primaryDID.created).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <p className="text-sm font-medium">Mètodes de Verificació</p>
                    {state.primaryDID.verificationMethod.map((vm) => (
                      <div key={vm.id} className="p-2 rounded border text-xs">
                        <p className="font-mono truncate">{vm.id}</p>
                        <p className="text-muted-foreground">{vm.type}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No tens cap DID creat
                  </p>
                  <Button onClick={handleCreateDID} disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Crear DID
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trust Services Tab */}
        <TabsContent value="trust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Proveïdors de Serveis de Confiança Qualificats
              </CardTitle>
              <CardDescription>
                Llista de la UE de QTSP reconeguts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProviders ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {trustProviders.map((provider) => (
                    <div 
                      key={provider.id}
                      className="p-4 rounded-lg border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                        <Badge variant={provider.status === 'granted' ? 'default' : 'destructive'}>
                          {provider.countryCode}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.services.filter(s => s.status === 'granted').map((service) => (
                          <Badge key={service.type} variant="outline" className="text-xs">
                            {service.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Escaneja amb EUDI Wallet
            </DialogTitle>
            <DialogDescription>
              Escaneja el codi QR amb la teva aplicació EUDI Wallet per verificar la teva identitat
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* QR Code Placeholder */}
            <div className="aspect-square max-w-64 mx-auto bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center p-4">
                <QrCode className="h-24 w-24 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Codi QR generat
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">O obre directament al mòbil:</p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => deepLink && window.open(deepLink, '_blank')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Obrir EUDI Wallet
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                El codi QR expira en 15 minuts per seguretat.
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
