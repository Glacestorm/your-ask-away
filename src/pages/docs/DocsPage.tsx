import React from 'react';
import { DashboardLayout } from '@/layouts';
import { AIDocumentation } from '@/components/documentation';

const DocsPage = () => {
  return (
    <DashboardLayout title="Documentación">
      <div className="p-6">
        <AIDocumentation />
      </div>
    </DashboardLayout>
  );
};

export default DocsPage;
