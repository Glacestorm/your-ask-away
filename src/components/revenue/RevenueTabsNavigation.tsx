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
    <div className="flex flex-wrap items-center gap-1.5">
      {(Object.keys(groupedTabs) as Array<keyof typeof groupedTabs>).map((phase, phaseIndex) => (
        <React.Fragment key={phase}>
          {/* Phase separator */}
          {phaseIndex > 0 && (
            <div 
              className="h-6 w-px mx-1 opacity-30"
              style={{ backgroundColor: phaseLabels[phase].color }}
            />
          )}
          
          {/* Phase label badge */}
          <span 
            className="text-[7px] font-semibold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border mr-0.5"
            style={{ 
              color: phaseLabels[phase].color,
              borderColor: `${phaseLabels[phase].color}25`,
              background: `${phaseLabels[phase].color}08`
            }}
          >
            {phaseLabels[phase].label}
          </span>
          
          {/* Tab items */}
          {groupedTabs[phase].map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                delay: phaseIndex * 0.03 + index * 0.01,
                type: "spring",
                stiffness: 500,
                damping: 30
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
        </React.Fragment>
      ))}
    </div>
  );
};

export default RevenueTabsNavigation;
