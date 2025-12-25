import { useLocation, Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, Shield, LayoutGrid } from 'lucide-react';

interface AdminBreadcrumbsProps {
  currentSection?: string;
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/admin': 'Administración',
  '/obelixia-admin': 'ObelixIA Admin',
  '/dashboard': 'Dashboard',
  '/settings': 'Configuración',
};

export function AdminBreadcrumbs({ currentSection, className }: AdminBreadcrumbsProps) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const buildBreadcrumbs = () => {
    const crumbs: { label: string; path: string; isLast: boolean }[] = [];
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip obelixia-admin from breadcrumbs (already shown in header)
      if (currentPath === '/obelixia-admin') return;
      
      let label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      crumbs.push({ label, path: currentPath, isLast });
    });
    
    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        
        {breadcrumbs.map((crumb, index) => (
          <BreadcrumbItem key={crumb.path}>
            <BreadcrumbSeparator />
            {crumb.isLast && !currentSection ? (
              <BreadcrumbPage className="flex items-center gap-1.5">
                {crumb.path === '/admin' && <LayoutGrid className="h-3.5 w-3.5" />}
                {crumb.path === '/obelixia-admin' && <Shield className="h-3.5 w-3.5" />}
                {crumb.label}
              </BreadcrumbPage>
            ) : (
              <BreadcrumbLink asChild>
                <Link to={crumb.path} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  {crumb.path === '/admin' && <LayoutGrid className="h-3.5 w-3.5" />}
                  {crumb.path === '/obelixia-admin' && <Shield className="h-3.5 w-3.5" />}
                  {crumb.label}
                </Link>
              </BreadcrumbLink>
            )}
          </BreadcrumbItem>
        ))}
        
        {currentSection && (
          <BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{currentSection}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AdminBreadcrumbs;
