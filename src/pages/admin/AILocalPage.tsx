/**
 * Página de IA Local
 * 
 * Dashboard completo para gestionar la IA local del CRM.
 */

import DashboardLayout from '@/layouts/DashboardLayout';
import { AILocalDashboard } from '@/components/admin/ai-local/AILocalDashboard';

export default function AILocalPage() {
  return (
    <DashboardLayout 
      title="IA Local" 
      subtitle="Gestiona la inteligencia artificial local del CRM con Ollama"
    >
      <AILocalDashboard />
    </DashboardLayout>
  );
}
