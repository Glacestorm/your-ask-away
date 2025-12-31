import React from 'react';
import { DashboardLayout } from '@/layouts';
import { ERPModularDashboard } from '@/components/erp';

const ERPPage = () => {
  return (
    <DashboardLayout title="ERP Modular">
      <div className="p-6">
        <ERPModularDashboard />
      </div>
    </DashboardLayout>
  );
};

export default ERPPage;
