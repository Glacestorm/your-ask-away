import React from 'react';
import { ChevronDown, LayoutDashboard, PieChart, Target, Users, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TabConfig {
  value: string;
  label: string;
  icon: React.ReactNode;
  visible?: boolean;
}

interface MobileTabsMenuProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  tabs: TabConfig[];
}

const iconMap: Record<string, React.ReactNode> = {
  'mi-panel': <LayoutDashboard className="h-4 w-4" />,
  'analisis': <PieChart className="h-4 w-4" />,
  'objetivos': <Target className="h-4 w-4" />,
  'equipo': <Users className="h-4 w-4" />,
  'herramientas': <Settings className="h-4 w-4" />,
};

export function MobileTabsMenu({ activeTab, onTabChange, tabs }: MobileTabsMenuProps) {
  const activeTabConfig = tabs.find(t => t.value === activeTab);
  const visibleTabs = tabs.filter(t => t.visible !== false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between gap-2 h-12 text-base font-medium bg-background border-border"
        >
          <div className="flex items-center gap-2">
            {iconMap[activeTab] || activeTabConfig?.icon}
            <span>{activeTabConfig?.label || 'Seleccionar'}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-[calc(100vw-2rem)] bg-popover border border-border shadow-lg z-50"
        align="center"
      >
        {visibleTabs.map((tab) => (
          <DropdownMenuItem
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'flex items-center gap-3 py-3 px-4 cursor-pointer',
              activeTab === tab.value && 'bg-accent text-accent-foreground font-medium'
            )}
          >
            {iconMap[tab.value] || tab.icon}
            <span>{tab.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
