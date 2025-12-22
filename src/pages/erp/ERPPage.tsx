import React from 'react';
import { DashboardLayout } from '@/layouts';
import { ERPDashboard, Transaction, Invoice, Employee, ERPMetrics } from '@/components/erp';

const demoMetrics: ERPMetrics = {
  totalRevenue: 485000,
  totalExpenses: 312000,
  netProfit: 173000,
  pendingInvoices: 12,
  totalEmployees: 45,
  payrollTotal: 180000,
  accountsReceivable: 78500,
  accountsPayable: 34200
};

const demoTransactions: Transaction[] = [
  { id: '1', date: '2024-01-15', description: 'Venta licencias Enterprise', category: 'Ventas', amount: 45000, type: 'income', account: 'Principal', status: 'completed' },
  { id: '2', date: '2024-01-14', description: 'Pago nóminas enero', category: 'Nóminas', amount: 180000, type: 'expense', account: 'Principal', status: 'completed' },
  { id: '3', date: '2024-01-13', description: 'Servicios Cloud AWS', category: 'Infraestructura', amount: 12500, type: 'expense', account: 'Operaciones', status: 'completed' },
  { id: '4', date: '2024-01-12', description: 'Consultoría implementación', category: 'Servicios', amount: 28000, type: 'income', account: 'Principal', status: 'completed' },
  { id: '5', date: '2024-01-11', description: 'Material oficina', category: 'Suministros', amount: 1200, type: 'expense', account: 'Operaciones', status: 'pending' },
  { id: '6', date: '2024-01-10', description: 'Renovación anual cliente A', category: 'Ventas', amount: 65000, type: 'income', account: 'Principal', status: 'completed' },
  { id: '7', date: '2024-01-09', description: 'Seguros empresa', category: 'Seguros', amount: 8500, type: 'expense', account: 'Principal', status: 'completed' },
  { id: '8', date: '2024-01-08', description: 'Formación equipo', category: 'RRHH', amount: 3200, type: 'expense', account: 'RRHH', status: 'completed' },
];

const demoInvoices: Invoice[] = [
  { id: '1', number: 'FAC-2024-0125', client: 'Banco Santander', date: '2024-01-15', dueDate: '2024-02-15', amount: 45000, status: 'pending', items: [] },
  { id: '2', number: 'FAC-2024-0124', client: 'Mapfre Seguros', date: '2024-01-12', dueDate: '2024-02-12', amount: 32000, status: 'paid', items: [] },
  { id: '3', number: 'FAC-2024-0123', client: 'El Corte Inglés', date: '2024-01-10', dueDate: '2024-02-10', amount: 28500, status: 'paid', items: [] },
  { id: '4', number: 'FAC-2024-0122', client: 'Inditex Group', date: '2024-01-08', dueDate: '2024-01-25', amount: 67000, status: 'overdue', items: [] },
  { id: '5', number: 'FAC-2024-0121', client: 'Telefónica', date: '2024-01-05', dueDate: '2024-02-05', amount: 54000, status: 'pending', items: [] },
  { id: '6', number: 'FAC-2024-0120', client: 'Repsol', date: '2024-01-03', dueDate: '2024-02-03', amount: 41000, status: 'paid', items: [] },
];

const demoEmployees: Employee[] = [
  { id: '1', name: 'Carlos García', position: 'CTO', department: 'Tecnología', salary: 85000, startDate: '2020-03-15', status: 'active' },
  { id: '2', name: 'María López', position: 'Head of Sales', department: 'Ventas', salary: 72000, startDate: '2019-06-01', status: 'active' },
  { id: '3', name: 'Juan Martínez', position: 'Senior Developer', department: 'Tecnología', salary: 55000, startDate: '2021-01-10', status: 'active' },
  { id: '4', name: 'Ana Rodríguez', position: 'Marketing Manager', department: 'Marketing', salary: 52000, startDate: '2020-09-20', status: 'active' },
  { id: '5', name: 'Pedro Sánchez', position: 'DevOps Engineer', department: 'Tecnología', salary: 58000, startDate: '2022-02-14', status: 'active' },
  { id: '6', name: 'Laura Fernández', position: 'HR Director', department: 'RRHH', salary: 65000, startDate: '2019-11-05', status: 'active' },
  { id: '7', name: 'Miguel Torres', position: 'Account Executive', department: 'Ventas', salary: 45000, startDate: '2023-03-01', status: 'active' },
  { id: '8', name: 'Elena Ruiz', position: 'Product Manager', department: 'Producto', salary: 62000, startDate: '2021-07-15', status: 'inactive' },
];

const ERPPage = () => {
  return (
    <DashboardLayout title="ERP">
      <div className="p-6">
        <ERPDashboard 
          metrics={demoMetrics}
          transactions={demoTransactions}
          invoices={demoInvoices}
          employees={demoEmployees}
        />
      </div>
    </DashboardLayout>
  );
};

export default ERPPage;
