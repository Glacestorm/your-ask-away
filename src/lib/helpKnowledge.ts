// ObelixIA Help Knowledge Base - Accessible by Internal AI Assistant
// This file exports comprehensive knowledge about ObelixIA for AI assistants

export const OBELIXIA_SYSTEM_OVERVIEW = `
ObelixIA es un CRM Bancario Inteligente diseñado específicamente para la gestión de carteras de clientes empresariales en entidades financieras. Combina tecnologías de vanguardia con cumplimiento normativo europeo para ofrecer una solución integral de gestión comercial bancaria.

## ARQUITECTURA DE SOFTWARE

### Stack Tecnológico Principal
- **Frontend**: React 19 + TypeScript + Vite (Build ultra-rápido)
- **Estilos**: Tailwind CSS + Shadcn/UI (Sistema de diseño modular)
- **Estado**: TanStack Query (Caché inteligente + sincronización)
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **IA**: Lovable AI Gateway (Gemini 2.5 Flash/Pro)
- **Mapas**: MapLibre GL + OpenStreetMap + Supercluster

### Patrones de Arquitectura
- **Offline-First**: Service Worker + IndexedDB para operación sin conexión
- **Real-time**: Supabase Realtime para sincronización instantánea
- **RAG (Retrieval-Augmented Generation)**: Embeddings vectoriales para IA contextual
- **Optimistic Locking**: Control de versiones para edición colaborativa
- **RLS (Row-Level Security)**: Seguridad a nivel de fila en base de datos

### Seguridad Implementada
- Autenticación WebAuthn/FIDO2 (Passkeys)
- MFA obligatorio para administradores
- Cifrado AES-256-GCM para datos sensibles
- Sanitización XSS con DOMPurify
- JWT con verificación en Edge Functions
- Audit logging completo
- Biometría comportamental (PSD3)
- Detección AML/Fraude contextual

## REQUISITOS DE HARDWARE

### Cliente (Navegador)
- **Mínimo**: 4GB RAM, CPU dual-core, Chrome 90+/Firefox 88+/Safari 14+
- **Recomendado**: 8GB RAM, CPU quad-core, navegador actualizado
- **Almacenamiento**: 500MB para caché offline

### Servidor (Supabase/Self-hosted)
- **PostgreSQL**: 16GB RAM mínimo, SSD NVMe
- **Edge Functions**: Auto-escalado serverless
- **Storage**: Según volumen de documentos (mínimo 50GB)

### Capacidades Offline
- Caché de datos de empresas y visitas
- Entrada de fichas de visita sin conexión
- Sincronización automática al reconectar
- Tiles de mapa pre-cacheados
`;

