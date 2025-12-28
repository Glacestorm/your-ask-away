/**
 * ObelixIA Accounting Page
 * Página principal del módulo de contabilidad interna
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/layouts';
import {
  ObelixiaAccountingDashboard,
  ChartOfAccountsManager,
  JournalEntryEditor,
  PartnerManager,
  BankReconciliation
} from '@/components/admin/obelixia-accounting';
import { 
  LayoutDashboard, 
  FolderTree, 
  FileText, 
  Users, 
  Building2 
} from 'lucide-react';

export default function ObelixiaAccountingPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <DashboardLayout title="ObelixIA Accounting">
      <div className="container mx-auto py-6 px-4 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <FolderTree className="h-4 w-4" />
              <span className="hidden sm:inline">Plan Contable</span>
            </TabsTrigger>
            <TabsTrigger value="entries" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Asientos</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Socios</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Bancos</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ObelixiaAccountingDashboard />
          </TabsContent>

          <TabsContent value="chart">
            <ChartOfAccountsManager />
          </TabsContent>

          <TabsContent value="entries">
            <JournalEntryEditor />
          </TabsContent>

          <TabsContent value="partners">
            <PartnerManager />
          </TabsContent>

          <TabsContent value="banking">
            <BankReconciliation />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
