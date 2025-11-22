import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Database } from 'lucide-react';
import { toast } from 'sonner';
import { CompaniesManager } from '@/components/admin/CompaniesManager';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { UsersManager } from '@/components/admin/UsersManager';
import { StatusColorsManager } from '@/components/admin/StatusColorsManager';
import { ConceptsManager } from '@/components/admin/ConceptsManager';
import { AuditLogsViewer } from '@/components/admin/AuditLogsViewer';

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/map');
      toast.error('No tienes permisos para acceder a esta página');
    }
  }, [user, isAdmin, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/map')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestión del sistema empresarial</p>
          </div>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="companies" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="companies">Empresas</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="colors">Colores</TabsTrigger>
            <TabsTrigger value="concepts">Conceptos</TabsTrigger>
            <TabsTrigger value="audit">
              <Database className="mr-2 h-4 w-4" />
              Auditoría
            </TabsTrigger>
          </TabsList>

          <TabsContent value="companies">
            <CompaniesManager />
          </TabsContent>

          <TabsContent value="products">
            <ProductsManager />
          </TabsContent>

          <TabsContent value="users">
            <UsersManager />
          </TabsContent>

          <TabsContent value="colors">
            <StatusColorsManager />
          </TabsContent>

          <TabsContent value="concepts">
            <ConceptsManager />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