export const OBELIXIA_MODULES = [
  {
    name: 'Mapa GIS Empresarial',
    description: 'Sistema de información geográfica para visualización y gestión de cartera de empresas',
    features: [
      'Clustering dinámico para 20,000+ empresas',
      'Capas: OSM, Satélite, 3D',
      'Coloración por estado, vinculación, P&L, visitas',
      'Arrastrar y soltar para reubicar marcadores',
      'Galería de fotos en tooltips',
      'Porcentajes de afiliación bancaria',
      'Planificación de rutas optimizadas'
    ],
    compliance: 100,
    regulations: ['GDPR', 'APDA']
  },
  {
    name: 'Gestión de Empresas',
    description: 'CRUD completo de empresas clientes y potenciales con datos financieros',
    features: [
      'Datos de empresa (CIF, CNAE, dirección)',
      'Contactos múltiples por empresa',
      'Documentos adjuntos',
      'Fotos de establecimiento',
      'Afiliaciones bancarias',
      'Terminales TPV',
      'Vinculación por entidad'
    ],
    compliance: 100,
    regulations: ['GDPR', 'APDA', 'KYC']
  },
  {
    name: 'Fichas de Visita',
    description: 'Formulario de 12 secciones para registro detallado de visitas comerciales',
    features: [
      'Datos de visita (fecha, canal, tipo)',
      'Diagnóstico inicial (checklist)',
      'Situación financiera',
      'Necesidades detectadas',
      'Propuesta de valor',
      'Productos/servicios con importes',
      'Riesgos/Compliance/KYC',
      'Resumen con firma digital',
      'Próximos pasos y recordatorios',
      'Resumen automático por IA'
    ],
    compliance: 100,
    regulations: ['MiFID II', 'PSD2', 'GDPR']
  },
  {
    name: 'Pipeline de Oportunidades',
    description: 'Gestión visual de oportunidades comerciales estilo Kanban',
    features: [
      'Tablero drag-and-drop',
      'Estados: Lead, Cualificado, Propuesta, Negociación, Ganado, Perdido',
      'Valor estimado y probabilidad',
      'Fecha de cierre prevista',
      'Historial de cambios'
    ],
    compliance: 100,
    regulations: ['MiFID II']
  },
  {
    name: 'Módulo Contable',
    description: 'Estados financieros completos según PGC Andorrano',
    features: [
      'Balance de situación',
      'Cuenta de resultados',
      'Estado de flujos de efectivo',
      'Estado de cambios en patrimonio',
      'Notas financieras',
      'Importación PDF con OCR inteligente',
      'Análisis de ratios financieros',
      'Chat RAG financiero con IA',
      '5 ejercicios activos + archivo histórico'
    ],
    compliance: 100,
    regulations: ['IFRS 9', 'PGC Andorra', 'Basel III/IV']
  },
  {
    name: 'Objetivos y Metas',
    description: 'Sistema de gestión de objetivos comerciales por gestor',
    features: [
      'Definición de metas por periodo',
      'Seguimiento de progreso en tiempo real',
      'Alertas de objetivos en riesgo',
      'Comparativas entre gestores',
      'Historial de cumplimiento'
    ],
    compliance: 100,
    regulations: ['MiFID II']
  },
  {
    name: 'Dashboard Unificado',
    description: 'Panel de control con métricas clave y visualizaciones',
    features: [
      'KPIs personalizados por rol',
      'Gráficos de evolución temporal',
      'Ranking de gestores',
      'Alertas y notificaciones',
      'Exportación PowerBI'
    ],
    compliance: 100,
    regulations: ['Basel III/IV']
  },
  {
    name: 'Asistente IA Interno',
    description: 'Chatbot inteligente para consultas internas con voz',
    features: [
      'Consultas sobre clientes, productos, normativas',
      'Entrada y salida por voz',
      'Base de conocimiento actualizable',
      'Auditoría permanente de conversaciones',
      'Detección de contenido sensible'
    ],
    compliance: 100,
    regulations: ['AI Act', 'GDPR', 'DORA']
  },
  {
    name: 'Análisis RFM + ML',
    description: 'Segmentación de clientes con Machine Learning',
    features: [
      'Scoring RFM (Recencia, Frecuencia, Monetario)',
      'Segmentos: Champions, Loyal, At Risk, Lost',
      'Predicción de churn',
      'Estimación CLV',
      'Recomendaciones automatizadas'
    ],
    compliance: 100,
    regulations: ['AI Act', 'GDPR']
  },
  {
    name: 'DORA/NIS2 Compliance',
    description: 'Dashboard de cumplimiento normativo de resiliencia digital',
    features: [
      'Gestión de incidentes de seguridad',
      'Evaluaciones de riesgo',
      'Tests de resiliencia',
      'Proveedores terceros',
      'Simulaciones de estrés automatizadas'
    ],
    compliance: 100,
    regulations: ['DORA', 'NIS2', 'EBA Guidelines']
  },
  {
    name: 'ISO 27001 Dashboard',
    description: 'Panel de cumplimiento ISO 27001 con 114 controles Annex A',
    features: [
      'Estado de cada control',
      'Evidencias y gaps identificados',
      'Acciones correctivas',
      'Porcentaje de cumplimiento por dominio'
    ],
    compliance: 95,
    regulations: ['ISO 27001', 'ISO 27002']
  },
  {
    name: 'Sistema de Notificaciones',
    description: 'Centro de notificaciones con Pub/Sub y webhooks',
    features: [
      '8 canales predefinidos',
      'Suscripciones por usuario y rol',
      'Webhooks para integraciones',
      'Logs de entrega',
      'Notificaciones push'
    ],
    compliance: 100,
    regulations: ['GDPR']
  },
  {
    name: 'Salud del Sistema',
    description: 'Monitorización con auto-remediación IA',
    features: [
      'Diagnósticos automáticos 2x/día',
      '8 módulos monitorizados',
      'Análisis IA de errores',
      'Auto-remediación con ventana de 5 minutos',
      'Rollback manual disponible'
    ],
    compliance: 100,
    regulations: ['DORA', 'NIS2']
  },
  {
    name: 'Documentación Técnica',
    description: 'Generador de documentación comercial y técnica',
    features: [
      'Análisis dinámico del código',
      '4 partes: Resumen, TCO, BCP, Marketing',
      'Exportación PDF profesional',
      'Análisis de competidores',
      'Roadmap de mejoras'
    ],
    compliance: 100,
    regulations: ['ISO 27001']
  }
];

