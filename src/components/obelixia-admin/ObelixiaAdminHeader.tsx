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

interface ObelixiaAdminHeaderProps {
  activeTab: string;
  getTabLabel: (tab: string) => string;
  className?: string;
}

export const ObelixiaAdminHeader: React.FC<ObelixiaAdminHeaderProps> = ({
  activeTab,
  getTabLabel,
  className
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {/* Top bar with breadcrumbs and actions */}
      <div className="flex items-center justify-between">
        <AdminBreadcrumbs 
          currentSection={activeTab !== 'quotes' ? getTabLabel(activeTab) : undefined}
          className="text-slate-400"
        />
        <div className="flex items-center gap-2">
          <AdminGlobalSearch />
          <AdminPanelSwitcher />
        </div>
      </div>

      {/* Main header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50 transition-all hover:scale-105"
              title="Atrás"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(1)}
              className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50 transition-all hover:scale-105"
              title="Adelante"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/store')}
              className="h-9 w-9 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-white border border-slate-700/50 transition-all hover:scale-105"
              title="Página Principal"
            >
              <Home className="h-5 w-5" />
            </Button>
            <NewsNotificationSystem />
          </div>
          
          {/* Title with animated logo */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-500 shadow-lg shadow-blue-500/25"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-6 h-6 text-white" />
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </motion.div>
            </motion.div>

            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-[gradient_3s_ease-in-out_infinite]">
                  ObelixIA Team Admin
                </span>
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Panel de gestión interna
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ObelixiaAdminHeader;
