import React from 'react';
import { DashboardLayout } from '@/layouts';
import { MultichannelSLADashboard } from '@/components/crm/omnichannel';

const demoSlaConfigs = [
  { id: '1', name: 'Estándar', channel: 'all' as const, firstResponseMinutes: 30, resolutionMinutes: 480, priority: 'normal' as const },
  { id: '2', name: 'WhatsApp Premium', channel: 'whatsapp' as const, firstResponseMinutes: 5, resolutionMinutes: 60, priority: 'high' as const },
  { id: '3', name: 'Urgente', channel: 'all' as const, firstResponseMinutes: 5, resolutionMinutes: 30, priority: 'urgent' as const },
];

const demoAgentMetrics = [
  { id: 'a1', name: 'Juan Pérez', activeConversations: 8, resolvedToday: 23, avgResponseTime: 4, avgResolutionTime: 45, slaCompliance: 94, csat: 4.7, channels: ['whatsapp', 'instagram'] },
  { id: 'a2', name: 'Laura Sánchez', activeConversations: 5, resolvedToday: 18, avgResponseTime: 6, avgResolutionTime: 52, slaCompliance: 88, csat: 4.5, channels: ['facebook', 'web'] },
  { id: 'a3', name: 'Carlos Ruiz', activeConversations: 12, resolvedToday: 31, avgResponseTime: 3, avgResolutionTime: 38, slaCompliance: 97, csat: 4.9, channels: ['whatsapp'] },
  { id: 'a4', name: 'Ana Martínez', activeConversations: 6, resolvedToday: 15, avgResponseTime: 8, avgResolutionTime: 65, slaCompliance: 76, csat: 4.2, channels: ['instagram', 'facebook'] },
];

const demoChannelMetrics = [
  { channel: 'WhatsApp', totalConversations: 450, openConversations: 28, avgWaitTime: 2, avgResponseTime: 4, slaCompliance: 95, csat: 4.8 },
  { channel: 'Instagram', totalConversations: 180, openConversations: 12, avgWaitTime: 8, avgResponseTime: 12, slaCompliance: 82, csat: 4.3 },
  { channel: 'Facebook', totalConversations: 95, openConversations: 5, avgWaitTime: 15, avgResponseTime: 18, slaCompliance: 78, csat: 4.1 },
  { channel: 'Web Chat', totalConversations: 220, openConversations: 15, avgWaitTime: 1, avgResponseTime: 3, slaCompliance: 98, csat: 4.6 },
];

const demoGlobalMetrics = {
  totalOpen: 60,
  totalResolved: 87,
  avgWaitTime: 5,
  avgResponseTime: 8,
  slaCompliance: 89,
  csat: 4.5
};

const SLADashboardPage = () => {
  return (
    <DashboardLayout title="SLAs y Métricas">
      <div className="p-6">
        <MultichannelSLADashboard 
          slaConfigs={demoSlaConfigs}
          agentMetrics={demoAgentMetrics}
          channelMetrics={demoChannelMetrics}
          globalMetrics={demoGlobalMetrics}
        />
      </div>
    </DashboardLayout>
  );
};

export default SLADashboardPage;
