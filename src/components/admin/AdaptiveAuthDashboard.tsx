import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, ShieldAlert, ShieldCheck, Smartphone, MapPin, 
  Clock, AlertTriangle, TrendingUp, Fingerprint, Globe,
  Laptop, Trash2, CheckCircle, XCircle, Eye, RefreshCw,
  Activity, Brain, Gauge, Timer, MousePointer, Keyboard,
  Navigation, Zap, BarChart3, Radio, Scan, DollarSign,
  AlertOctagon, UserCheck, FileWarning, Scale, Hash, Target
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAdaptiveAuth } from '@/hooks/useAdaptiveAuth';
import { useBehavioralBiometrics } from '@/hooks/useBehavioralBiometrics';
import { useAMLFraudDetection } from '@/hooks/useAMLFraudDetection';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeviceFingerprint {
  id: string;
  user_id: string;
  device_hash: string;
  browser_info: { userAgent?: string } | null;
  os_info: { platform?: string } | null;
  screen_resolution: string | null;
  timezone: string | null;
  language: string | null;
  is_trusted: boolean;
  login_count: number;
  last_seen_at: string | null;
  last_ip: string | null;
  last_location: string | null;
  created_at: string;
}

interface RiskAssessment {
  id: string;
  user_id: string;
  session_id: string;
  risk_level: string;
  risk_score: number;
  risk_factors: { factor: string; weight: number; description: string }[];
  requires_step_up: boolean;
  step_up_completed: boolean;
  ip_address: string | null;
  location_data: { country?: string; city?: string; isVpn?: boolean } | null;
  created_at: string;
}

interface LoginLocation {
  id: string;
  user_id: string;
  ip_address: string;
  country: string;
  country_code: string;
  city: string;
  region: string;
  is_vpn: boolean;
  is_proxy: boolean;
  isp: string;
  created_at: string;
}

interface AuthChallenge {
  id: string;
  user_id: string;
  session_id: string;
  challenge_type: string;
  verified_at: string | null;
  expires_at: string;
  attempts: number;
  email_sent_at: string | null;
  created_at: string;
}

