import React, { useState } from 'react';
import { DashboardLayout } from '@/layouts';
import { EnhancedKanbanBoard, KanbanColumn, KanbanItem } from '@/components/crm';
import { UserCheck, Clock, PhoneCall, FileCheck, Trophy } from 'lucide-react';

const initialColumns: KanbanColumn[] = [
  {
    id: 'nuevo',
    title: 'Nuevo',
    icon: <Clock className="h-4 w-4" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/20',
    items: [
      { id: '1', title: 'Acme Corp', subtitle: 'Interesados en módulo CRM', value: 45000, probability: 30, priority: 'high', dueDate: '2024-01-20', assignee: { id: '1', name: 'Juan García' }, tags: ['Enterprise', 'CRM'] },
      { id: '2', title: 'TechStart', subtitle: 'Demo solicitada', value: 12000, probability: 20, priority: 'medium', dueDate: '2024-01-25', tags: ['Startup', 'Analytics'] },
    ],
    automations: [{ name: 'Auto-asignar lead', isActive: true }]
  },
  {
    id: 'contactado',
    title: 'Contactado',
    icon: <PhoneCall className="h-4 w-4" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50/50 dark:bg-amber-950/20',
    items: [
      { id: '3', title: 'Global Industries', subtitle: 'Llamada programada', value: 85000, probability: 50, priority: 'urgent', dueDate: '2024-01-18', assignee: { id: '2', name: 'María López' }, slaStatus: 'at_risk', isVip: true },
    ],
    automations: [{ name: 'Recordatorio 48h', isActive: true }]
  },
  {
    id: 'propuesta',
    title: 'Propuesta',
    icon: <FileCheck className="h-4 w-4" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/20',
    items: [
      { id: '4', title: 'Retail Plus', subtitle: 'Propuesta enviada', value: 35000, probability: 70, priority: 'high', dueDate: '2024-01-22', assignee: { id: '1', name: 'Juan García' }, automationStatus: 'running' },
      { id: '5', title: 'FinServ SA', subtitle: 'Negociando términos', value: 120000, probability: 75, priority: 'urgent', dueDate: '2024-01-19', assignee: { id: '3', name: 'Carlos Ruiz' }, isVip: true, unreadMessages: 3 },
    ],
  },
  {
    id: 'negociacion',
    title: 'Negociación',
    icon: <UserCheck className="h-4 w-4" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50/50 dark:bg-orange-950/20',
    items: [
      { id: '6', title: 'MediaGroup', subtitle: 'Revisión legal', value: 65000, probability: 85, dueDate: '2024-01-21', assignee: { id: '2', name: 'María López' } },
    ],
  },
  {
    id: 'cerrado',
    title: 'Cerrado',
    icon: <Trophy className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50/50 dark:bg-green-950/20',
    items: [
      { id: '7', title: 'LogiTech', subtitle: '¡Ganado!', value: 48000, probability: 100, assignee: { id: '1', name: 'Juan García' }, tags: ['Enterprise'] },
    ],
  },
];

const KanbanPage = () => {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);

  const handleMoveItem = (itemId: string, fromColumn: string, toColumn: string) => {
    setColumns(prev => {
      const newColumns = [...prev];
      const sourceCol = newColumns.find(c => c.id === fromColumn);
      const destCol = newColumns.find(c => c.id === toColumn);
      
      if (!sourceCol || !destCol) return prev;
      
      const itemIndex = sourceCol.items.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prev;
      
      const [item] = sourceCol.items.splice(itemIndex, 1);
      destCol.items.push(item);
      
      return newColumns;
    });
  };

  const handleItemClick = (item: KanbanItem) => {
    console.log('Item clicked:', item);
  };

  return (
    <DashboardLayout title="CRM Kanban">
      <div className="p-6">
        <EnhancedKanbanBoard 
          columns={columns}
          onMoveItem={handleMoveItem}
          onItemClick={handleItemClick}
          title="Pipeline de Ventas"
        />
      </div>
    </DashboardLayout>
  );
};

export default KanbanPage;