export const OBELIXIA_COMPLIANCE_STATUS = {
  'ISO 27001': { percentage: 95, implemented: 108, total: 114, status: 'En Progreso' },
  'GDPR/RGPD': { percentage: 100, implemented: 99, total: 99, status: 'Completo' },
  'DORA': { percentage: 100, implemented: 41, total: 41, status: 'Completo' },
  'NIS2': { percentage: 100, implemented: 18, total: 18, status: 'Completo' },
  'PSD2/PSD3': { percentage: 100, implemented: 14, total: 14, status: 'Completo' },
  'eIDAS 2.0': { percentage: 90, implemented: 18, total: 20, status: 'En Progreso' },
  'OWASP Top 10': { percentage: 100, implemented: 10, total: 10, status: 'Completo' },
  'Basel III/IV': { percentage: 100, implemented: 12, total: 12, status: 'Completo' },
  'MiFID II': { percentage: 100, implemented: 15, total: 15, status: 'Completo' },
  'APDA Andorra': { percentage: 100, implemented: 25, total: 25, status: 'Completo' },
  'AI Act (EU)': { percentage: 92, implemented: 78, total: 85, status: 'En Progreso' }
};

export const OBELIXIA_MENU_STRUCTURE = {
  'Director Comercial': [
    'Dashboard Unificado',
    'Métricas por Gestor/Oficina',
    'Objetivos Globales',
    'Pipeline Oportunidades',
    'Análisis RFM/ML',
    'Calendario Compartido',
    'Alertas Director',
    'Administración Completa'
  ],
  'Director de Oficina': [
    'Dashboard Oficina',
    'Métricas de Gestores',
    'Objetivos por Gestor',
    'Calendario Oficina',
    'Alertas Oficina',
    'Auditoría de Gestores'
  ],
  'Responsable Comercial': [
    'Dashboard Comercial',
    'Seguimiento Equipos',
    'Objetivos Comerciales',
    'Pipeline',
    'Análisis RFM',
    'Administración'
  ],
  'Gestor': [
    'Mi Dashboard',
    'Mis Empresas',
    'Mapa Cartera',
    'Fichas de Visita',
    'Mis Objetivos',
    'Calendario Personal'
  ],
  'Auditor': [
    'Dashboard Auditoría',
    'Logs de Auditoría',
    'Fichas de Visita (solo lectura)',
    'Informes KPI',
    'Normativa'
  ]
};

