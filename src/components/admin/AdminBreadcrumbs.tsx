import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Shield, LayoutGrid, ChevronRight } from 'lucide-react';
import React from 'react';

interface AdminBreadcrumbsProps {
  className?: string;
}

export function AdminBreadcrumbs({ className }: AdminBreadcrumbsProps) {
  const location = useLocation();
  
  // Determinar el label e icono base según la ruta
  const getBaseConfig = () => {
    if (location.pathname === '/admin') {
      return { label: 'Administración', icon: <LayoutGrid className="h-3.5 w-3.5" />, path: '/admin' };
    }
    if (location.pathname === '/obelixia-admin') {
      return { label: 'ObelixIA Admin', icon: <Shield className="h-3.5 w-3.5" />, path: '/obelixia-admin' };
    }
    return { label: 'Dashboard', icon: <LayoutGrid className="h-3.5 w-3.5" />, path: '/dashboard' };
  };

  const baseConfig = getBaseConfig();

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Solo mostrar el breadcrumb base - el título de sección ya está en el Header */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={baseConfig.path} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              {baseConfig.icon}
              <span>{baseConfig.label}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AdminBreadcrumbs;
