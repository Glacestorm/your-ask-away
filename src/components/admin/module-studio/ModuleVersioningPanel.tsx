/**
 * ModuleVersioningPanel - Sistema de versionado semántico avanzado
 * Timeline visual, comparación entre versiones, generación de release notes
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  GitBranch, 
  Tag,
  Plus,
  GitCompare,
  FileText,
  Sparkles,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';
import { useModuleVersioning, ModuleVersionInfo } from '@/hooks/admin/useModuleVersioning';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleVersioningPanelProps {
  moduleKey?: string;
  className?: string;
}

export function ModuleVersioningPanel({ moduleKey, className }: ModuleVersioningPanelProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newTag, setNewTag] = useState<'alpha' | 'beta' | 'rc' | 'stable'>('stable');
  const [newChangelog, setNewChangelog] = useState('');
  const [newReleaseNotes, setNewReleaseNotes] = useState('');
  const [compareFrom, setCompareFrom] = useState<string>('');
  const [compareTo, setCompareTo] = useState<string>('');

  const {
    versions,
    latestVersion,
    selectedVersion,
    diff,
    isLoading,
    isGeneratingChangelog,
    fetchVersions,
    createVersion,
    compareVersions,
    suggestNextVersion,
    selectVersion
  } = useModuleVersioning(moduleKey);

  useEffect(() => {
    if (moduleKey) fetchVersions();
  }, [moduleKey, fetchVersions]);

  const handleCreateVersion = async () => {
    if (!newVersion) return;
    const changelog = newChangelog.split('\n').filter(l => l.trim());
    await createVersion(newVersion, newTag, changelog, newReleaseNotes);
    setShowCreateDialog(false);
    setNewVersion('');
    setNewChangelog('');
    setNewReleaseNotes('');
  };

  const handleCompare = async () => {
    if (compareFrom && compareTo) {
      await compareVersions(compareFrom, compareTo);
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'alpha': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'beta': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'rc': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'stable': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!moduleKey) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-12 text-center">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Selecciona un módulo para gestionar versiones</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Versionado</CardTitle>
              <CardDescription className="text-xs">
                {versions.length} versiones · Última: v{latestVersion?.version || '1.0.0'}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" /> Nueva Versión
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Versión</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Versión</label>
                      <Input
                        placeholder="1.2.0"
                        value={newVersion}
                        onChange={(e) => setNewVersion(e.target.value)}
                      />
                      <div className="flex gap-1 mt-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6"
                          onClick={() => setNewVersion(suggestNextVersion(latestVersion?.version || '1.0.0', 'patch'))}
                        >
                          Patch
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6"
                          onClick={() => setNewVersion(suggestNextVersion(latestVersion?.version || '1.0.0', 'minor'))}
                        >
                          Minor
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6"
                          onClick={() => setNewVersion(suggestNextVersion(latestVersion?.version || '1.0.0', 'major'))}
                        >
                          Major
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Tag</label>
                      <Select value={newTag} onValueChange={(v: 'alpha' | 'beta' | 'rc' | 'stable') => setNewTag(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alpha">Alpha</SelectItem>
                          <SelectItem value="beta">Beta</SelectItem>
                          <SelectItem value="rc">Release Candidate</SelectItem>
                          <SelectItem value="stable">Stable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Changelog (uno por línea)</label>
                    <Textarea
                      placeholder="- Fixed bug in login&#10;- Added new feature&#10;- Improved performance"
                      value={newChangelog}
                      onChange={(e) => setNewChangelog(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Release Notes</label>
                    <Textarea
                      placeholder="Descripción detallada de esta versión..."
                      value={newReleaseNotes}
                      onChange={(e) => setNewReleaseNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleCreateVersion} className="w-full">
                    <Tag className="h-4 w-4 mr-2" />
                    Crear Versión
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={() => fetchVersions()} disabled={isLoading} className="h-8 w-8">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Version Comparison */}
        <div className="p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Comparar Versiones</span>
          </div>
          <div className="flex gap-2">
            <Select value={compareFrom} onValueChange={setCompareFrom}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Desde..." />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.version}>v{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={compareTo} onValueChange={setCompareTo}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Hasta..." />
              </SelectTrigger>
              <SelectContent>
                {versions.map(v => (
                  <SelectItem key={v.id} value={v.version}>v{v.version}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleCompare} disabled={!compareFrom || !compareTo}>
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

          {/* Diff Results */}
          <AnimatePresence>
            {diff && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 rounded-lg bg-background border space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span>v{diff.fromVersion} → v{diff.toVersion}</span>
                </div>
                {diff.addedFeatures.length > 0 && (
                  <div>
                    <span className="text-xs text-green-600 font-medium">+ Añadido</span>
                    <ul className="text-xs text-muted-foreground ml-3">
                      {diff.addedFeatures.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                  </div>
                )}
                {diff.removedFeatures.length > 0 && (
                  <div>
                    <span className="text-xs text-red-600 font-medium">- Eliminado</span>
                    <ul className="text-xs text-muted-foreground ml-3">
                      {diff.removedFeatures.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                  </div>
                )}
                {diff.breakingChanges.length > 0 && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <span className="text-xs text-red-600 font-medium">⚠️ Breaking Changes</span>
                    <ul className="text-xs text-red-600/80 ml-3">
                      {diff.breakingChanges.map((f, i) => <li key={i}>• {f}</li>)}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Version Timeline */}
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Sin versiones registradas</p>
              </div>
            ) : (
              versions.map((version, idx) => (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-4 rounded-lg border bg-card cursor-pointer transition-all hover:shadow-md",
                    selectedVersion?.id === version.id && "ring-2 ring-primary"
                  )}
                  onClick={() => selectVersion(version)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">v{version.version}</span>
                      <Badge className={cn("text-xs", getTagColor(version.tag))}>
                        {version.tag}
                      </Badge>
                      {version.isLatest && (
                        <Badge variant="default" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3" /> Latest
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Download className="h-3 w-3" />
                      {version.downloadCount}
                    </div>
                  </div>

                  {version.changelog.length > 0 && (
                    <ul className="text-xs text-muted-foreground space-y-1 mb-2">
                      {version.changelog.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-primary">•</span> {item}
                        </li>
                      ))}
                      {version.changelog.length > 3 && (
                        <li className="text-primary">+{version.changelog.length - 3} más...</li>
                      )}
                    </ul>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(version.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                    <span className="text-muted-foreground/50">por {version.createdBy}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ModuleVersioningPanel;
