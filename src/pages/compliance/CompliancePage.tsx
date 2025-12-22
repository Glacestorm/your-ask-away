import React from 'react';
import { DashboardLayout } from '@/layouts';
import { ComplianceDashboard, ComplianceFramework, AuditLog } from '@/components/compliance';

const demoFrameworks: ComplianceFramework[] = [
  {
    id: 'gdpr',
    name: 'GDPR',
    code: 'GDPR',
    description: 'Reglamento General de Protección de Datos',
    overallScore: 94,
    status: 'compliant',
    lastAudit: '2024-01-10T00:00:00Z',
    nextAudit: '2024-04-10T00:00:00Z',
    controls: [
      { id: 'g1', code: 'GDPR-1', name: 'Consentimiento explícito', category: 'Datos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'g2', code: 'GDPR-2', name: 'Derecho al olvido', category: 'Derechos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'g3', code: 'GDPR-3', name: 'Portabilidad de datos', category: 'Derechos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 'g4', code: 'GDPR-4', name: 'Notificación de brechas', category: 'Seguridad', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'g5', code: 'GDPR-5', name: 'DPO designado', category: 'Organización', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 'g6', code: 'GDPR-6', name: 'Registro de actividades', category: 'Documentación', status: 'warning', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
    ]
  },
  {
    id: 'pci',
    name: 'PCI-DSS',
    code: 'PCI-DSS',
    description: 'Payment Card Industry Data Security Standard',
    overallScore: 87,
    status: 'partial',
    lastAudit: '2024-01-05T00:00:00Z',
    nextAudit: '2024-07-05T00:00:00Z',
    controls: [
      { id: 'p1', code: 'PCI-1.1', name: 'Firewall configurado', category: 'Red', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'p2', code: 'PCI-2.1', name: 'Cambio de contraseñas default', category: 'Acceso', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'p3', code: 'PCI-3.4', name: 'Encriptación de datos CHD', category: 'Datos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'p4', code: 'PCI-6.5', name: 'Desarrollo seguro', category: 'Desarrollo', status: 'warning', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 'p5', code: 'PCI-8.2', name: 'Autenticación fuerte', category: 'Acceso', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'p6', code: 'PCI-10.1', name: 'Logs de auditoría', category: 'Monitoreo', status: 'failed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
    ]
  },
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    code: 'SOC2',
    description: 'Service Organization Control 2',
    overallScore: 91,
    status: 'compliant',
    lastAudit: '2023-12-01T00:00:00Z',
    nextAudit: '2024-12-01T00:00:00Z',
    controls: [
      { id: 's1', code: 'CC1.1', name: 'Integridad y valores éticos', category: 'Organización', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 's2', code: 'CC2.1', name: 'Comunicación interna', category: 'Comunicación', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 's3', code: 'CC3.1', name: 'Gestión de riesgos', category: 'Riesgos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 's4', code: 'CC4.1', name: 'Monitoreo de controles', category: 'Monitoreo', status: 'warning', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 's5', code: 'CC5.1', name: 'Actividades de control', category: 'Control', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
    ]
  },
  {
    id: 'iso',
    name: 'ISO 27001',
    code: 'ISO27001',
    description: 'Sistema de Gestión de Seguridad de la Información',
    overallScore: 89,
    status: 'compliant',
    lastAudit: '2023-11-15T00:00:00Z',
    nextAudit: '2024-11-15T00:00:00Z',
    controls: [
      { id: 'i1', code: 'A.5', name: 'Políticas de seguridad', category: 'Políticas', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 'i2', code: 'A.6', name: 'Organización de seguridad', category: 'Organización', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: false },
      { id: 'i3', code: 'A.8', name: 'Gestión de activos', category: 'Activos', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'i4', code: 'A.9', name: 'Control de acceso', category: 'Acceso', status: 'passed', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
      { id: 'i5', code: 'A.12', name: 'Seguridad operacional', category: 'Operaciones', status: 'warning', lastChecked: '2024-01-15T10:00:00Z', automatedCheck: true },
    ]
  }
];

const demoAuditLogs: AuditLog[] = [
  { id: '1', action: 'Acceso a datos personales', user: 'juan.perez@empresa.com', timestamp: '2024-01-15T14:30:00Z', resource: 'customers', details: 'Export de 150 registros', riskLevel: 'medium' },
  { id: '2', action: 'Modificación de permisos', user: 'admin@empresa.com', timestamp: '2024-01-15T14:15:00Z', resource: 'roles', details: 'Rol admin actualizado', riskLevel: 'high' },
  { id: '3', action: 'Login exitoso', user: 'maria.garcia@empresa.com', timestamp: '2024-01-15T14:00:00Z', resource: 'auth', details: 'MFA verificado', riskLevel: 'low' },
  { id: '4', action: 'Eliminación de registro', user: 'carlos.ruiz@empresa.com', timestamp: '2024-01-15T13:45:00Z', resource: 'leads', details: 'Lead ID: 12345', riskLevel: 'medium' },
  { id: '5', action: 'Cambio de contraseña', user: 'ana.martinez@empresa.com', timestamp: '2024-01-15T13:30:00Z', resource: 'users', details: 'Cambio voluntario', riskLevel: 'low' },
  { id: '6', action: 'Intento de acceso fallido', user: 'unknown@external.com', timestamp: '2024-01-15T13:15:00Z', resource: 'auth', details: '3 intentos fallidos', riskLevel: 'high' },
];

const CompliancePage = () => {
  return (
    <DashboardLayout title="Compliance">
      <div className="p-6">
        <ComplianceDashboard 
          frameworks={demoFrameworks}
          auditLogs={demoAuditLogs}
          onRunAudit={(id) => console.log('Running audit for', id)}
          onExportReport={(id) => console.log('Exporting report for', id)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CompliancePage;
