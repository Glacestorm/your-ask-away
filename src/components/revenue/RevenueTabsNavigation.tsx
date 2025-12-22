import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Zap, 
  BarChart3, 
  Users, 
  PieChart, 
  Activity,
  Brain,
  Shield,
  LineChart,
  Layers,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  icon: typeof BarChart3;
}

interface PhaseData {
  label: string;
  color: string;
  tabs: TabItem[];
}

const phases: Record<string, PhaseData> = {
  core: {
    label: 'Core Analytics',
    color: 'hsl(var(--primary))',
    tabs: [
      { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
      { id: 'expansion', label: 'Expansion', icon: Rocket },
      { id: 'churn', label: 'Churn', icon: Shield },
      { id: 'benchmarks', label: 'Benchmarks', icon: LineChart },
    ]
  },
  analytics: {
    label: 'Advanced',
    color: 'hsl(210, 100%, 60%)',
    tabs: [
      { id: 'cohorts', label: 'Cohorts', icon: Layers },
      { id: 'overview', label: 'Overview', icon: Activity },
      { id: 'forecast', label: 'Forecast', icon: TrendingUp },
      { id: 'ltv', label: 'LTV', icon: Target },
    ]
  },
  intelligence: {
    label: 'AI Intelligence',
    color: 'hsl(280, 100%, 65%)',
    tabs: [
      { id: 'plg', label: 'PLG Signals', icon: Zap },
      { id: 'scoring', label: 'Scoring', icon: Users },
      { id: 'priority', label: 'Priority', icon: PieChart },
      { id: 'attribution', label: 'Attribution', icon: BarChart3 },
      { id: 'montecarlo', label: 'Monte Carlo', icon: Brain },
    ]
  }
};

interface RevenueTabsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const RevenueTabsNavigation: React.FC<RevenueTabsNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleDropdownToggle = (phase: string) => {
    setOpenDropdown(openDropdown === phase ? null : phase);
  };

  const handleTabSelect = (tabId: string) => {
    onTabChange(tabId);
    setOpenDropdown(null);
  };

  const getActivePhase = () => {
    for (const [key, phase] of Object.entries(phases)) {
      if (phase.tabs.some(tab => tab.id === activeTab)) {
        return key;
      }
    }
    return 'core';
  };

  return (
    <div className="flex justify-center gap-3 relative">
      {Object.entries(phases).map(([key, phase]) => {
        const isOpen = openDropdown === key;
        const isActivePhase = getActivePhase() === key;
        const activeTabInPhase = phase.tabs.find(t => t.id === activeTab);
        
        return (
          <div key={key} className="relative">
            {/* Main Button */}
            <motion.button
              onClick={() => handleDropdownToggle(key)}
              className={cn(
                "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer",
                "transition-all duration-300 ease-out",
                "backdrop-blur-xl border",
                isActivePhase || isOpen
                  ? "border-opacity-50 shadow-lg"
                  : "bg-card/40 border-border/30 hover:border-opacity-40 hover:bg-card/60"
              )}
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                borderColor: isActivePhase || isOpen ? phase.color : undefined,
                background: isActivePhase || isOpen 
                  ? `linear-gradient(135deg, ${phase.color}15 0%, ${phase.color}05 100%)` 
                  : undefined,
                boxShadow: isActivePhase || isOpen 
                  ? `0 8px 24px -8px ${phase.color}40, 0 0 0 1px ${phase.color}30` 
                  : undefined,
              }}
              whileHover={{ 
                scale: 1.02,
                rotateX: -2,
                rotateY: 2,
                z: 10,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${phase.color}20 0%, transparent 70%)`,
                }}
              />
              
              {/* Top light reflection */}
              <div className={cn(
                "absolute inset-x-2 top-0.5 h-px rounded-full transition-opacity duration-300",
                "bg-gradient-to-r from-transparent via-white/25 to-transparent",
                isActivePhase || isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-60"
              )} />

              {/* Label */}
              <span 
                className="relative z-10 text-xs font-semibold tracking-wide"
                style={{ color: isActivePhase || isOpen ? phase.color : 'hsl(var(--muted-foreground))' }}
              >
                {phase.label}
              </span>

              {/* Chevron */}
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown 
                  className="h-3.5 w-3.5 transition-colors duration-300"
                  style={{ color: isActivePhase || isOpen ? phase.color : 'hsl(var(--muted-foreground))' }}
                />
              </motion.div>

              {/* Active indicator dot */}
              {isActivePhase && !isOpen && (
                <motion.div
                  className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: phase.color }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  layoutId="activeIndicator"
                />
              )}
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 min-w-[180px]"
                >
                  <div 
                    className="rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden bg-popover"
                    style={{
                      borderColor: `${phase.color}30`,
                      boxShadow: `0 16px 48px -12px ${phase.color}30, 0 0 0 1px ${phase.color}20`,
                    }}
                  >
                    {/* Header glow */}
                    <div 
                      className="h-px w-full"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${phase.color}60, transparent)`,
                      }}
                    />
                    
                    <div className="py-1.5">
                      {phase.tabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        
                        return (
                          <motion.button
                            key={tab.id}
                            onClick={() => handleTabSelect(tab.id)}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-3 py-2 text-left",
                              "transition-all duration-200",
                              isActive 
                                ? "bg-primary/10" 
                                : "hover:bg-muted/50"
                            )}
                          >
                            <div 
                              className={cn(
                                "flex items-center justify-center w-6 h-6 rounded-md transition-all duration-200",
                                isActive ? "bg-primary/20" : "bg-muted/30"
                              )}
                              style={isActive ? { backgroundColor: `${phase.color}20` } : undefined}
                            >
                              <Icon 
                                className="h-3.5 w-3.5"
                                style={{ color: isActive ? phase.color : 'hsl(var(--muted-foreground))' }}
                              />
                            </div>
                            <span 
                              className={cn(
                                "text-xs font-medium transition-colors duration-200",
                                isActive ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {tab.label}
                            </span>
                            
                            {isActive && (
                              <motion.div
                                className="ml-auto w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: phase.color }}
                                layoutId="dropdownActiveIndicator"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      
      {/* Click outside handler */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
};

export default RevenueTabsNavigation;
