/**
 * ModuleSearchCommand - Búsqueda avanzada con Command Palette
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Star, 
  Clock, 
  Code, 
  Rocket, 
  BarChart3, 
  Shield, 
  Store,
  Home,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useModuleStudioFavorites } from '@/hooks/admin/useModuleStudioFavorites';
import { useNavigate } from 'react-router-dom';

interface ModuleSearchCommandProps {
  modules: Array<{
    id: string;
    module_key: string;
    module_name: string;
    description?: string;
    category?: string;
    is_core?: boolean;
  }>;
  selectedModuleKey?: string | null;
  onSelectModule: (moduleKey: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sections = [
  { id: 'hub', label: 'Hub', icon: Home, path: '/obelixia-admin/module-studio' },
  { id: 'development', label: 'Development', icon: Code, path: '/obelixia-admin/module-studio/development' },
  { id: 'operations', label: 'Operations', icon: Rocket, path: '/obelixia-admin/module-studio/operations' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/obelixia-admin/module-studio/analytics' },
  { id: 'governance', label: 'Governance', icon: Shield, path: '/obelixia-admin/module-studio/governance' },
  { id: 'ecosystem', label: 'Ecosystem', icon: Store, path: '/obelixia-admin/module-studio/ecosystem' },
];

export function ModuleSearchCommand({
  modules,
  selectedModuleKey,
  onSelectModule,
  open,
  onOpenChange,
}: ModuleSearchCommandProps) {
  const navigate = useNavigate();
  const { favorites, recent, isFavorite } = useModuleStudioFavorites();

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange]);

  const handleSelectModule = useCallback((moduleKey: string) => {
    onSelectModule(moduleKey);
    onOpenChange(false);
  }, [onSelectModule, onOpenChange]);

  const handleNavigate = useCallback((path: string) => {
    navigate(path + (selectedModuleKey ? `?module=${selectedModuleKey}` : ''));
    onOpenChange(false);
  }, [navigate, selectedModuleKey, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Buscar módulos, secciones..." />
      <CommandList>
        <CommandEmpty>
          <div className="py-6 text-center">
            <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-muted-foreground">No se encontraron resultados</p>
          </div>
        </CommandEmpty>

        {/* Favorites */}
        {favorites.length > 0 && (
          <CommandGroup heading="Favoritos">
            {favorites.slice(0, 5).map((fav) => (
              <CommandItem
                key={fav.moduleKey}
                value={`fav-${fav.moduleKey}`}
                onSelect={() => handleSelectModule(fav.moduleKey)}
                className="gap-2"
              >
                <Star className="h-4 w-4 text-amber-400" />
                <span>{fav.moduleName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recientes">
              {recent.slice(0, 5).map((item) => (
                <CommandItem
                  key={item.moduleKey + item.visitedAt}
                  value={`recent-${item.moduleKey}`}
                  onSelect={() => handleSelectModule(item.moduleKey)}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{item.moduleName}</span>
                  {item.section && (
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {item.section}
                    </Badge>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Sections */}
        <CommandSeparator />
        <CommandGroup heading="Secciones">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <CommandItem
                key={section.id}
                value={`section-${section.label}`}
                onSelect={() => handleNavigate(section.path)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* All Modules */}
        <CommandSeparator />
        <CommandGroup heading={`Módulos (${modules.length})`}>
          {modules.map((mod) => (
            <CommandItem
              key={mod.id}
              value={`module-${mod.module_name} ${mod.module_key}`}
              onSelect={() => handleSelectModule(mod.module_key)}
              className={cn(
                'gap-2',
                selectedModuleKey === mod.module_key && 'bg-primary/10'
              )}
            >
              <Package className="h-4 w-4" />
              <span className="flex-1">{mod.module_name}</span>
              <div className="flex items-center gap-1">
                {isFavorite(mod.module_key) && (
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                )}
                {mod.is_core && (
                  <Badge variant="secondary" className="text-[10px]">Core</Badge>
                )}
                {mod.category && (
                  <Badge variant="outline" className="text-[10px]">{mod.category}</Badge>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export default ModuleSearchCommand;
