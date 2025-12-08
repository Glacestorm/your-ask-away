import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Shield, ShieldAlert, ShieldCheck, Smartphone, MapPin, 
  Clock, AlertTriangle, TrendingUp, Fingerprint, Globe,
  Laptop, Trash2, CheckCircle, XCircle, Eye, RefreshCw
} from 'lucide-react';
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
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
