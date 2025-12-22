import React from 'react';
import { DashboardLayout } from '@/layouts';
import { RevenueIntelligenceDashboard } from '@/components/revenue';

const RevenuePage = () => {
  return (
    <DashboardLayout title="Revenue Intelligence">
      <div className="p-6">
        <RevenueIntelligenceDashboard />
      </div>
    </DashboardLayout>
  );
};

export default RevenuePage;
