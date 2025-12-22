import React from 'react';
import { DashboardLayout } from '@/layouts';
import { GISTerritorialDashboard } from '@/components/gis';

const GISPage = () => {
  return (
    <DashboardLayout title="GIS Territorial">
      <div className="p-6">
        <GISTerritorialDashboard />
      </div>
    </DashboardLayout>
  );
};

export default GISPage;
