/**
 * AutomationEnginePage - Fase 9
 * Página del Motor de Automatización
 */

import { DashboardLayout } from '@/layouts';
import AutomationEngineDashboard from '@/components/admin/automation/AutomationEngineDashboard';

export default function AutomationEnginePage() {
  return (
    <DashboardLayout title="Motor de Automatización" subtitle="Workflows, reglas, notificaciones y tareas">
      <AutomationEngineDashboard />
    </DashboardLayout>
  );
}
