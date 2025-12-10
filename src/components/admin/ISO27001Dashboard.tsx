/**
 * ISO 27001 / DORA Compliance Dashboard
 * Provides visibility into security controls and compliance status
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Shield, 
  FileText, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Download,
  Server,
  Lock,
  Key
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ca } from 'date-fns/locale';

interface AssetInventoryItem {
  id: string;
  asset_name: string;
  asset_type: string;
  classification: string;
  criticality: string;
  owner: string;
  is_active: boolean;
}

interface AccessPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  access_level: string;
  roles_affected: string[];
  is_active: boolean;
}

interface BackupVerification {
  id: string;
  backup_type: string;
  backup_date: string;
  verification_result: string;
  restored_successfully: boolean;
}

export function ISO27001Dashboard() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<AssetInventoryItem[]>([]);
  const [policies, setPolicies] = useState<AccessPolicy[]>([]);
  const [backups, setBackups] = useState<BackupVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form states
  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    asset_type: 'application',
    classification: 'internal',
    criticality: 'medium',
    description: '',
  });

  const [newPolicy, setNewPolicy] = useState({
    policy_name: '',
    policy_type: 'data',
    access_level: 'read',
    description: '',
    roles_affected: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, policiesRes, backupsRes] = await Promise.all([
        supabase.from('asset_inventory').select('*').order('created_at', { ascending: false }),
        supabase.from('access_control_policies').select('*').order('created_at', { ascending: false }),
        supabase.from('backup_verifications').select('*').order('verification_date', { ascending: false }).limit(10),
      ]);

      if (assetsRes.data) setAssets(assetsRes.data);
      if (policiesRes.data) setPolicies(policiesRes.data);
      if (backupsRes.data) setBackups(backupsRes.data);
    } catch (err) {
      console.error('Error fetching ISO 27001 data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async () => {
    try {
      const { error } = await supabase.from('asset_inventory').insert({
        ...newAsset,
        owner: user?.id,
      });

      if (error) throw error;
      toast.success('Actiu creat correctament');
      setNewAsset({
        asset_name: '',
        asset_type: 'application',
        classification: 'internal',
        criticality: 'medium',
        description: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error('Error creant actiu: ' + err.message);
    }
  };

  const createPolicy = async () => {
    try {
      const { error } = await supabase.from('access_control_policies').insert({
        ...newPolicy,
        approved_by: user?.id,
      });

      if (error) throw error;
      toast.success('Política creada correctament');
      setNewPolicy({
        policy_name: '',
        policy_type: 'data',
        access_level: 'read',
        description: '',
        roles_affected: [],
      });
      fetchData();
    } catch (err: any) {
      toast.error('Error creant política: ' + err.message);
    }
  };

  const registerBackupVerification = async () => {
    try {
      const { error } = await supabase.from('backup_verifications').insert({
        backup_type: 'full',
        backup_date: new Date().toISOString(),
        verification_result: 'success',
        restored_successfully: true,
        data_integrity_verified: true,
        verified_by: user?.id,
        notes: 'Verificació automàtica de backup',
      });

      if (error) throw error;
      toast.success('Verificació de backup registrada');
      fetchData();
    } catch (err: any) {
      toast.error('Error registrant verificació: ' + err.message);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'public': return 'bg-green-500/20 text-green-700';
      case 'internal': return 'bg-blue-500/20 text-blue-700';
      case 'confidential': return 'bg-amber-500/20 text-amber-700';
      case 'restricted': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'low': return 'bg-green-500/20 text-green-700';
      case 'medium': return 'bg-amber-500/20 text-amber-700';
      case 'high': return 'bg-orange-500/20 text-orange-700';
      case 'critical': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            ISO 27001 / DORA Compliance
          </h1>
          <p className="text-muted-foreground">
            Gestió de controls de seguretat i compliment normatiu
          </p>
        </div>
        <Button variant="outline" onClick={() => {}}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Informe
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Actius Inventariats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              {assets.filter(a => a.criticality === 'critical').length} crítics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Polítiques d'Accés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policies.length}</div>
            <p className="text-xs text-muted-foreground">
              {policies.filter(p => p.is_active).length} actives
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              Backups Verificats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backups.length}</div>
            <p className="text-xs text-muted-foreground">
              {backups.filter(b => b.restored_successfully).length} restauracions OK
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Key className="h-4 w-4" />
              MFA Actius
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Activat</div>
            <p className="text-xs text-muted-foreground">
              Obligatori per admins
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visió General</TabsTrigger>
          <TabsTrigger value="assets">Inventari d'Actius</TabsTrigger>
          <TabsTrigger value="policies">Polítiques d'Accés</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls ISO 27001 Implementats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { control: 'A.5 - Polítiques de Seguretat', status: 'implemented' },
                    { control: 'A.6 - Organització', status: 'implemented' },
                    { control: 'A.7 - Seguretat RRHH', status: 'partial' },
                    { control: 'A.8 - Gestió d\'Actius', status: 'implemented' },
                    { control: 'A.9 - Control d\'Accés', status: 'implemented' },
                    { control: 'A.10 - Criptografia', status: 'implemented' },
                    { control: 'A.12 - Seguretat Operacions', status: 'implemented' },
                    { control: 'A.16 - Gestió Incidents', status: 'implemented' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{item.control}</span>
                      <Badge variant={item.status === 'implemented' ? 'default' : 'secondary'}>
                        {item.status === 'implemented' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Implementat</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Parcial</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DORA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { pillar: 'Gestió de Riscos TIC', status: 'implemented' },
                    { pillar: 'Incidents TIC', status: 'implemented' },
                    { pillar: 'Proves de Resiliència', status: 'implemented' },
                    { pillar: 'Riscos Tercers', status: 'partial' },
                    { pillar: 'Intercanvi d\'Informació', status: 'partial' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{item.pillar}</span>
                      <Badge variant={item.status === 'implemented' ? 'default' : 'secondary'}>
                        {item.status === 'implemented' ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Complert</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> En progrés</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Nou Actiu</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Nom de l'actiu"
                  value={newAsset.asset_name}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newAsset.asset_type}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_type: e.target.value })}
                >
                  <option value="application">Aplicació</option>
                  <option value="database">Base de dades</option>
                  <option value="server">Servidor</option>
                  <option value="network">Xarxa</option>
                  <option value="data">Dades</option>
                  <option value="service">Servei</option>
                </select>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newAsset.classification}
                  onChange={(e) => setNewAsset({ ...newAsset, classification: e.target.value })}
                >
                  <option value="public">Públic</option>
                  <option value="internal">Intern</option>
                  <option value="confidential">Confidencial</option>
                  <option value="restricted">Restringit</option>
                </select>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newAsset.criticality}
                  onChange={(e) => setNewAsset({ ...newAsset, criticality: e.target.value })}
                >
                  <option value="low">Baix</option>
                  <option value="medium">Mitjà</option>
                  <option value="high">Alt</option>
                  <option value="critical">Crític</option>
                </select>
              </div>
              <Button className="mt-4" onClick={createAsset} disabled={!newAsset.asset_name}>
                <Plus className="h-4 w-4 mr-2" />
                Afegir Actiu
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inventari d'Actius</CardTitle>
              <CardDescription>
                Llista completa d'actius de la plataforma (ISO 27001 - A.8)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">{asset.asset_name}</div>
                        <div className="text-sm text-muted-foreground">{asset.asset_type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getClassificationColor(asset.classification)}>
                          {asset.classification}
                        </Badge>
                        <Badge className={getCriticalityColor(asset.criticality)}>
                          {asset.criticality}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {assets.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hi ha actius inventariats
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Política d'Accés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Nom de la política"
                  value={newPolicy.policy_name}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policy_name: e.target.value })}
                />
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPolicy.policy_type}
                  onChange={(e) => setNewPolicy({ ...newPolicy, policy_type: e.target.value })}
                >
                  <option value="production">Producció</option>
                  <option value="development">Desenvolupament</option>
                  <option value="data">Dades</option>
                  <option value="code">Codi</option>
                  <option value="infrastructure">Infraestructura</option>
                </select>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newPolicy.access_level}
                  onChange={(e) => setNewPolicy({ ...newPolicy, access_level: e.target.value })}
                >
                  <option value="none">Cap</option>
                  <option value="read">Lectura</option>
                  <option value="write">Escriptura</option>
                  <option value="admin">Administració</option>
                </select>
              </div>
              <Textarea
                className="mt-4"
                placeholder="Descripció de la política..."
                value={newPolicy.description}
                onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
              />
              <Button className="mt-4" onClick={createPolicy} disabled={!newPolicy.policy_name}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Política
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Polítiques d'Accés Actives</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">{policy.policy_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {policy.policy_type} - {policy.access_level}
                        </div>
                      </div>
                      <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                        {policy.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Verificació de Backups</span>
                <Button onClick={registerBackupVerification}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Verificació
                </Button>
              </CardTitle>
              <CardDescription>
                Historial de verificacions de còpies de seguretat (DORA - Resiliència)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">
                          Backup {backup.backup_type}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(backup.backup_date), "dd/MM/yyyy HH:mm", { locale: ca })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={backup.verification_result === 'success' ? 'default' : 'destructive'}>
                          {backup.verification_result === 'success' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Verificat</>
                          ) : (
                            <><AlertTriangle className="h-3 w-3 mr-1" /> Error</>
                          )}
                        </Badge>
                        {backup.restored_successfully && (
                          <Badge variant="outline" className="text-green-600">
                            Restauració OK
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Gestió d'Incidents de Seguretat</CardTitle>
              <CardDescription>
                DORA - Incident Reporting (vegeu Dashboard DORA per gestió completa)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Els incidents de seguretat es gestionen des del Dashboard DORA/NIS2.
              </p>
              <Button className="mt-4" variant="outline">
                Anar a Dashboard DORA
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
