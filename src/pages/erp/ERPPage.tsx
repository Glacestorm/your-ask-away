import React from 'react';
import { DashboardLayout } from '@/layouts';
import { ERPModularDashboard } from '@/components/erp';

const ERPPage = () => {
  return (
    <DashboardLayout 
      title="ERP Modular" 
      subtitle="Sistema de gestión empresarial multi-tenant"
    >
      <ERPModularDashboard />
    </DashboardLayout>
  );
};

export default ERPPage;
