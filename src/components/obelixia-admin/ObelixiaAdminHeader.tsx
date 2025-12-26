import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Sparkles, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { AdminPanelSwitcher } from '@/components/admin/AdminPanelSwitcher';
import { AdminGlobalSearch } from '@/components/admin/AdminGlobalSearch';
import NewsNotificationSystem from '@/components/admin/NewsNotificationSystem';
import { cn } from '@/lib/utils';
import type { ObelixiaTheme } from '@/hooks/useObelixiaAdminPreferences';

interface ObelixiaAdminHeaderProps {
  activeTab: string;
  getTabLabel: (tab: string) => string;
  theme?: ObelixiaTheme;
  className?: string;
}

export const ObelixiaAdminHeader: React.FC<ObelixiaAdminHeaderProps> = ({
  activeTab,
  getTabLabel,
  theme = 'dark',
  className
}) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const navButtonClass = cn(
    "h-9 w-9 rounded-xl transition-all hover:scale-105 border",
    isDark 
      ? "bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border-slate-700/50"
      : "bg-white/80 hover:bg-slate-100 text-slate-500 hover:text-slate-900 border-slate-200"
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-3', className)}
    >
      {/* Single unified header row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo + Title */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <motion.div 
            className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/25"
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-5 h-5 text-white" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
            </motion.div>
          </motion.div>

          <div className="hidden sm:block">
            <h1 className={cn(
              "text-lg md:text-xl font-bold",
              isDark ? "text-white" : "text-slate-900"
            )}>
              <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-[gradient_3s_ease-in-out_infinite]">
                ObelixIA Team Admin
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Breadcrumbs */}
        <div className="hidden lg:flex flex-1 justify-center">
          <AdminBreadcrumbs 
            className={isDark ? "text-slate-400" : "text-slate-500"}
          />
        </div>

        {/* Right: Actions grouped logically */}
        <div className="flex items-center gap-2">
          {/* Navigation group */}
          <div className={cn(
            "flex items-center gap-0.5 p-1 rounded-xl",
            isDark ? "bg-slate-800/30" : "bg-slate-100/80"
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/store')}
              className={navButtonClass}
              title="Página Principal"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className={navButtonClass}
              title="Atrás"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(1)}
              className={navButtonClass}
              title="Adelante"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Divider */}
          <div className={cn(
            "w-px h-6",
            isDark ? "bg-slate-700/50" : "bg-slate-300"
          )} />

          {/* Tools group */}
          <div className="flex items-center gap-1.5">
            <AdminGlobalSearch />
            <NewsNotificationSystem />
            <AdminPanelSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile breadcrumbs */}
      <div className="lg:hidden">
        <AdminBreadcrumbs 
          className={isDark ? "text-slate-400" : "text-slate-500"}
        />
      </div>
    </motion.div>
  );
};

export default ObelixiaAdminHeader;