export function AdaptiveAuthDashboard() {
  const [devices, setDevices] = useState<DeviceFingerprint[]>([]);
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [locations, setLocations] = useState<LoginLocation[]>([]);
  const [challenges, setChallenges] = useState<AuthChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [devicesRes, assessmentsRes, locationsRes, challengesRes] = await Promise.all([
        supabase.from('user_device_fingerprints').select('*').order('last_seen_at', { ascending: false }).limit(100),
        supabase.from('session_risk_assessments').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('user_login_locations').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('auth_challenges').select('*').order('created_at', { ascending: false }).limit(50),
      ]);

      if (devicesRes.data) setDevices(devicesRes.data as unknown as DeviceFingerprint[]);
      if (assessmentsRes.data) setAssessments(assessmentsRes.data as unknown as RiskAssessment[]);
      if (locationsRes.data) setLocations(locationsRes.data as unknown as LoginLocation[]);
      if (challengesRes.data) setChallenges(challengesRes.data as unknown as AuthChallenge[]);
    } catch (error) {
      console.error('Error fetching AMA data:', error);
      toast.error('Error cargando datos de AMA');
    } finally {
      setLoading(false);
    }
  };

  const toggleDeviceTrust = async (deviceId: string, currentTrust: boolean) => {
    try {
      const { error } = await supabase
        .from('user_device_fingerprints')
        .update({ is_trusted: !currentTrust })
        .eq('id', deviceId);

      if (error) throw error;
      
      toast.success(`Dispositivo ${!currentTrust ? 'marcado como confiable' : 'desmarcado'}`);
      fetchAllData();
    } catch (error) {
      console.error('Error updating device trust:', error);
      toast.error('Error actualizando dispositivo');
    }
  };

  // Calculate statistics
  const stats = {
    totalDevices: devices.length,
    trustedDevices: devices.filter(d => d.is_trusted).length,
    totalAssessments: assessments.length,
    highRiskAssessments: assessments.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length,
    vpnLogins: locations.filter(l => l.is_vpn || l.is_proxy).length,
    uniqueCountries: [...new Set(locations.map(l => l.country_code))].length,
    stepUpRequired: assessments.filter(a => a.requires_step_up).length,
    stepUpCompleted: assessments.filter(a => a.step_up_completed).length,
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Autenticación Multifactor Adaptativa (AMA)
          </h2>
          <p className="text-muted-foreground">
            Gestión de dispositivos, evaluación de riesgo y cumplimiento PSD2/PSD3 • DORA
          </p>
        </div>
        <Button onClick={fetchAllData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDevices}</p>
                <p className="text-xs text-muted-foreground">
                  Dispositivos ({stats.trustedDevices} confiables)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.highRiskAssessments}</p>
                <p className="text-xs text-muted-foreground">
                  Riesgo alto/crítico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Globe className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.uniqueCountries}</p>
                <p className="text-xs text-muted-foreground">
                  Países ({stats.vpnLogins} VPN)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <ShieldCheck className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats.stepUpCompleted}/{stats.stepUpRequired}
                </p>
                <p className="text-xs text-muted-foreground">
                  Step-up completados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="monitoring">
            <Radio className="h-3 w-3 mr-1 animate-pulse text-green-500" />
            ML
          </TabsTrigger>
          <TabsTrigger value="biometrics">
            <Fingerprint className="h-3 w-3 mr-1" />
            Biometría
          </TabsTrigger>
          <TabsTrigger value="aml">
            <Scale className="h-3 w-3 mr-1" />
            AML/Fraude
          </TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="challenges">Desafíos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evaluaciones de Riesgo Recientes</CardTitle>
              <CardDescription>Últimas evaluaciones de sesión del sistema AMA</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Puntuación</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead>Step-up</TableHead>
                    <TableHead>Factores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.slice(0, 10).map((assessment) => (
                    <TableRow key={assessment.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(assessment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRiskBadgeColor(assessment.risk_level)}>
                          {assessment.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                assessment.risk_score >= 60 ? 'bg-red-500' :
                                assessment.risk_score >= 40 ? 'bg-orange-500' :
                                assessment.risk_score >= 20 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${assessment.risk_score}%` }}
                            />
                          </div>
                          <span className="text-sm">{assessment.risk_score}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {assessment.location_data?.isVpn && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">
                              VPN
                            </Badge>
                          )}
                          {assessment.location_data?.city || assessment.location_data?.country || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {assessment.requires_step_up ? (
                          assessment.step_up_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-orange-500" />
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {assessment.risk_factors?.length || 0} factores
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <MonitoringTab assessments={assessments} />
        </TabsContent>

        <TabsContent value="biometrics" className="space-y-4">
          <BiometricsTab />
        </TabsContent>

        <TabsContent value="aml" className="space-y-4">
          <AMLFraudTab />
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dispositivos Registrados</CardTitle>
              <CardDescription>Gestiona los dispositivos de confianza de los usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Última ubicación</TableHead>
                    <TableHead>Accesos</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Laptop className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-xs">{device.device_hash.slice(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {device.os_info?.platform || 'Desconocido'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {device.last_location || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{device.login_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {device.last_seen_at 
                          ? format(new Date(device.last_seen_at), 'dd/MM/yy HH:mm', { locale: es })
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {device.is_trusted ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Confiable
                          </Badge>
                        ) : (
                          <Badge variant="outline">Nuevo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDeviceTrust(device.id, device.is_trusted)}
                        >
                          {device.is_trusted ? 'Desmarcar' : 'Confiar'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ubicaciones de Inicio de Sesión</CardTitle>
              <CardDescription>Historial de geolocalización de accesos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>ISP</TableHead>
                    <TableHead>Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(location.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {location.ip_address || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{getCountryFlag(location.country_code)}</span>
                          {location.country || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{location.city || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-32 truncate">
                        {location.isp || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {location.is_vpn && (
                            <Badge className="text-xs bg-purple-500/10 text-purple-500">VPN</Badge>
                          )}
                          {location.is_proxy && (
                            <Badge className="text-xs bg-orange-500/10 text-orange-500">Proxy</Badge>
                          )}
                          {!location.is_vpn && !location.is_proxy && (
                            <Badge variant="outline" className="text-xs">Normal</Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Desafíos de Autenticación</CardTitle>
              <CardDescription>Step-up authentication y verificaciones OTP</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Intentos</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Expiración</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(challenge.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {challenge.challenge_type === 'otp_email' ? 'OTP Email' : challenge.challenge_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {challenge.verified_at ? (
                          <Badge className="bg-green-500/10 text-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        ) : new Date(challenge.expires_at) < new Date() ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                            Pendiente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{challenge.attempts || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        {challenge.email_sent_at ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(challenge.expires_at), 'HH:mm:ss', { locale: es })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Monitoring Tab Component
function MonitoringTab({ assessments }: { assessments: RiskAssessment[] }) {
  const { startContinuousMonitoring, stopContinuousMonitoring } = useAdaptiveAuth();
  const [localMonitoring, setLocalMonitoring] = useState(false);

  const toggleMonitoring = () => {
    if (localMonitoring) {
      stopContinuousMonitoring();
      setLocalMonitoring(false);
      toast.info('Monitorización continua detenida');
    } else {
      startContinuousMonitoring();
      setLocalMonitoring(true);
      toast.success('Monitorización continua iniciada');
    }
  };

  // Extract risk factors with categories from assessments
  const riskFactorStats = assessments.reduce((acc, a) => {
    a.risk_factors?.forEach(f => {
      const category = (f as any).category || 'behavior';
      if (!acc[category]) acc[category] = { count: 0, totalWeight: 0, factors: [] };
      acc[category].count++;
      acc[category].totalWeight += f.weight;
      if (!acc[category].factors.includes(f.factor)) {
        acc[category].factors.push(f.factor);
      }
    });
    return acc;
  }, {} as Record<string, { count: number; totalWeight: number; factors: string[] }>);

  // Calculate anomaly statistics
  const anomalyAssessments = assessments.filter(a => 
    a.risk_factors?.some(f => f.factor.toLowerCase().includes('anomal') || f.factor.toLowerCase().includes('ml'))
  );
  const velocityAssessments = assessments.filter(a =>
    a.risk_factors?.some(f => f.factor.toLowerCase().includes('velocit') || f.factor.toLowerCase().includes('viaje'))
  );
  const behaviorAssessments = assessments.filter(a =>
    a.risk_factors?.some(f => f.factor.toLowerCase().includes('comportamiento') || f.factor.toLowerCase().includes('behavior'))
  );

  const categoryColors: Record<string, string> = {
    device: 'bg-blue-500',
    location: 'bg-purple-500',
    behavior: 'bg-green-500',
    time: 'bg-orange-500',
    transaction: 'bg-red-500',
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    device: <Fingerprint className="h-4 w-4" />,
    location: <MapPin className="h-4 w-4" />,
    behavior: <Activity className="h-4 w-4" />,
    time: <Clock className="h-4 w-4" />,
    transaction: <Zap className="h-4 w-4" />,
  };

  return (
    <div className="space-y-4">
      {/* Monitoring Status Card */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${localMonitoring ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
                <Radio className={`h-6 w-6 ${localMonitoring ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Monitorización Continua ML</h3>
                <p className="text-sm text-muted-foreground">
                  Detección de anomalías en tiempo real con algoritmos de Machine Learning
                </p>
              </div>
            </div>
            <Button 
              onClick={toggleMonitoring}
              variant={localMonitoring ? "destructive" : "default"}
              className="min-w-32"
            >
              {localMonitoring ? 'Detener' : 'Iniciar'} Monitorización
            </Button>
          </div>
          
          {localMonitoring && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Keyboard className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Velocidad tecleo</p>
                  <p className="font-mono text-sm">Monitorizando...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <MousePointer className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Interacciones</p>
                  <p className="font-mono text-sm">Monitorizando...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Navigation className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Navegación</p>
                  <p className="font-mono text-sm">Monitorizando...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Timer className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Duración sesión</p>
                  <p className="font-mono text-sm">Activa</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Detection Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              Detección ML Anomalías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{anomalyAssessments.length}</p>
            <p className="text-xs text-muted-foreground">
              {((anomalyAssessments.length / Math.max(assessments.length, 1)) * 100).toFixed(1)}% de sesiones
            </p>
            <Progress 
              value={(anomalyAssessments.length / Math.max(assessments.length, 1)) * 100} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Navigation className="h-4 w-4 text-orange-500" />
              Viajes Imposibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{velocityAssessments.length}</p>
            <p className="text-xs text-muted-foreground">
              Detecciones de velocidad anómala
            </p>
            <Progress 
              value={(velocityAssessments.length / Math.max(assessments.length, 1)) * 100} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Patrones Comportamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{behaviorAssessments.length}</p>
            <p className="text-xs text-muted-foreground">
              Análisis de comportamiento
            </p>
            <Progress 
              value={(behaviorAssessments.length / Math.max(assessments.length, 1)) * 100} 
              className="mt-2 h-1" 
            />
          </CardContent>
        </Card>
      </div>

      {/* Risk Factor Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Factores de Riesgo por Categoría
          </CardTitle>
          <CardDescription>
            Distribución de factores detectados por el sistema ML
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(riskFactorStats).length > 0 ? (
              Object.entries(riskFactorStats).map(([category, data]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${categoryColors[category] || 'bg-gray-500'}/20`}>
                        {categoryIcons[category] || <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <span className="font-medium capitalize">{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {data.count} detecciones
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Peso promedio: {(data.totalWeight / data.count).toFixed(1)}
                    </span>
                  </div>
                  <Progress 
                    value={(data.count / Math.max(assessments.length, 1)) * 100} 
                    className="h-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    {data.factors.slice(0, 5).map((factor, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                    {data.factors.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{data.factors.length - 5} más
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos de factores de riesgo aún</p>
                <p className="text-sm">Los factores aparecerán cuando se realicen evaluaciones de riesgo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Anomalies Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anomalías Recientes Detectadas</CardTitle>
          <CardDescription>Últimas detecciones del sistema de ML adaptativo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo Anomalía</TableHead>
                <TableHead>Puntuación</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments
                .filter(a => a.risk_score >= 30)
                .slice(0, 10)
                .map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(assessment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {assessment.risk_factors?.slice(0, 2).map((f, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {f.factor}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-muted-foreground" />
                        <span className={`font-mono ${
                          assessment.risk_score >= 60 ? 'text-red-500' :
                          assessment.risk_score >= 40 ? 'text-orange-500' : 'text-yellow-500'
                        }`}>
                          {assessment.risk_score}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${
                          assessment.risk_level === 'critical' ? 'bg-red-500/10 text-red-500' :
                          assessment.risk_level === 'high' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {assessment.risk_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assessment.requires_step_up ? (
                        <Badge className="bg-purple-500/10 text-purple-500">
                          Step-up requerido
                        </Badge>
                      ) : (
                        <Badge variant="outline">Monitorizado</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {assessments.filter(a => a.risk_score >= 30).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No hay anomalías significativas detectadas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Biometrics Tab Component - Full PSD3 Behavioral Biometrics
function BiometricsTab() {
  const { 
    isCollecting, 
    currentProfile, 
    anomalies, 
    matchScore,
    startCollection, 
    stopCollection, 
    getTypingDNA, 
    getMouseDNA,
    compareWithBaseline 
  } = useBehavioralBiometrics();

  const [comparisonResult, setComparisonResult] = useState<{
    match: boolean;
    score: number;
    anomalies: { type: string; severity: string; description: string }[];
  } | null>(null);

  const handleCompare = async () => {
    const result = await compareWithBaseline();
    setComparisonResult(result);
    if (result.match) {
      toast.success(`Biometría verificada: ${result.score}% coincidencia`);
    } else {
      toast.warning(`Anomalía detectada: ${result.score}% coincidencia`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Collection Control */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isCollecting ? 'bg-green-500/20 animate-pulse' : 'bg-muted'}`}>
                <Fingerprint className={`h-6 w-6 ${isCollecting ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Biometría Comportamental PSD3</h3>
                <p className="text-sm text-muted-foreground">
                  TypingDNA, Mouse DNA, Touch Patterns, Navigation Behavior
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={isCollecting ? stopCollection : startCollection}
                variant={isCollecting ? "destructive" : "default"}
              >
                {isCollecting ? 'Detener' : 'Iniciar'} Captura
              </Button>
              {currentProfile && (
                <Button onClick={handleCompare} variant="outline">
                  <Scan className="h-4 w-4 mr-2" />
                  Comparar Baseline
                </Button>
              )}
            </div>
          </div>

          {isCollecting && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Keyboard className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">TypingDNA</p>
                  <p className="font-mono text-sm text-green-500">Capturando...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <MousePointer className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">MouseDNA</p>
                  <p className="font-mono text-sm text-green-500">Capturando...</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Touch</p>
                  <p className="font-mono text-sm text-green-500">Activo</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Navigation className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Navegación</p>
                  <p className="font-mono text-sm text-green-500">Tracking</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match Score */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              Puntuación Match
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${matchScore >= 70 ? 'text-green-500' : matchScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {matchScore}%
            </p>
            <Progress value={matchScore} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {matchScore >= 70 ? 'Usuario verificado' : matchScore >= 50 ? 'Requiere revisión' : 'Alta discrepancia'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Anomalías Detectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{anomalies.length}</p>
            <p className="text-xs text-muted-foreground">
              {anomalies.filter(a => a.severity === 'critical' || a.severity === 'high').length} críticas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Estado Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">
              {currentProfile ? 'Capturado' : 'Sin datos'}
            </p>
            <p className="text-xs text-muted-foreground">
              {currentProfile?.sessionMetrics?.totalDuration 
                ? `${Math.round(currentProfile.sessionMetrics.totalDuration / 1000)}s sesión`
                : 'Iniciar captura'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Profile Details */}
      {currentProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Perfil Biométrico Actual
            </CardTitle>
            <CardDescription>Huella digital comportamental del usuario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* Typing Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Keyboard className="h-4 w-4" /> TypingDNA
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Intervalo promedio</span>
                    <span className="font-mono">{currentProfile.typing.avgKeyInterval.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hold duration</span>
                    <span className="font-mono">{currentProfile.typing.keyHoldDuration.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Desviación std</span>
                    <span className="font-mono">{currentProfile.typing.stdDeviation.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Digrafos únicos</span>
                    <span className="font-mono">{Object.keys(currentProfile.typing.digraphTimings).length}</span>
                  </div>
                </div>
              </div>

              {/* Mouse Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MousePointer className="h-4 w-4" /> MouseDNA
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Velocidad promedio</span>
                    <span className="font-mono">{currentProfile.mouse.avgSpeed.toFixed(2)} px/ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aceleración</span>
                    <span className="font-mono">{currentProfile.mouse.avgAcceleration.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entropía movimiento</span>
                    <span className={`font-mono ${currentProfile.mouse.movementEntropy < 1.5 ? 'text-red-500' : 'text-green-500'}`}>
                      {currentProfile.mouse.movementEntropy.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scroll velocity</span>
                    <span className="font-mono">{currentProfile.mouse.scrollVelocity.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Anomalies Table */}
      {anomalies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anomalías Comportamentales</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Confianza</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anomalies.map((anomaly, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline">{anomaly.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${
                        anomaly.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                        anomaly.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                        anomaly.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {anomaly.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{anomaly.description}</TableCell>
                    <TableCell>
                      <span className="font-mono">{(anomaly.confidence * 100).toFixed(0)}%</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// AML/Fraud Detection Tab Component
function AMLFraudTab() {
  const {
    isAnalyzing,
    fraudIndicators,
    amlAlerts,
    riskProfile,
    overallFraudScore,
    analyzeTransaction,
    checkAMLCompliance,
    getUserRiskProfile,
    reportSuspiciousActivity
  } = useAMLFraudDetection();

  const [testAmount, setTestAmount] = useState(5000);
  const [testCountry, setTestCountry] = useState('ES');
  const [testResult, setTestResult] = useState<any>(null);
  const [amlResult, setAmlResult] = useState<any>(null);

  const handleTestTransaction = async () => {
    const result = await analyzeTransaction({
      amount: testAmount,
      currency: 'EUR',
      type: 'transfer',
      recipientCountry: testCountry,
      channel: 'web',
      timestamp: new Date()
    });
    setTestResult(result);
    
    if (!result.approved) {
      toast.error(result.blockReason || 'Transacción bloqueada');
    } else if (result.requiresReview) {
      toast.warning('Transacción requiere revisión manual');
    } else {
      toast.success('Transacción aprobada');
    }
  };

  const handleAMLCheck = async () => {
    const result = await checkAMLCompliance(testAmount, testCountry);
    setAmlResult(result);
    
    if (!result.compliant) {
      toast.error('Fallo de compliance AML');
    } else if (result.requiresEnhancedDueDiligence) {
      toast.warning('Requiere Enhanced Due Diligence');
    } else {
      toast.success('Cumple normativa AML');
    }
  };

  useEffect(() => {
    getUserRiskProfile();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-2 border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-500/20">
                <Scale className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Detección AML/Fraude PSD3</h3>
                <p className="text-sm text-muted-foreground">
                  Análisis contextual, velocidad, geolocalización, patrones de transacción
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`${
              overallFraudScore >= 80 ? 'bg-red-500/10 text-red-500' :
              overallFraudScore >= 50 ? 'bg-orange-500/10 text-orange-500' :
              overallFraudScore >= 25 ? 'bg-yellow-500/10 text-yellow-500' :
              'bg-green-500/10 text-green-500'
            }`}>
              Score: {overallFraudScore}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-red-500" />
              Indicadores Fraude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{fraudIndicators.length}</p>
            <p className="text-xs text-muted-foreground">
              {fraudIndicators.filter(f => f.severity === 'critical').length} críticos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileWarning className="h-4 w-4 text-orange-500" />
              Alertas AML
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{amlAlerts.length}</p>
            <p className="text-xs text-muted-foreground">
              {amlAlerts.filter(a => a.severity === 'critical').length} sanciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              KYC Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold capitalize">{riskProfile?.kycStatus || 'pending'}</p>
            <p className="text-xs text-muted-foreground">
              PEP: {riskProfile?.pepStatus ? 'Sí' : 'No'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4 text-purple-500" />
              Riesgo Geográfico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{riskProfile?.geographicRiskScore || 0}%</p>
            <Progress value={riskProfile?.geographicRiskScore || 0} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Test Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Simulador de Transacción
          </CardTitle>
          <CardDescription>Prueba el análisis de fraude y AML</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Monto (EUR)</label>
              <input 
                type="number"
                value={testAmount}
                onChange={(e) => setTestAmount(Number(e.target.value))}
                className="w-full mt-1 p-2 rounded-md border bg-background"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">País Destino</label>
              <select 
                value={testCountry}
                onChange={(e) => setTestCountry(e.target.value)}
                className="w-full mt-1 p-2 rounded-md border bg-background"
              >
                <option value="ES">España</option>
                <option value="FR">Francia</option>
                <option value="AD">Andorra</option>
                <option value="RU">Rusia (Alto riesgo)</option>
                <option value="IR">Irán (Sancionado)</option>
                <option value="KP">Corea del Norte (Sancionado)</option>
                <option value="NG">Nigeria (Alto riesgo)</option>
              </select>
            </div>
            <Button onClick={handleTestTransaction} disabled={isAnalyzing}>
              {isAnalyzing ? 'Analizando...' : 'Analizar Fraude'}
            </Button>
            <Button onClick={handleAMLCheck} variant="outline">
              Check AML
            </Button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`mt-4 p-4 rounded-lg ${
              testResult.approved ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {testResult.approved ? '✓ Transacción Aprobada' : '✗ Transacción Bloqueada'}
                </span>
                <Badge variant="outline">Score: {testResult.score}</Badge>
              </div>
              {testResult.blockReason && (
                <p className="text-sm text-red-500">{testResult.blockReason}</p>
              )}
              {testResult.requiresReview && (
                <p className="text-sm text-yellow-500">⚠ Requiere revisión manual</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fraud Indicators */}
      {fraudIndicators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Indicadores de Fraude Detectados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Recomendación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fraudIndicators.map((indicator, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant="outline">{indicator.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${
                        indicator.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                        indicator.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                        indicator.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                        'bg-green-500/10 text-green-500'
                      }`}>
                        {indicator.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{indicator.score}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{indicator.description}</TableCell>
                    <TableCell className="max-w-xs text-xs text-muted-foreground truncate">
                      {indicator.recommendation}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* AML Alerts */}
      {amlAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas AML</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {amlAlerts.map((alert) => (
                <div key={alert.id} className={`p-4 rounded-lg border ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-500/5' :
                  alert.severity === 'alert' ? 'border-orange-500 bg-orange-500/5' :
                  'border-yellow-500 bg-yellow-500/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={`${
                        alert.severity === 'critical' ? 'bg-red-500' :
                        alert.severity === 'alert' ? 'bg-orange-500' :
                        'bg-yellow-500'
                      } text-white`}>
                        {alert.type.toUpperCase()}
                      </Badge>
                      <span className="font-medium">{alert.description}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">€{alert.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Recomendaciones:</p>
                    <ul className="text-xs space-y-1">
                      {alert.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
