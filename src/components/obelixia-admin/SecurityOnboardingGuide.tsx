import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, Key, GitBranch, Lock, AlertTriangle, 
  CheckCircle2, XCircle, Copy, ExternalLink, 
  FileText, Terminal, Eye, EyeOff, RefreshCw,
  Server, Database, Code, Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface SecurityCheck {
  id: string;
  name: string;
  description: string;
  status: 'implemented' | 'pending' | 'warning';
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export const SecurityOnboardingGuide: React.FC = () => {
  const { t } = useLanguage();
  const [showSecrets, setShowSecrets] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const securityChecks: SecurityCheck[] = [
    {
      id: 'env-example',
      name: '.env.example',
      description: 'Plantilla de variables de entorno sin valores sensibles',
      status: 'implemented',
      category: 'configuration',
      priority: 'critical'
    },
    {
      id: 'gitignore-env',
      name: '.env en .gitignore',
      description: 'Archivo .env excluido del control de versiones',
      status: 'warning',
      category: 'configuration',
      priority: 'critical'
    },
    {
      id: 'gitleaks',
      name: 'Gitleaks Pre-commit',
      description: 'Escaneo de secretos en cada commit',
      status: 'implemented',
      category: 'scanning',
      priority: 'critical'
    },
    {
      id: 'semgrep',
      name: 'Semgrep SAST',
      description: 'Análisis estático de seguridad del código',
      status: 'implemented',
      category: 'scanning',
      priority: 'high'
    },
    {
      id: 'github-workflows',
      name: 'GitHub Actions Security',
      description: 'Pipelines CI/CD con escaneo de seguridad',
      status: 'implemented',
      category: 'cicd',
      priority: 'high'
    },
    {
      id: 'github-secrets',
      name: 'GitHub Secrets',
      description: 'Variables sensibles en GitHub Secrets',
      status: 'pending',
      category: 'cicd',
      priority: 'critical'
    },
    {
      id: 'rls-policies',
      name: 'RLS Policies',
      description: 'Políticas de seguridad a nivel de fila en Supabase',
      status: 'implemented',
      category: 'database',
      priority: 'critical'
    },
    {
      id: 'jwt-verification',
      name: 'JWT Edge Functions',
      description: 'Verificación JWT en funciones críticas',
      status: 'implemented',
      category: 'authentication',
      priority: 'critical'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case 'pending':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'implemented':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Implementado</Badge>;
      case 'pending':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Pendiente</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Advertencia</Badge>;
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return <Badge className={colors[priority as keyof typeof colors]}>{priority.toUpperCase()}</Badge>;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const implementedCount = securityChecks.filter(c => c.status === 'implemented').length;
  const totalCount = securityChecks.length;
  const percentage = Math.round((implementedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30">
            <Shield className="h-6 w-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Guía de Seguridad para Desarrolladores</h2>
            <p className="text-slate-400">Configuración, secretos y mejores prácticas</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-emerald-400">{percentage}%</div>
          <p className="text-sm text-slate-400">{implementedCount}/{totalCount} implementado</p>
        </div>
      </motion.div>

      {/* Alert */}
      <Alert className="bg-amber-500/10 border-amber-500/30">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertTitle className="text-amber-400">Importante para Nuevos Desarrolladores</AlertTitle>
        <AlertDescription className="text-slate-300">
          Antes de comenzar a desarrollar, asegúrate de seguir todos los pasos de esta guía. 
          La seguridad es crítica en aplicaciones bancarias.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full bg-slate-800/50">
          <TabsTrigger value="overview" className="text-xs">Resumen</TabsTrigger>
          <TabsTrigger value="setup" className="text-xs">Configuración</TabsTrigger>
          <TabsTrigger value="secrets" className="text-xs">Secretos</TabsTrigger>
          <TabsTrigger value="cicd" className="text-xs">CI/CD</TabsTrigger>
          <TabsTrigger value="checklist" className="text-xs">Checklist</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: 'Archivos Config', value: '4', color: 'blue' },
              { icon: Terminal, label: 'Pre-commit Hooks', value: '2', color: 'emerald' },
              { icon: GitBranch, label: 'GitHub Workflows', value: '3', color: 'purple' },
              { icon: Database, label: 'RLS Policies', value: '48+', color: 'amber' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/80 border-slate-700/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-slate-400">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-emerald-400" />
                Estado de Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityChecks.map((check) => (
                  <div
                    key={check.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <p className="font-medium text-white">{check.name}</p>
                        <p className="text-sm text-slate-400">{check.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(check.priority)}
                      {getStatusBadge(check.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4 mt-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">1. Configurar Variables de Entorno</CardTitle>
              <CardDescription>Copia .env.example a .env y completa los valores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400"># Terminal</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard('cp .env.example .env', 'Comando')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-emerald-400">cp .env.example .env</code>
              </div>
              
              <Alert className="bg-red-500/10 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-slate-300">
                  <strong>NUNCA</strong> commits el archivo .env con valores reales. 
                  Asegúrate de que está en .gitignore.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">2. Instalar Pre-commit Hooks</CardTitle>
              <CardDescription>Activa los hooks de seguridad automáticos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400"># Instalar pre-commit</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard('pip install pre-commit && pre-commit install', 'Comandos')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-emerald-400 block">pip install pre-commit</code>
                <code className="text-emerald-400 block">pre-commit install</code>
              </div>
              
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-slate-300">
                  <strong>Herramientas incluidas:</strong>
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-400">
                  <li>• <span className="text-blue-400">Gitleaks</span> - Detecta secretos en el código</li>
                  <li>• <span className="text-blue-400">Semgrep</span> - Análisis estático de seguridad (SAST)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">3. Verificar Configuración</CardTitle>
              <CardDescription>Ejecuta un test de los hooks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400"># Ejecutar todos los hooks</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => copyToClipboard('pre-commit run --all-files', 'Comando')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="text-emerald-400">pre-commit run --all-files</code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Secrets Tab */}
        <TabsContent value="secrets" className="space-y-4 mt-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-400" />
                Variables de Entorno Requeridas
              </CardTitle>
              <CardDescription>Estas variables deben configurarse en .env local y GitHub Secrets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'VITE_SUPABASE_PROJECT_ID', desc: 'ID del proyecto Supabase', required: true },
                  { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', desc: 'Clave pública (anon key)', required: true },
                  { name: 'VITE_SUPABASE_URL', desc: 'URL del proyecto Supabase', required: true },
                  { name: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Clave de servicio (solo backend)', required: false },
                  { name: 'SEMGREP_APP_TOKEN', desc: 'Token para Semgrep Cloud', required: false }
                ].map((secret) => (
                  <div
                    key={secret.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <Key className="h-4 w-4 text-amber-400" />
                      <div>
                        <code className="text-emerald-400 text-sm">{secret.name}</code>
                        <p className="text-xs text-slate-400">{secret.desc}</p>
                      </div>
                    </div>
                    {secret.required ? (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Requerido</Badge>
                    ) : (
                      <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Opcional</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Configurar GitHub Secrets</CardTitle>
              <CardDescription>Para CI/CD seguro sin exponer credenciales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  Ve a tu repositorio en GitHub
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  Settings → Secrets and variables → Actions
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  Click en "New repository secret"
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-400 font-bold">4.</span>
                  Agrega cada variable listada arriba
                </li>
              </ol>
              
              <Button variant="outline" className="w-full gap-2">
                <ExternalLink className="h-4 w-4" />
                Abrir Documentación GitHub Secrets
              </Button>
            </CardContent>
          </Card>

          <Alert className="bg-purple-500/10 border-purple-500/30">
            <RefreshCw className="h-4 w-4 text-purple-400" />
            <AlertTitle className="text-purple-400">Rotación de Claves</AlertTitle>
            <AlertDescription className="text-slate-300">
              Se recomienda rotar las claves de Supabase cada 90 días. 
              Puedes hacerlo desde el dashboard de Supabase → Settings → API → Regenerate.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* CI/CD Tab */}
        <TabsContent value="cicd" className="space-y-4 mt-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Workflows de GitHub Actions</CardTitle>
              <CardDescription>Pipelines de seguridad automatizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { 
                    name: 'gitleaks.yml', 
                    desc: 'Escaneo de secretos en cada push/PR',
                    status: 'active',
                    triggers: ['push', 'pull_request']
                  },
                  { 
                    name: 'semgrep.yml', 
                    desc: 'Análisis SAST del código',
                    status: 'active',
                    triggers: ['push', 'pull_request']
                  },
                  { 
                    name: 'devsecops.yml', 
                    desc: 'Microsoft Security DevOps + OWASP',
                    status: 'active',
                    triggers: ['push main', 'pull_request']
                  }
                ].map((workflow) => (
                  <div
                    key={workflow.name}
                    className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-purple-400" />
                        <code className="text-emerald-400">{workflow.name}</code>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        Activo
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-2">{workflow.desc}</p>
                    <div className="flex gap-2">
                      {workflow.triggers.map((trigger) => (
                        <Badge key={trigger} variant="outline" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Reglas de Escaneo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <h4 className="font-medium text-blue-400 mb-2">Semgrep Rules</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• p/owasp-top-ten</li>
                    <li>• p/javascript</li>
                    <li>• p/react</li>
                    <li>• p/secrets</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <h4 className="font-medium text-amber-400 mb-2">Gitleaks Patterns</h4>
                  <ul className="text-sm text-slate-400 space-y-1">
                    <li>• API Keys (Supabase, Google, etc.)</li>
                    <li>• JWT Tokens</li>
                    <li>• IBAN / Tarjetas</li>
                    <li>• DNI/NIE</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Checklist de Onboarding</CardTitle>
              <CardDescription>Completa todos los pasos antes de empezar a desarrollar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { task: 'Clonar repositorio', done: true },
                  { task: 'Copiar .env.example a .env', done: false },
                  { task: 'Completar valores en .env', done: false },
                  { task: 'Instalar pre-commit hooks', done: false },
                  { task: 'Verificar hooks con pre-commit run --all-files', done: false },
                  { task: 'Solicitar acceso a Supabase dashboard', done: false },
                  { task: 'Revisar RLS policies existentes', done: false },
                  { task: 'Leer documentación de seguridad bancaria', done: false }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      item.done ? 'bg-emerald-500/20' : 'bg-slate-700'
                    }`}>
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <span className="text-xs text-slate-400">{index + 1}</span>
                      )}
                    </div>
                    <span className={item.done ? 'text-slate-400 line-through' : 'text-white'}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/20">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">¿Necesitas ayuda?</h4>
                  <p className="text-sm text-slate-400">
                    Si tienes dudas sobre la configuración de seguridad, contacta al equipo de seguridad 
                    o revisa la documentación interna en el wiki del proyecto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityOnboardingGuide;
