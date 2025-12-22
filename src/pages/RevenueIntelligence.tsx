import React from 'react';
import RevenueIntelligenceHub from '@/components/revenue/RevenueIntelligenceHub';
import DashboardLayout from '@/layouts/DashboardLayout';

const RevenueIntelligence: React.FC = () => {
  return (
    <DashboardLayout 
      title="Revenue Intelligence Hub"
      subtitle="Analítica avanzada de ingresos con IA"
    >
      <RevenueIntelligenceHub />
    </DashboardLayout>
  );
};

export default RevenueIntelligence;
