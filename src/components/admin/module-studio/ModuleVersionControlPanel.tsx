/**
 * ModuleVersionControlPanel - Sistema de versionado, branches y merge
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  RefreshCw, 
  GitBranch,
  GitCommit,
  GitMerge,
  GitPullRequest,
  History,
  RotateCcw,
  Plus,
  Tag,
  ChevronRight,
  Clock,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useModuleVersionControl } from '@/hooks/admin/useModuleVersionControl';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ModuleVersionControlPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleVersionControlPanel({ 
  moduleKey,
  className 
}: ModuleVersionControlPanelProps) {
  const [activeTab, setActiveTab] = useState('versions');
  const [newBranchName, setNewBranchName] = useState('');
  const [showCreateBranch, setShowCreateBranch] = useState(false);

  const {
    isLoading,
    versions,
    branches,
    currentBranch,
    mergeRequests,
    fetchVersions,
    fetchBranches,
    createBranch,
    switchBranch,
    merge,
    rollback
  } = useModuleVersionControl(moduleKey);

  const handleCreateBranch = async () => {
    if (!moduleKey || !newBranchName.trim()) return;
    const result = await createBranch(moduleKey, newBranchName.trim(), undefined, undefined);
    if (result) {
      setNewBranchName('');
      setShowCreateBranch(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    if (!moduleKey) return;
    await rollback(moduleKey, versionId, 'Rollback manual');
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Selecciona un módulo para control de versiones
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Version Control</CardTitle>
              <CardDescription className="text-xs">
                {currentBranch && (
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {currentBranch.name}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fetchVersions(moduleKey)}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="versions" className="text-xs gap-1">
              <Tag className="h-3 w-3" /> Versiones
            </TabsTrigger>
            <TabsTrigger value="branches" className="text-xs gap-1">
              <GitBranch className="h-3 w-3" /> Branches
            </TabsTrigger>
            <TabsTrigger value="merges" className="text-xs gap-1">
              <GitMerge className="h-3 w-3" /> Merge
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="h-3 w-3" /> Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="versions" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className={cn(
                      "p-4 rounded-lg border bg-card transition-colors",
                      version.isLatest && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.isLatest ? "default" : "outline"}>
                          v{version.version}
                        </Badge>
                        {version.isLatest && (
                          <Badge variant="secondary" className="text-xs">Latest</Badge>
                        )}
                        {version.tags && version.tags.length > 0 && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Tag className="h-3 w-3" />
                            {version.tags[0]}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRollback(version.id)}
                        disabled={version.isLatest}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Rollback
                      </Button>
                    </div>
                    <p className="text-sm mb-2">{version.commitMessage || 'Sin mensaje'}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), { locale: es, addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitCommit className="h-3 w-3" />
                        {version.commitHash.slice(0, 7)}
                      </span>
                    </div>
                    {version.changes && version.changes.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Cambios:</p>
                        <div className="flex flex-wrap gap-1">
                          {version.changes.slice(0, 5).map((change, cidx) => (
                            <Badge key={cidx} variant="outline" className="text-xs">
                              {change.type}: {change.field}
                            </Badge>
                          ))}
                          {version.changes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{version.changes.length - 5} más
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {versions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Tag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Sin versiones registradas</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="branches" className="mt-0 space-y-4">
            <div className="flex gap-2">
              {showCreateBranch ? (
                <div className="flex gap-2 flex-1">
                  <Input 
                    placeholder="Nombre del branch..."
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                    Crear
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateBranch(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setShowCreateBranch(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Nuevo Branch
                </Button>
              )}
            </div>

            <ScrollArea className="h-[350px]">
              <div className="space-y-2">
                {branches.map(branch => {
                  const isCurrent = currentBranch?.id === branch.id;
                  return (
                    <div 
                      key={branch.id}
                      className={cn(
                        "p-4 rounded-lg border bg-card cursor-pointer transition-colors hover:bg-muted/50",
                        isCurrent && "border-primary/50 bg-primary/5"
                      )}
                      onClick={() => switchBranch(branch.name)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className={cn(
                            "h-4 w-4",
                            isCurrent ? "text-primary" : "text-muted-foreground"
                          )} />
                          <span className="font-medium">{branch.name}</span>
                          {branch.isDefault && (
                            <Badge variant="secondary" className="text-xs">default</Badge>
                          )}
                          {isCurrent && (
                            <Badge className="text-xs">actual</Badge>
                          )}
                          {branch.isProtected && (
                            <Badge variant="outline" className="text-xs">protegido</Badge>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {branch.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(branch.updatedAt), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {branches.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Sin branches adicionales</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="merges" className="mt-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {mergeRequests.map(mr => (
                  <div 
                    key={mr.id}
                    className="p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GitPullRequest className={cn(
                          "h-4 w-4",
                          mr.status === 'open' && "text-green-500",
                          mr.status === 'merged' && "text-purple-500",
                          mr.status === 'rejected' && "text-red-500"
                        )} />
                        <span className="font-medium">{mr.title}</span>
                        <Badge variant={
                          mr.status === 'open' ? 'default' :
                          mr.status === 'merged' ? 'secondary' : 'destructive'
                        } className="text-xs">
                          {mr.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <span>{mr.sourceBranch}</span>
                      <ChevronRight className="h-4 w-4" />
                      <span>{mr.targetBranch}</span>
                    </div>
                    {mr.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {mr.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {mr.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {mr.changes?.length || 0} cambios
                        </span>
                        {mr.conflicts && mr.conflicts.length > 0 && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <AlertCircle className="h-3 w-3" />
                            {mr.conflicts.length} conflictos
                          </span>
                        )}
                      </div>
                      {mr.status === 'open' && (
                        <Button 
                          size="sm"
                          onClick={() => merge(mr.id)}
                          disabled={mr.conflicts && mr.conflicts.length > 0}
                        >
                          <GitMerge className="h-4 w-4 mr-1" />
                          Merge
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {mergeRequests.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <GitMerge className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">Sin merge requests pendientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Historial de commits completo</p>
              <p className="text-xs mt-2">Próximamente: timeline visual de commits</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ModuleVersionControlPanel;
