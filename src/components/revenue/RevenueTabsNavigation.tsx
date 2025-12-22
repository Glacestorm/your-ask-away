import React from 'react';
import { motion } from 'framer-motion';
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
  Rocket
} from 'lucide-react';
import Premium3DTabCard from './Premium3DTabCard';

interface TabItem {
  id: string;
  label: string;
  icon: typeof BarChart3;
  phase: 'core' | 'analytics' | 'intelligence';
}

const tabs: TabItem[] = [
  // Core Analytics (Phase 1-2)
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, phase: 'core' },
  { id: 'expansion', label: 'Expansion', icon: Rocket, phase: 'core' },
  { id: 'churn', label: 'Churn', icon: Shield, phase: 'core' },
  { id: 'benchmarks', label: 'Benchmarks', icon: LineChart, phase: 'core' },
  // Advanced Analytics
  { id: 'cohorts', label: 'Cohorts', icon: Layers, phase: 'analytics' },
  { id: 'overview', label: 'Overview', icon: Activity, phase: 'analytics' },
  { id: 'forecast', label: 'Forecast', icon: TrendingUp, phase: 'analytics' },
  { id: 'ltv', label: 'LTV', icon: Target, phase: 'analytics' },
  // AI Intelligence (Phase 3-4)
  { id: 'plg', label: 'PLG Signals', icon: Zap, phase: 'intelligence' },
  { id: 'scoring', label: 'Scoring', icon: Users, phase: 'intelligence' },
  { id: 'priority', label: 'Priority', icon: PieChart, phase: 'intelligence' },
  { id: 'attribution', label: 'Attribution', icon: BarChart3, phase: 'intelligence' },
  { id: 'montecarlo', label: 'Monte Carlo', icon: Brain, phase: 'intelligence' },
];

const phaseLabels = {
  core: { label: 'Core Analytics', color: 'hsl(var(--primary))' },
  analytics: { label: 'Advanced', color: 'hsl(210, 100%, 60%)' },
  intelligence: { label: 'AI Intelligence', color: 'hsl(280, 100%, 65%)' },
};

interface RevenueTabsNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const RevenueTabsNavigation: React.FC<RevenueTabsNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  const groupedTabs = {
    core: tabs.filter(t => t.phase === 'core'),
    analytics: tabs.filter(t => t.phase === 'analytics'),
    intelligence: tabs.filter(t => t.phase === 'intelligence'),
  };

  return (
    <div className="space-y-6">
      {/* Decorative background grid */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {(Object.keys(groupedTabs) as Array<keyof typeof groupedTabs>).map((phase, phaseIndex) => (
        <motion.div 
          key={phase}
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: phaseIndex * 0.1 }}
        >
          {/* Phase Header */}
          <div className="flex items-center gap-3">
            <div 
              className="h-px flex-1 opacity-30"
              style={{ 
                background: `linear-gradient(90deg, ${phaseLabels[phase].color}, transparent)` 
              }}
            />
            <span 
              className="text-[10px] font-semibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border"
              style={{ 
                color: phaseLabels[phase].color,
                borderColor: `${phaseLabels[phase].color}30`,
                background: `${phaseLabels[phase].color}08`
              }}
            >
              {phaseLabels[phase].label}
            </span>
            <div 
              className="h-px flex-1 opacity-30"
              style={{ 
                background: `linear-gradient(90deg, transparent, ${phaseLabels[phase].color})` 
              }}
            />
          </div>
          
          {/* Tab Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {groupedTabs[phase].map((tab, index) => (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  delay: phaseIndex * 0.15 + index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
              >
                <Premium3DTabCard
                  icon={tab.icon}
                  label={tab.label}
                  isActive={activeTab === tab.id}
                  onClick={() => onTabChange(tab.id)}
                  accentColor={phaseLabels[phase].color}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
      
      {/* Bottom reflection effect */}
      <div className="h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
};

export default RevenueTabsNavigation;