export const OBELIXIA_FAQ = [
  {
    question: '¿Cómo puedo ver mis empresas asignadas?',
    answer: 'Accede al Mapa desde el menú lateral o desde la tarjeta "Mapa" en tu dashboard. El mapa mostrará automáticamente las empresas de tu cartera asignada.'
  },
  {
    question: '¿Cómo registro una visita comercial?',
    answer: 'Desde el dashboard, pulsa "Crear Ficha" o accede a Visitas > Nueva Ficha. Completa las 12 secciones del formulario incluyendo diagnóstico, necesidades detectadas, productos propuestos y próximos pasos.'
  },
  {
    question: '¿Puedo trabajar sin conexión a internet?',
    answer: 'Sí, ObelixIA tiene capacidad offline. Puedes consultar datos de empresas, crear fichas de visita y ver el mapa con tiles cacheados. Los cambios se sincronizarán automáticamente al recuperar conexión.'
  },
  {
    question: '¿Cómo funciona el asistente IA?',
    answer: 'El asistente puede responder preguntas sobre clientes, productos, normativas y procedimientos. Puedes escribir o hablar. Las conversaciones se guardan para auditoría según normativa bancaria.'
  },
  {
    question: '¿Qué significan los colores en el mapa?',
    answer: 'Los colores dependen del modo seleccionado: por Estado (verde=activo, rojo=inactivo), por Vinculación (gradiente según %), por P&L (verde=beneficios, rojo=pérdidas), por Visitas (según frecuencia).'
  },
  {
    question: '¿Cómo importo datos contables?',
    answer: 'En el módulo Contabilidad, selecciona la empresa y ejercicio. Puedes introducir datos manualmente o usar "Importar PDF" para que la IA extraiga automáticamente los valores del balance y cuenta de resultados.'
  },
  {
    question: '¿Quién puede ver mis datos?',
    answer: 'Los gestores solo ven sus empresas asignadas. Los directores de oficina ven datos de su oficina. Los directores comerciales y responsables comerciales tienen visión global. Los auditores tienen acceso de solo lectura para supervisión.'
  },
  {
    question: '¿Cómo configuro recordatorios de visitas?',
    answer: 'Al crear o editar una ficha de visita, en la sección "Próximos Pasos" puedes añadir acciones con fechas. El sistema enviará recordatorios automáticos por email y notificación.'
  },
  {
    question: '¿Qué es el análisis RFM?',
    answer: 'RFM significa Recencia, Frecuencia y valor Monetario. Es una técnica de segmentación que clasifica clientes en grupos como Champions, Loyal, At Risk, etc., para priorizar acciones comerciales.'
  },
  {
    question: '¿Cómo se garantiza la seguridad de los datos?',
    answer: 'ObelixIA implementa: cifrado AES-256, autenticación WebAuthn/Passkeys, MFA obligatorio para admins, RLS en base de datos, audit logging completo, y cumplimiento GDPR/DORA/ISO27001.'
  }
];

// Export all knowledge as a single string for AI context
export function getFullHelpKnowledge(): string {
  let knowledge = OBELIXIA_SYSTEM_OVERVIEW + '\n\n';
  
  knowledge += '## MÓDULOS DEL SISTEMA\n\n';
  OBELIXIA_MODULES.forEach(module => {
    knowledge += `### ${module.name}\n`;
    knowledge += `${module.description}\n`;
    knowledge += `Cumplimiento: ${module.compliance}% | Normativas: ${module.regulations.join(', ')}\n`;
    knowledge += `Funcionalidades:\n${module.features.map(f => `- ${f}`).join('\n')}\n\n`;
  });
  
  knowledge += '## ESTADO DE CUMPLIMIENTO NORMATIVO\n\n';
  Object.entries(OBELIXIA_COMPLIANCE_STATUS).forEach(([reg, data]) => {
    knowledge += `- ${reg}: ${data.percentage}% (${data.implemented}/${data.total}) - ${data.status}\n`;
  });
  
  knowledge += '\n## ESTRUCTURA DE MENÚS POR ROL\n\n';
  Object.entries(OBELIXIA_MENU_STRUCTURE).forEach(([role, menus]) => {
    knowledge += `### ${role}\n${menus.map(m => `- ${m}`).join('\n')}\n\n`;
  });
  
  knowledge += '## PREGUNTAS FRECUENTES\n\n';
  OBELIXIA_FAQ.forEach(faq => {
    knowledge += `**P: ${faq.question}**\nR: ${faq.answer}\n\n`;
  });
  
  return knowledge;
}
