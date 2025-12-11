import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, X, Search, Book, FileQuestion, Lightbulb, 
  ChevronRight, ChevronDown, RefreshCw, FileDown, 
  Home, Users, MapPin, Calendar, BarChart3, Calculator,
  Shield, Bell, Settings, Database, Sparkles, Check,
  Building2, Target, TrendingUp, FileText, Bot, Info,
  Cpu, HardDrive, Server, Globe, Lock, Eye, Layers,
  FileCheck, AlertTriangle, CheckCircle2, Percent, MessageSquarePlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import { SuggestionBox } from './SuggestionBox';

interface HelpModule {
  id: string;
  title: string;
  icon: any;
  description: string;
  sections: HelpSection[];
}

interface HelpSection {
  id: string;
  title: string;
  content: string;
  faqs?: FAQ[];
  tips?: string[];
}

interface FAQ {
  question: string;
  answer: string;
}

// Comprehensive ObelixIA System Information
const obelixiaSystemInfo = {
  overview: {
    title: 'ObelixIA - CRM Bancario Inteligente',
    tagline: 'Sistema integral de gestión de cartera bancaria con inteligencia artificial',
    version: '8.0.0',
    description: `ObelixIA es una plataforma empresarial de gestión de relaciones con clientes (CRM) específicamente diseñada para el sector bancario. Combina la gestión tradicional de cartera con capacidades avanzadas de inteligencia artificial, cumplimiento normativo europeo y análisis financiero en tiempo real.

El sistema permite a los gestores bancarios administrar su cartera de empresas, planificar visitas comerciales, analizar estados financieros, gestionar oportunidades de venta y cumplir con todas las normativas regulatorias aplicables (ISO 27001, GDPR, DORA, NIS2, PSD2/PSD3, MiFID II, etc.).`,
    targetUsers: [
      'Gestores Bancarios (Relationship Managers)',
      'Directores de Oficina',
      'Directores Comerciales',
      'Responsables Comerciales',
      'Auditores Internos',
      'Equipos de Compliance'
    ],
    keyBenefits: [
      'Reducción del 60% en tiempo de gestión administrativa',
      'Incremento del 40% en productividad comercial',
      'Cumplimiento normativo automatizado al 95%+',
      'Análisis predictivo de riesgo y oportunidades',
      'Trazabilidad completa de todas las interacciones',
      'Integración con sistemas bancarios core (Temenos, etc.)'
    ]
  },
  software: {
    title: 'Arquitectura de Software',
    stack: [
      { name: 'Frontend', tech: 'React 19 + TypeScript + Vite', description: 'Interfaz de usuario moderna, responsive y accesible' },
      { name: 'Estilos', tech: 'Tailwind CSS + Shadcn/UI', description: 'Sistema de diseño consistente con temas personalizables' },
      { name: 'Estado', tech: 'React Query + Context API', description: 'Gestión de estado optimizada con caché inteligente' },
      { name: 'Backend', tech: 'Supabase (PostgreSQL)', description: 'Base de datos relacional con Row Level Security' },
      { name: 'API', tech: 'Edge Functions (Deno)', description: 'Funciones serverless para lógica de negocio' },
      { name: 'Autenticación', tech: 'Supabase Auth + WebAuthn', description: 'MFA, passkeys y autenticación biométrica' },
      { name: 'IA', tech: 'Lovable AI Gateway (Gemini 2.5)', description: 'Procesamiento de lenguaje natural y análisis predictivo' },
      { name: 'Mapas', tech: 'MapLibre GL', description: 'Visualización geográfica con clustering' },
      { name: 'PDFs', tech: 'jsPDF + jspdf-autotable', description: 'Generación de documentos profesionales' },
      { name: 'Gráficos', tech: 'Recharts', description: 'Visualización de datos interactiva' }
    ],
    architecture: `La aplicación sigue una arquitectura moderna de Single Page Application (SPA) con las siguientes características:

**Capas de la Aplicación:**
1. **Presentación (UI)**: Componentes React reutilizables con Tailwind CSS
2. **Lógica de Negocio**: Hooks personalizados y servicios
3. **Acceso a Datos**: React Query + Supabase Client
4. **Backend**: PostgreSQL + Edge Functions + RLS

**Patrones Implementados:**
- Component-Based Architecture
- Custom Hooks Pattern
- Repository Pattern para datos
- Observer Pattern (Realtime)
- Command Pattern (Actions)
- Factory Pattern (Generadores)`,
    security: [
      'Encriptación AES-256-GCM para datos sensibles',
      'Row Level Security (RLS) en todas las tablas',
      'JWT tokens con rotación automática',
      'HTTPS/TLS obligatorio',
      'Sanitización XSS con DOMPurify',
      'Validación de entrada en cliente y servidor',
      'Audit logging completo',
      'Rate limiting en Edge Functions'
    ]
  },
  hardware: {
    title: 'Requisitos de Hardware',
    client: {
      title: 'Dispositivos Cliente',
      minimum: [
        'Procesador: Dual-core 2.0 GHz o superior',
        'RAM: 4 GB mínimo',
        'Almacenamiento: 500 MB disponibles (caché)',
        'Pantalla: Resolución mínima 1280x720',
        'Conexión: Banda ancha 10 Mbps'
      ],
      recommended: [
        'Procesador: Quad-core 2.5 GHz o superior',
        'RAM: 8 GB o superior',
        'Almacenamiento: 1 GB disponible (caché offline)',
        'Pantalla: Full HD 1920x1080 o superior',
        'Conexión: Banda ancha 50+ Mbps'
      ],
      browsers: [
        'Google Chrome 100+ (Recomendado)',
        'Mozilla Firefox 100+',
        'Microsoft Edge 100+',
        'Safari 15+ (macOS/iOS)'
      ]
    },
    server: {
      title: 'Infraestructura Servidor (Cloud)',
      specs: [
        'PostgreSQL 15+ con extensiones pgvector, pg_cron',
        'Edge Functions: Deno Runtime aislado',
        'CDN global para assets estáticos',
        'Almacenamiento: S3-compatible (ilimitado)',
        'Balanceo de carga automático',
        'Auto-scaling según demanda'
      ],
      capacity: [
        'Usuarios simultáneos: 500-1000+ (optimizado)',
        'Empresas gestionadas: 20,000+ por instancia',
        'Visitas mensuales: Sin límite',
        'Almacenamiento documentos: Configurable',
        'Retención audit logs: 7 años (configurable)'
      ]
    },
    offline: {
      title: 'Capacidades Offline',
      features: [
        'Service Worker para caché de recursos',
        'IndexedDB para datos locales',
        'Sincronización progresiva al reconectar',
        'Notificaciones offline encoladas',
        'Mapas pre-cacheados por zona'
      ]
    }
  },
  modules: [
    {
      id: 'dashboard',
      name: 'Dashboard Principal',
      description: 'Centro de control con métricas KPI en tiempo real, accesos rápidos y notificaciones',
      compliance: 95,
      regulations: ['GDPR', 'ISO 27001'],
      features: ['Métricas en tiempo real', 'Filtros por período/gestor/oficina', 'Notificaciones push', 'Widgets configurables'],
      dependencies: ['Empresas', 'Visitas', 'Objetivos', 'Notificaciones'],
      menuPath: '/admin → Dashboard'
    },
    {
      id: 'companies',
      name: 'Gestión de Empresas',
      description: 'Administración completa del portfolio de clientes y prospectos con datos financieros',
      compliance: 92,
      regulations: ['GDPR', 'KYC', 'AML', 'ISO 27001'],
      features: ['CRUD completo', 'Importación Excel', 'Geocodificación automática', 'Detección duplicados', 'Vinculación bancaria', 'Documentos/Fotos'],
      dependencies: ['Mapa', 'Contabilidad', 'Visitas', 'Pipeline'],
      menuPath: '/admin → Empresas'
    },
    {
      id: 'visits',
      name: 'Gestión de Visitas',
      description: 'Planificación, registro y seguimiento de visitas comerciales con fichas detalladas',
      compliance: 94,
      regulations: ['GDPR', 'MiFID II', 'ISO 27001'],
      features: ['Calendario compartido', 'Fichas de visita 12 secciones', 'Firma digital', 'Resumen IA', 'Recordatorios automáticos'],
      dependencies: ['Empresas', 'Productos', 'Notificaciones'],
      menuPath: '/admin → Visitas'
    },
    {
      id: 'map',
      name: 'Mapa Geográfico',
      description: 'Visualización GIS del portfolio con clustering, rutas optimizadas y análisis territorial',
      compliance: 90,
      regulations: ['GDPR'],
      features: ['3 capas de mapa', 'Clustering inteligente', 'Filtros avanzados', 'Drag-to-relocate', 'Planificación rutas', 'Heatmaps'],
      dependencies: ['Empresas', 'Visitas'],
      menuPath: '/admin → Mapa'
    },
    {
      id: 'accounting',
      name: 'Contabilidad',
      description: 'Estados financieros PGC, análisis de ratios, scoring crediticio y RAG financiero',
      compliance: 96,
      regulations: ['IFRS 9', 'Basel III/IV', 'ISO 27001'],
      features: ['Balance/PyG/Flujos/ECPN', 'Import PDF con IA', 'Ratios automáticos', 'Z-Score Altman', 'Rating bancario', 'RAG Chat'],
      dependencies: ['Empresas', 'IA'],
      menuPath: '/admin → Comptabilitat'
    },
    {
      id: 'pipeline',
      name: 'Pipeline Oportunidades',
      description: 'Gestión del embudo de ventas con tablero Kanban y predicción de cierre',
      compliance: 88,
      regulations: ['GDPR', 'MiFID II'],
      features: ['Tablero Kanban', 'Drag & drop', 'Probabilidad de cierre', 'Valor ponderado', 'Alertas estancamiento'],
      dependencies: ['Empresas', 'Productos', 'Visitas'],
      menuPath: '/admin → Pipeline'
    },
    {
      id: 'goals',
      name: 'Objetivos y Metas',
      description: 'Definición, asignación y seguimiento de objetivos comerciales con cascada',
      compliance: 91,
      regulations: ['ISO 27001'],
      features: ['Objetivos por métrica/período', 'Cascada jerárquica', 'Progreso en tiempo real', 'Alertas de riesgo', 'Histórico'],
      dependencies: ['Dashboard', 'Visitas', 'Notificaciones'],
      menuPath: '/admin → Objetivos'
    },
    {
      id: 'rfm',
      name: 'Análisis RFM',
      description: 'Segmentación de clientes por Recencia, Frecuencia y Valor Monetario',
      compliance: 94,
      regulations: ['GDPR', 'ISO 27001'],
      features: ['Scoring RFM automático', '5 segmentos', 'Políticas por segmento', 'Acciones recomendadas'],
      dependencies: ['Empresas', 'Visitas'],
      menuPath: '/admin → Anàlisi RFM'
    },
    {
      id: 'ml-segmentation',
      name: 'Segmentación ML',
      description: 'Segmentación avanzada con Machine Learning, predicción de churn y CLV',
      compliance: 92,
      regulations: ['GDPR', 'AI Act', 'ISO 27001'],
      features: ['SVM/CART clustering', 'Predicción churn', 'Customer Lifetime Value', 'Árboles de decisión'],
      dependencies: ['Empresas', 'RFM', 'IA'],
      menuPath: '/admin → Segmentació ML'
    },
    {
      id: 'dora-nis2',
      name: 'DORA/NIS2',
      description: 'Panel de cumplimiento de resiliencia operativa digital y seguridad de redes',
      compliance: 98,
      regulations: ['DORA', 'NIS2'],
      features: ['Gestión incidentes', 'Evaluaciones riesgo', 'Pruebas resiliencia', 'Proveedores terceros', 'Stress tests'],
      dependencies: ['System Health', 'Notificaciones'],
      menuPath: '/admin → DORA/NIS2'
    },
    {
      id: 'iso27001',
      name: 'ISO 27001',
      description: 'Panel de cumplimiento de los 114 controles del Anexo A de ISO 27001',
      compliance: 97,
      regulations: ['ISO 27001'],
      features: ['14 dominios', '114 controles', 'Evidencias', 'Gaps', 'Plan corrección', 'Certificación'],
      dependencies: ['Audit Logs', 'System Health'],
      menuPath: '/admin → ISO 27001'
    },
    {
      id: 'ai-assistant',
      name: 'Asistente IA Interno',
      description: 'Chatbot inteligente para consultas sobre clientes, normativa y procedimientos',
      compliance: 94,
      regulations: ['GDPR', 'AI Act', 'APDA'],
      features: ['Chat texto/voz', 'Base conocimiento', 'Contextos múltiples', 'Audit trail permanente'],
      dependencies: ['Empresas', 'Productos', 'IA'],
      menuPath: '/admin → Assistent IA'
    },
    {
      id: 'financial-rag',
      name: 'RAG Financiero',
      description: 'Chat con contexto de documentos financieros usando Retrieval-Augmented Generation',
      compliance: 95,
      regulations: ['GDPR', 'AI Act', 'IFRS 9'],
      features: ['Embeddings vectoriales', 'Búsqueda semántica', 'Respuestas contextuales', 'Citas de fuentes'],
      dependencies: ['Contabilidad', 'IA'],
      menuPath: '/admin → Comptabilitat → RAG Chat'
    },
    {
      id: 'notifications',
      name: 'Centro de Notificaciones',
      description: 'Sistema Pub/Sub con webhooks para alertas, recordatorios y eventos',
      compliance: 93,
      regulations: ['GDPR', 'ISO 27001'],
      features: ['8 canales', 'Suscripciones por rol', 'Webhooks HMAC', 'Histórico entregas'],
      dependencies: ['Todos los módulos'],
      menuPath: '/admin → Notificacions'
    },
    {
      id: 'system-health',
      name: 'System Health',
      description: 'Monitorización de salud del sistema con diagnósticos automáticos e intervenciones IA',
      compliance: 96,
      regulations: ['DORA', 'ISO 27001'],
      features: ['Diagnósticos 8 módulos', 'Checks programados', 'AI auto-remediation', 'Rollback', 'Alertas email'],
      dependencies: ['Edge Functions', 'Notificaciones'],
      menuPath: '/admin → System Health'
    },
    {
      id: 'audit-logs',
      name: 'Audit Logs',
      description: 'Registro completo de auditoría de todas las acciones del sistema',
      compliance: 99,
      regulations: ['GDPR', 'ISO 27001', 'DORA', 'MiFID II'],
      features: ['Registro automático', 'IP/User Agent', 'Antes/Después', 'Filtros avanzados', 'Export'],
      dependencies: ['Todos los módulos'],
      menuPath: '/admin → Audit Logs'
    }
  ],
  regulations: [
    { id: 'iso27001', name: 'ISO 27001', compliance: 97, description: 'Sistema de Gestión de Seguridad de la Información', status: 'Complert' },
    { id: 'gdpr', name: 'GDPR', compliance: 95, description: 'Reglamento General de Protección de Datos', status: 'Complert' },
    { id: 'dora', name: 'DORA', compliance: 98, description: 'Resiliencia Operativa Digital', status: 'Complert' },
    { id: 'nis2', name: 'NIS2', compliance: 96, description: 'Seguridad de Redes y Sistemas de Información', status: 'Complert' },
    { id: 'psd2', name: 'PSD2/PSD3', compliance: 94, description: 'Directiva de Servicios de Pago', status: 'En Progrés' },
    { id: 'mifid2', name: 'MiFID II', compliance: 92, description: 'Mercados de Instrumentos Financieros', status: 'En Progrés' },
    { id: 'basel', name: 'Basel III/IV', compliance: 90, description: 'Requisitos de Capital Bancario', status: 'En Progrés' },
    { id: 'ifrs9', name: 'IFRS 9', compliance: 93, description: 'Instrumentos Financieros (Contabilidad)', status: 'Complert' },
    { id: 'aiact', name: 'EU AI Act', compliance: 92, description: 'Reglamento de Inteligencia Artificial', status: 'En Progrés' },
    { id: 'eidas', name: 'eIDAS 2.0', compliance: 88, description: 'Identidad Digital y Servicios de Confianza', status: 'En Progrés' },
    { id: 'apda', name: 'APDA (Andorra)', compliance: 96, description: 'Protección de Datos de Andorra', status: 'Complert' },
    { id: 'owasp', name: 'OWASP Top 10', compliance: 98, description: 'Seguridad de Aplicaciones Web', status: 'Complert' }
  ],
  menuStructure: {
    title: 'Estructura de Menús',
    description: 'Navegación completa de la aplicación por rol de usuario',
    roles: [
      {
        role: 'Gestor',
        access: ['Dashboard Personal', 'Mis Empresas', 'Mis Visitas', 'Mapa (zona asignada)', 'Mis Objetivos', 'Perfil'],
        restricted: ['Admin', 'Configuración', 'Usuarios', 'Audit Logs']
      },
      {
        role: 'Director Oficina',
        access: ['Dashboard Oficina', 'Empresas Oficina', 'Visitas Oficina', 'Mapa Oficina', 'Objetivos Equipo', 'Métricas Gestores', 'Calendario Compartido'],
        restricted: ['Admin Global', 'Configuración Sistema', 'Usuarios Otras Oficinas']
      },
      {
        role: 'Director Comercial',
        access: ['Dashboard Global', 'Todas Empresas', 'Todas Visitas', 'Mapa Completo', 'Objetivos Globales', 'Admin Panel Completo', 'Configuración', 'Reportes'],
        restricted: []
      },
      {
        role: 'Responsable Comercial',
        access: ['Acceso equivalente a Director Comercial', 'Panel de Auditoría de Responsables'],
        restricted: []
      },
      {
        role: 'Auditor',
        access: ['Audit Logs (solo lectura)', 'Conversaciones Asistente IA', 'Historial Acciones'],
        restricted: ['Modificación de datos', 'Configuración', 'Admin funcional']
      },
      {
        role: 'Superadmin',
        access: ['Acceso completo a todos los módulos', 'Selector de Visión (ver como otros roles)', 'Configuración Sistema', 'Edge Functions'],
        restricted: []
      }
    ]
  }
};

const helpModules: HelpModule[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    icon: Home,
    description: 'Centro de control con métricas, KPIs y acceso rápido a funcionalidades',
    sections: [
      {
        id: 'overview',
        title: 'Visión General',
        content: `El Dashboard Principal es el punto de entrada a ObelixIA. Desde aquí puedes:

• **Métricas en tiempo real**: Visualiza KPIs clave como visitas realizadas, objetivos cumplidos, y empresas gestionadas.
• **Accesos rápidos**: Navega directamente a cualquier módulo del sistema.
• **Notificaciones**: Recibe alertas sobre eventos importantes y tareas pendientes.
• **Filtros personalizados**: Ajusta la vista por período, gestor u oficina.

El dashboard se actualiza automáticamente cada 30 segundos para mostrar datos en tiempo real.`,
        faqs: [
          {
            question: '¿Cómo personalizo mi dashboard?',
            answer: 'Puedes arrastrar y reorganizar las tarjetas según tus preferencias. Los cambios se guardan automáticamente en tu perfil.'
          },
          {
            question: '¿Por qué no veo todas las métricas?',
            answer: 'Las métricas visibles dependen de tu rol. Los gestores ven sus propias métricas, mientras que directores ven datos agregados de su equipo.'
          }
        ],
        tips: [
          'Usa el selector de período para comparar métricas entre diferentes rangos de fechas.',
          'Haz clic en cualquier métrica para ver el desglose detallado.'
        ]
      }
    ]
  },
  {
    id: 'companies',
    title: 'Gestión de Empresas',
    icon: Building2,
    description: 'Administración completa del portfolio de empresas y clientes',
    sections: [
      {
        id: 'company-list',
        title: 'Listado de Empresas',
        content: `El módulo de empresas permite gestionar todo el portfolio de clientes y prospectos:

**Funcionalidades principales:**
• **Búsqueda avanzada**: Filtra por nombre, sector, CNAE, estado, gestor asignado, y más.
• **Vista de tarjetas/tabla**: Cambia entre vistas según tu preferencia.
• **Paginación inteligente**: Navega eficientemente por grandes volúmenes de datos.
• **Exportación**: Descarga datos en Excel o PDF.

**Tipos de cliente:**
- Cliente: Empresa con relación comercial activa
- Potencial: Prospecto sin productos contratados`,
        faqs: [
          {
            question: '¿Cómo asigno una empresa a un gestor?',
            answer: 'Edita la empresa y selecciona el gestor en el campo "Gestor Asignado". Solo administradores pueden cambiar asignaciones.'
          },
          {
            question: '¿Qué significa el indicador VIP?',
            answer: 'Las empresas VIP tienen prioridad en el seguimiento y aparecen destacadas en todas las vistas.'
          }
        ],
        tips: [
          'Usa la importación masiva Excel para cargar múltiples empresas a la vez.',
          'El sistema detecta y alerta sobre empresas duplicadas automáticamente.'
        ]
      },
      {
        id: 'company-detail',
        title: 'Detalle de Empresa',
        content: `La ficha de empresa contiene toda la información relevante:

**Datos generales:**
• Razón social, CIF/NIF, dirección, contacto
• Sector, CNAE, forma jurídica
• Facturación anual, número de empleados

**Vinculación bancaria:**
• Porcentaje de operaciones con cada entidad
• Productos contratados
• Histórico de transacciones

**Documentos y fotos:**
• Subida y gestión de documentos asociados
• Galería fotográfica del establecimiento

**Contactos:**
• Múltiples contactos por empresa
• Contacto principal destacado`,
        faqs: [
          {
            question: '¿Cómo subo documentos a una empresa?',
            answer: 'En la ficha de empresa, pestaña "Documentos", haz clic en "Subir documento" y selecciona el archivo. Formatos soportados: PDF, Word, Excel, imágenes.'
          }
        ]
      }
    ]
  },
  {
    id: 'visits',
    title: 'Gestión de Visitas',
    icon: Calendar,
    description: 'Planificación, registro y seguimiento de visitas comerciales',
    sections: [
      {
        id: 'visit-planning',
        title: 'Planificación de Visitas',
        content: `El sistema de visitas permite gestionar toda la actividad comercial:

**Crear visita:**
1. Selecciona la empresa a visitar
2. Elige fecha y hora
3. Define el tipo de visita (presencial, teléfono, videoconferencia)
4. Añade notas previas si es necesario

**Tipos de visita:**
• **Primera visita**: Primer contacto con prospecto
• **Seguimiento**: Visita de mantenimiento a cliente
• **Presentación**: Demostración de productos/servicios
• **Cierre**: Negociación final

**Estados:**
- Programada: Visita planificada pendiente
- Realizada: Visita completada
- Cancelada: Visita anulada
- Reprogramada: Fecha modificada`,
        faqs: [
          {
            question: '¿Cómo registro el resultado de una visita?',
            answer: 'Al completar una visita, selecciona el resultado (exitosa, pendiente, sin interés) y añade las notas del encuentro.'
          },
          {
            question: '¿Puedo programar visitas recurrentes?',
            answer: 'Sí, al crear la visita activa la opción "Recurrente" y define la frecuencia (semanal, mensual, trimestral).'
          }
        ]
      },
      {
        id: 'visit-sheets',
        title: 'Fichas de Visita',
        content: `Las fichas de visita documentan detalladamente cada encuentro comercial:

**Secciones de la ficha:**
1. **Datos de la visita**: Fecha, hora, duración, canal, tipo
2. **Datos del cliente**: Información auto-completada de la empresa
3. **Diagnóstico inicial**: Estado actual del cliente
4. **Situación financiera**: Datos económicos relevantes
5. **Necesidades detectadas**: Oportunidades identificadas
6. **Propuesta de valor**: Soluciones presentadas
7. **Productos ofrecidos**: Con importes estimados
8. **Riesgos/Compliance/KYC**: Aspectos regulatorios
9. **Resumen**: Notas del encuentro
10. **Próximos pasos**: Acciones acordadas
11. **Evaluación potencial**: Valoración de la oportunidad
12. **Recordatorios**: Tareas de seguimiento

**Firma digital:**
El cliente puede firmar la ficha directamente en pantalla táctil o con el ratón.`,
        tips: [
          'Usa el botón de resumen IA para generar automáticamente un resumen de la visita.',
          'Las fichas completadas se pueden exportar a PDF para archivo.'
        ]
      }
    ]
  },
  {
    id: 'map',
    title: 'Mapa Geográfico',
    icon: MapPin,
    description: 'Visualización geográfica del portfolio y planificación de rutas',
    sections: [
      {
        id: 'map-view',
        title: 'Vista del Mapa',
        content: `El mapa interactivo muestra la distribución geográfica de empresas:

**Capas disponibles:**
• **Calle**: Vista estándar de calles
• **Satélite**: Imagen satelital
• **3D**: Vista tridimensional del terreno

**Marcadores:**
Los marcadores muestran información visual del estado de cada empresa:
- Color según estado comercial
- Tamaño según volumen de facturación
- Icono según sector

**Clustering:**
En zonas con alta densidad, las empresas se agrupan en clusters que muestran el número de empresas. Haz zoom para expandir.

**Panel lateral:**
Muestra detalles de la empresa seleccionada con acceso rápido a:
- Ficha completa
- Programar visita
- Ver histórico`,
        faqs: [
          {
            question: '¿Cómo muevo una empresa en el mapa?',
            answer: 'Mantén pulsado el marcador durante 2 segundos y arrástralo a la nueva ubicación. Se actualizarán las coordenadas automáticamente.'
          }
        ]
      },
      {
        id: 'route-planning',
        title: 'Planificación de Rutas',
        content: `El planificador de rutas optimiza tus desplazamientos:

**Crear ruta:**
1. Selecciona las empresas a visitar
2. Define el punto de inicio
3. El sistema calcula la ruta óptima

**Optimización:**
El algoritmo considera:
- Distancia entre puntos
- Tiempo estimado de cada visita
- Horarios de apertura
- Tráfico en tiempo real

**Exportación:**
Puedes exportar la ruta a Google Maps o Apple Maps para navegación.`
      }
    ]
  },
  {
    id: 'goals',
    title: 'Objetivos y Metas',
    icon: Target,
    description: 'Definición y seguimiento de objetivos comerciales',
    sections: [
      {
        id: 'goal-types',
        title: 'Tipos de Objetivos',
        content: `El sistema soporta múltiples tipos de objetivos:

**Por métrica:**
• Visitas realizadas
• Nuevas altas de clientes
• Productos vendidos
• Volumen de facturación
• TPV instalados

**Por período:**
• Diarios
• Semanales
• Mensuales
• Trimestrales
• Anuales

**Por alcance:**
• Individual (gestor)
• Equipo (oficina)
• Global (banco)

**Cascada de objetivos:**
Los objetivos pueden heredarse jerárquicamente, distribuyendo metas globales entre equipos y gestores.`,
        faqs: [
          {
            question: '¿Quién puede crear objetivos?',
            answer: 'Solo usuarios con rol de director o responsable comercial pueden crear y asignar objetivos.'
          },
          {
            question: '¿Cómo se calculan los logros?',
            answer: 'El sistema calcula automáticamente el progreso basándose en los datos reales registrados (visitas, ventas, etc.).'
          }
        ]
      }
    ]
  },
  {
    id: 'accounting',
    title: 'Contabilidad',
    icon: Calculator,
    description: 'Gestión de estados financieros y análisis económico',
    sections: [
      {
        id: 'financial-statements',
        title: 'Estados Financieros',
        content: `El módulo contable gestiona estados financieros según el PGC:

**Tipos de estados:**
• Balance de situación
• Cuenta de resultados
• Estado de flujos de efectivo
• Estado de cambios en patrimonio neto

**Modelos soportados:**
• Normal: Estados completos
• Abreviado: Para PYMES
• Simplificado: Para microempresas

**Funcionalidades:**
- Entrada manual de datos
- Importación automática desde PDF
- Cálculo automático de ratios
- Comparativa multi-ejercicio
- Análisis de tendencias`,
        faqs: [
          {
            question: '¿Cómo importo datos desde un PDF?',
            answer: 'En la ficha contable de la empresa, haz clic en "Importar PDF". El sistema usa IA para extraer y mapear los datos automáticamente.'
          }
        ]
      },
      {
        id: 'financial-analysis',
        title: 'Análisis Financiero',
        content: `Herramientas avanzadas de análisis financiero:

**Ratios automáticos:**
• Liquidez (corriente, rápida, tesorería)
• Solvencia (endeudamiento, autonomía)
• Rentabilidad (ROE, ROA, margen)
• Actividad (rotación activos)

**Análisis especiales:**
• Pirámide DuPont
• Z-Score de Altman
• Rating bancario interno
• NOF y Fondo de Maniobra
• EBIT/EBITDA

**Exportación:**
Genera informes completos en PDF con gráficos y análisis narrativo.`
      }
    ]
  },
  {
    id: 'pipeline',
    title: 'Pipeline de Oportunidades',
    icon: TrendingUp,
    description: 'Gestión del embudo de ventas y oportunidades comerciales',
    sections: [
      {
        id: 'pipeline-board',
        title: 'Tablero Kanban',
        content: `El pipeline visualiza el embudo de ventas:

**Etapas predefinidas:**
1. **Prospección**: Oportunidad identificada
2. **Calificación**: Evaluando potencial
3. **Propuesta**: Oferta presentada
4. **Negociación**: En proceso de cierre
5. **Cerrada-Ganada**: Venta completada
6. **Cerrada-Perdida**: Oportunidad perdida

**Tarjetas de oportunidad:**
Cada tarjeta muestra:
- Empresa y contacto
- Valor estimado
- Probabilidad de cierre
- Fecha prevista de cierre
- Productos asociados

**Interacción:**
Arrastra las tarjetas entre columnas para actualizar el estado.`,
        tips: [
          'El valor ponderado del pipeline se calcula multiplicando el valor por la probabilidad de cada etapa.',
          'Configura alertas para oportunidades que lleven mucho tiempo sin movimiento.'
        ]
      }
    ]
  },
  {
    id: 'security',
    title: 'Seguridad y Compliance',
    icon: Shield,
    description: 'Cumplimiento normativo, auditoría y seguridad del sistema',
    sections: [
      {
        id: 'dora-nis2',
        title: 'DORA/NIS2',
        content: `Panel de cumplimiento normativo europeo:

**DORA (Digital Operational Resilience Act):**
• Gestión de incidentes de seguridad
• Evaluaciones de riesgo TIC
• Pruebas de resiliencia
• Gestión de proveedores terceros

**NIS2 (Network and Information Security):**
• Análisis de vulnerabilidades
• Planes de continuidad
• Notificación de incidentes
• Auditorías de seguridad

**Dashboard de compliance:**
Visualiza el estado de cumplimiento con porcentajes y acciones pendientes para cada regulación.`,
        faqs: [
          {
            question: '¿Cómo registro un incidente de seguridad?',
            answer: 'Ve a DORA/NIS2 > Incidentes > Nuevo incidente. Completa el formulario con la descripción, impacto y acciones tomadas.'
          }
        ]
      },
      {
        id: 'iso27001',
        title: 'ISO 27001',
        content: `Panel de cumplimiento ISO 27001 con los 114 controles del Anexo A:

**Dominios:**
• A.5 Políticas de seguridad
• A.6 Organización
• A.7 Seguridad del personal
• A.8 Gestión de activos
• A.9 Control de acceso
• A.10 Criptografía
• A.11 Seguridad física
• A.12 Seguridad operativa
• A.13 Comunicaciones
• A.14 Desarrollo
• A.15 Proveedores
• A.16 Incidentes
• A.17 Continuidad
• A.18 Cumplimiento

Cada control muestra estado de implementación, evidencias y acciones correctivas.`
      }
    ]
  },
  {
    id: 'ai-assistant',
    title: 'Asistente IA Interno',
    icon: Bot,
    description: 'Chatbot inteligente para consultas y asistencia',
    sections: [
      {
        id: 'chat-usage',
        title: 'Uso del Chat',
        content: `El asistente IA responde consultas sobre el sistema y datos:

**Tipos de consultas:**
• **Clientes**: "¿Cuántas empresas tengo en el sector retail?"
• **Normativa**: "¿Qué dice la regulación sobre KYC?"
• **Productos**: "Explícame las características del préstamo empresarial"
• **Procedimientos**: "¿Cómo proceso una alta de cliente?"

**Entrada por voz:**
Activa el micrófono para dictar consultas. El sistema transcribe y responde automáticamente.

**Respuesta por voz:**
Activa "Auto-hablar" para que el asistente lea las respuestas en voz alta.

**Base de conocimiento:**
El asistente accede a documentos cargados por administradores para respuestas más precisas.`,
        faqs: [
          {
            question: '¿Mis conversaciones son privadas?',
            answer: 'Las conversaciones se almacenan para auditoría según normativa bancaria (GDPR/APDA). Solo auditores autorizados pueden acceder al historial.'
          }
        ]
      }
    ]
  },
  {
    id: 'reports',
    title: 'Informes y Exportación',
    icon: FileText,
    description: 'Generación de informes y exportación de datos',
    sections: [
      {
        id: 'report-types',
        title: 'Tipos de Informes',
        content: `El sistema genera múltiples tipos de informes:

**Informes operativos:**
• Resumen de actividad diaria/semanal/mensual
• Listado de visitas por período
• Estado del pipeline
• Objetivos vs. logros

**Informes analíticos:**
• Análisis de cartera
• Segmentación de clientes
• Predicciones ML
• Tendencias y evolución

**Informes regulatorios:**
• Auditoría de actividad
• Cumplimiento normativo
• Incidentes de seguridad

**Formatos de exportación:**
• PDF (informes formateados)
• Excel (datos tabulados)
• CSV (datos planos)`,
        tips: [
          'Programa informes periódicos para recibirlos automáticamente por email.',
          'Los informes PDF incluyen gráficos y resúmenes ejecutivos.'
        ]
      }
    ]
  }
];

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isAnalyzingAbout, setIsAnalyzingAbout] = useState(false);
  const [isGeneratingAboutPdf, setIsGeneratingAboutPdf] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    const saved = localStorage.getItem('help_last_update');
    if (saved) setLastUpdate(saved);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredModules = helpModules.filter(module => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.title.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.sections.some(s => 
        s.title.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query) ||
        s.faqs?.some(f => 
          f.question.toLowerCase().includes(query) ||
          f.answer.toLowerCase().includes(query)
        )
      )
    );
  });

  const analyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { type: 'help-update' }
      });

      if (error) throw error;

      const now = new Date().toISOString();
      localStorage.setItem('help_last_update', now);
      setLastUpdate(now);
      
      toast.success('Ayuda actualizada', {
        description: 'El contenido de ayuda ha sido analizado y actualizado con las últimas funcionalidades.'
      });
    } catch (error) {
      console.error('Error analyzing code:', error);
      toast.error('Error al analizar', {
        description: 'No se pudo actualizar la ayuda. Inténtalo de nuevo.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeAboutCode = async () => {
    setIsAnalyzingAbout(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-codebase', {
        body: { type: 'system-overview' }
      });

      if (error) throw error;

      toast.success('Análisis completado', {
        description: 'La información del sistema ha sido actualizada con los últimos datos.'
      });
    } catch (error) {
      console.error('Error analyzing system:', error);
      toast.error('Error al analizar', {
        description: 'No se pudo analizar el sistema. Inténtalo de nuevo.'
      });
    } finally {
      setIsAnalyzingAbout(false);
    }
  };

  const generateAboutPdf = async () => {
    setIsGeneratingAboutPdf(true);
    try {
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ObelixIA - Documentación del Sistema', margin, 25);
      
      pdf.setFontSize(12);
      pdf.text(obelixiaSystemInfo.overview.tagline, margin, 35);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Versión ${obelixiaSystemInfo.overview.version} | Generado: ${new Date().toLocaleDateString('es-ES')}`, margin, 45);

      y = 65;
      pdf.setTextColor(0, 0, 0);

      // Table of Contents
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Índice', margin, y);
      y += 10;

      const sections = ['Visión General', 'Arquitectura de Software', 'Requisitos de Hardware', 'Módulos del Sistema', 'Cumplimiento Normativo', 'Estructura de Menús'];
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      sections.forEach((section, i) => {
        pdf.text(`${i + 1}. ${section}`, margin + 5, y);
        y += 6;
      });

      // Section 1: Overview
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('1. Visión General', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(obelixiaSystemInfo.overview.description, contentWidth);
      descLines.forEach((line: string) => {
        if (y > 270) { pdf.addPage(); y = margin; }
        pdf.text(line, margin, y);
        y += 5;
      });

      y += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Usuarios Objetivo:', margin, y);
      y += 7;
      pdf.setFont('helvetica', 'normal');
      obelixiaSystemInfo.overview.targetUsers.forEach((user) => {
        pdf.text(`• ${user}`, margin + 5, y);
        y += 5;
      });

      y += 10;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Beneficios Clave:', margin, y);
      y += 7;
      pdf.setFont('helvetica', 'normal');
      obelixiaSystemInfo.overview.keyBenefits.forEach((benefit) => {
        const lines = pdf.splitTextToSize(`• ${benefit}`, contentWidth - 5);
        lines.forEach((line: string) => {
          if (y > 270) { pdf.addPage(); y = margin; }
          pdf.text(line, margin + 5, y);
          y += 5;
        });
      });

      // Section 2: Software
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('2. Arquitectura de Software', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Stack Tecnológico', margin, y);
      y += 8;

      pdf.setFontSize(10);
      obelixiaSystemInfo.software.stack.forEach((item) => {
        if (y > 260) { pdf.addPage(); y = margin; }
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${item.name}:`, margin, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`${item.tech}`, margin + 30, y);
        y += 5;
        pdf.text(`   ${item.description}`, margin, y);
        y += 7;
      });

      y += 5;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Seguridad Implementada', margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      obelixiaSystemInfo.software.security.forEach((item) => {
        if (y > 270) { pdf.addPage(); y = margin; }
        pdf.text(`• ${item}`, margin + 5, y);
        y += 5;
      });

      // Section 3: Hardware
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('3. Requisitos de Hardware', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Requisitos Cliente (Mínimos)', margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      obelixiaSystemInfo.hardware.client.minimum.forEach((req) => {
        pdf.text(`• ${req}`, margin + 5, y);
        y += 5;
      });

      y += 5;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Requisitos Cliente (Recomendados)', margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      obelixiaSystemInfo.hardware.client.recommended.forEach((req) => {
        pdf.text(`• ${req}`, margin + 5, y);
        y += 5;
      });

      y += 5;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Navegadores Compatibles', margin, y);
      y += 8;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(obelixiaSystemInfo.hardware.client.browsers.join(', '), margin + 5, y);

      // Section 4: Modules
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('4. Módulos del Sistema', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);

      obelixiaSystemInfo.modules.forEach((module, i) => {
        if (y > 240) { pdf.addPage(); y = margin; }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${i + 1}. ${module.name} (${module.compliance}%)`, margin, y);
        y += 6;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const descLines = pdf.splitTextToSize(module.description, contentWidth);
        descLines.forEach((line: string) => {
          pdf.text(line, margin + 5, y);
          y += 4;
        });
        
        pdf.text(`Normativas: ${module.regulations.join(', ')}`, margin + 5, y);
        y += 4;
        pdf.text(`Ruta: ${module.menuPath}`, margin + 5, y);
        y += 4;
        pdf.text(`Dependencias: ${module.dependencies.join(', ')}`, margin + 5, y);
        y += 8;
      });

      // Section 5: Compliance
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('5. Cumplimiento Normativo', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);

      const avgCompliance = Math.round(obelixiaSystemInfo.regulations.reduce((acc, r) => acc + r.compliance, 0) / obelixiaSystemInfo.regulations.length);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Cumplimiento Promedio Global: ${avgCompliance}%`, margin, y);
      y += 15;

      obelixiaSystemInfo.regulations.forEach((reg) => {
        if (y > 260) { pdf.addPage(); y = margin; }
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${reg.name}: ${reg.compliance}% (${reg.status})`, margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.text(reg.description, margin + 5, y);
        y += 8;
      });

      // Section 6: Menu Structure
      pdf.addPage();
      y = margin;
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('6. Estructura de Menús por Rol', margin, 20);
      
      y = 45;
      pdf.setTextColor(0, 0, 0);

      obelixiaSystemInfo.menuStructure.roles.forEach((roleInfo) => {
        if (y > 220) { pdf.addPage(); y = margin; }
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(roleInfo.role, margin, y);
        y += 7;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Acceso permitido:', margin + 5, y);
        y += 5;
        const accessLines = pdf.splitTextToSize(roleInfo.access.join(', '), contentWidth - 10);
        accessLines.forEach((line: string) => {
          pdf.text(line, margin + 10, y);
          y += 4;
        });
        
        if (roleInfo.restricted.length > 0) {
          y += 2;
          pdf.text('Restringido:', margin + 5, y);
          y += 5;
          const restrictedLines = pdf.splitTextToSize(roleInfo.restricted.join(', '), contentWidth - 10);
          restrictedLines.forEach((line: string) => {
            pdf.text(line, margin + 10, y);
            y += 4;
          });
        }
        y += 8;
      });

      pdf.save(`ObelixIA_Sistema_Documentacion_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado', { description: 'La documentación del sistema se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error generating about PDF:', error);
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingAboutPdf(false);
    }
  };

  const generatePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF();
      const margin = 20;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      pdf.setFillColor(30, 41, 59);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Manual de Usuario ObelixIA', margin, 28);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, margin, 38);

      y = 60;
      pdf.setTextColor(0, 0, 0);

      // Index
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Indice de Contenidos', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      helpModules.forEach((module, i) => {
        pdf.text(`${i + 1}. ${module.title}`, margin + 5, y);
        y += 6;
      });

      // Modules content
      helpModules.forEach((module, moduleIndex) => {
        pdf.addPage();
        y = margin;

        // Module header
        pdf.setFillColor(59, 130, 246);
        pdf.rect(0, 0, pageWidth, 35, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${moduleIndex + 1}. ${module.title}`, margin, 22);
        
        pdf.setFontSize(10);
        pdf.text(module.description, margin, 30);

        y = 50;
        pdf.setTextColor(0, 0, 0);

        // Sections
        module.sections.forEach((section, sectionIndex) => {
          if (y > pdf.internal.pageSize.getHeight() - 40) {
            pdf.addPage();
            y = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${moduleIndex + 1}.${sectionIndex + 1} ${section.title}`, margin, y);
          y += 8;

          // Content
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          const contentLines = pdf.splitTextToSize(section.content.replace(/[*#]/g, ''), contentWidth);
          contentLines.forEach((line: string) => {
            if (y > pdf.internal.pageSize.getHeight() - 20) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin, y);
            y += 5;
          });
          y += 5;

          // FAQs
          if (section.faqs && section.faqs.length > 0) {
            if (y > pdf.internal.pageSize.getHeight() - 40) {
              pdf.addPage();
              y = margin;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Preguntas Frecuentes', margin, y);
            y += 8;

            section.faqs.forEach((faq) => {
              if (y > pdf.internal.pageSize.getHeight() - 30) {
                pdf.addPage();
                y = margin;
              }

              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              const qLines = pdf.splitTextToSize(`P: ${faq.question}`, contentWidth);
              qLines.forEach((line: string) => {
                pdf.text(line, margin + 5, y);
                y += 5;
              });

              pdf.setFont('helvetica', 'normal');
              const aLines = pdf.splitTextToSize(`R: ${faq.answer}`, contentWidth - 10);
              aLines.forEach((line: string) => {
                if (y > pdf.internal.pageSize.getHeight() - 15) {
                  pdf.addPage();
                  y = margin;
                }
                pdf.text(line, margin + 10, y);
                y += 5;
              });
              y += 3;
            });
          }

          // Tips
          if (section.tips && section.tips.length > 0) {
            if (y > pdf.internal.pageSize.getHeight() - 30) {
              pdf.addPage();
              y = margin;
            }

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Consejos', margin, y);
            y += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            section.tips.forEach((tip) => {
              if (y > pdf.internal.pageSize.getHeight() - 15) {
                pdf.addPage();
                y = margin;
              }
              const tipLines = pdf.splitTextToSize(`• ${tip}`, contentWidth - 5);
              tipLines.forEach((line: string) => {
                pdf.text(line, margin + 5, y);
                y += 5;
              });
            });
          }

          y += 10;
        });
      });

      pdf.save(`Manual_Usuario_ObelixIA_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generado', { description: 'El manual se ha descargado correctamente.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderModuleContent = (module: HelpModule) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b">
        <div className="p-2 rounded-lg bg-primary/10">
          <module.icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{module.title}</h3>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </div>
      </div>

      {module.sections.map((section) => (
        <div key={section.id} className="border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection(section.id)}
          >
            <span className="font-medium">{section.title}</span>
            {expandedSections.includes(section.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          
          <AnimatePresence>
            {expandedSections.includes(section.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-0 space-y-4">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {section.content.split('\n').map((paragraph, i) => (
                      <p key={i} className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {section.faqs && section.faqs.length > 0 && (
                    <div className="space-y-3 pt-3 border-t">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileQuestion className="h-4 w-4 text-orange-500" />
                        Preguntas Frecuentes
                      </h4>
                      {section.faqs.map((faq, i) => (
                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                          <p className="font-medium text-sm">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.tips && section.tips.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      <h4 className="font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-500" />
                        Consejos
                      </h4>
                      {section.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <HelpCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Centro de Ayuda</h2>
                  <p className="text-sm text-muted-foreground">
                    Manual completo de ObelixIA
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Search and Actions */}
            <div className="p-4 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en la ayuda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeCode}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? 'Analizando...' : 'Actualizar Ayuda'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generatePdf}
                  disabled={isGeneratingPdf}
                  className="flex-1"
                >
                  {isGeneratingPdf ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
                </Button>
              </div>

              {lastUpdate && (
                <p className="text-xs text-muted-foreground text-center">
                  Última actualización: {new Date(lastUpdate).toLocaleString('es-ES')}
                </p>
              )}
            </div>

            {/* Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid grid-cols-5 mx-4 mt-2 shrink-0">
                <TabsTrigger value="about" className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Sobre</span>
                </TabsTrigger>
                <TabsTrigger value="modules" className="flex items-center gap-1">
                  <Book className="h-4 w-4" />
                  <span className="hidden sm:inline">Módulos</span>
                </TabsTrigger>
                <TabsTrigger value="faqs" className="flex items-center gap-1">
                  <FileQuestion className="h-4 w-4" />
                  <span className="hidden sm:inline">FAQs</span>
                </TabsTrigger>
                <TabsTrigger value="tips" className="flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Consejos</span>
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-1">
                  <MessageSquarePlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Buzón</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 min-h-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                {/* ABOUT OBELIXIA TAB */}
                <TabsContent value="about" className="mt-0 space-y-6">
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={analyzeAboutCode}
                      disabled={isAnalyzingAbout}
                      className="flex-1"
                    >
                      {isAnalyzingAbout ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {isAnalyzingAbout ? 'Analizando...' : 'Analizar Sistema'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAboutPdf}
                      disabled={isGeneratingAboutPdf}
                      className="flex-1"
                    >
                      {isGeneratingAboutPdf ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      {isGeneratingAboutPdf ? 'Generando...' : 'Descargar PDF Sistema'}
                    </Button>
                  </div>

                  {/* Overview Section */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{obelixiaSystemInfo.overview.title}</CardTitle>
                          <CardDescription>{obelixiaSystemInfo.overview.tagline}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-auto">v{obelixiaSystemInfo.overview.version}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {obelixiaSystemInfo.overview.description}
                      </p>
                      
                      <div className="grid sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            Usuarios Objetivo
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {obelixiaSystemInfo.overview.targetUsers.map((user, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <Check className="h-3 w-3 text-green-500" />
                                {user}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Beneficios Clave
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {obelixiaSystemInfo.overview.keyBenefits.map((benefit, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                {benefit}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Software Architecture */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="software">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/10">
                            <Cpu className="h-5 w-5 text-blue-500" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">{obelixiaSystemInfo.software.title}</span>
                            <p className="text-xs text-muted-foreground">Stack tecnológico, arquitectura y seguridad</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Stack Tecnológico</h4>
                          <div className="grid gap-2">
                            {obelixiaSystemInfo.software.stack.map((item, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                                <div>
                                  <span className="font-medium text-sm">{item.name}</span>
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{item.tech}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Arquitectura</h4>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {obelixiaSystemInfo.software.architecture}
                            </pre>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Lock className="h-4 w-4 text-green-500" />
                            Seguridad Implementada
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {obelixiaSystemInfo.software.security.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="h-3 w-3 text-green-500" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Hardware Requirements */}
                    <AccordionItem value="hardware">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-500/10">
                            <HardDrive className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">{obelixiaSystemInfo.hardware.title}</span>
                            <p className="text-xs text-muted-foreground">Cliente, servidor y capacidades offline</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Requisitos Mínimos (Cliente)</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {obelixiaSystemInfo.hardware.client.minimum.map((req, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-yellow-500 mt-1 shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm">Requisitos Recomendados</h4>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {obelixiaSystemInfo.hardware.client.recommended.map((req, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                  {req}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm">Navegadores Compatibles</h4>
                          <div className="flex flex-wrap gap-2">
                            {obelixiaSystemInfo.hardware.client.browsers.map((browser, i) => (
                              <Badge key={i} variant="secondary">{browser}</Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Server className="h-4 w-4 text-primary" />
                            Infraestructura Servidor
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">Especificaciones</span>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {obelixiaSystemInfo.hardware.server.specs.map((spec, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <Database className="h-3 w-3 text-primary mt-1 shrink-0" />
                                    {spec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-medium text-muted-foreground">Capacidad</span>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {obelixiaSystemInfo.hardware.server.capacity.map((cap, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <BarChart3 className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                                    {cap}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-500" />
                            Capacidades Offline
                          </h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {obelixiaSystemInfo.hardware.offline.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Check className="h-3 w-3 text-purple-500 mt-1 shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Modules with Compliance */}
                    <AccordionItem value="modules-compliance">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Layers className="h-5 w-5 text-green-500" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">Módulos y Cumplimiento</span>
                            <p className="text-xs text-muted-foreground">{obelixiaSystemInfo.modules.length} módulos con % de cumplimiento normativo</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-4">
                        {obelixiaSystemInfo.modules.map((module, i) => (
                          <div key={module.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-sm">{i + 1}. {module.name}</span>
                                <p className="text-xs text-muted-foreground">{module.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={module.compliance >= 95 ? 'default' : module.compliance >= 90 ? 'secondary' : 'outline'}>
                                  {module.compliance}%
                                </Badge>
                              </div>
                            </div>
                            <Progress value={module.compliance} className="h-1.5" />
                            <div className="flex flex-wrap gap-1 mt-2">
                              {module.regulations.map((reg, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{reg}</Badge>
                              ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Menú:</span> {module.menuPath}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Dependencias:</span> {module.dependencies.join(', ')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Funciones:</span> {module.features.join(' • ')}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>

                    {/* Regulations Compliance */}
                    <AccordionItem value="regulations">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/10">
                            <FileCheck className="h-5 w-5 text-purple-500" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">Cumplimiento Normativo</span>
                            <p className="text-xs text-muted-foreground">{obelixiaSystemInfo.regulations.length} normativas monitorizadas</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-4">
                        <div className="grid gap-3">
                          {obelixiaSystemInfo.regulations.map((reg) => (
                            <div key={reg.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{reg.name}</span>
                                  <Badge 
                                    variant={reg.status === 'Complert' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {reg.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">{reg.description}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-lg font-bold ${
                                  reg.compliance >= 95 ? 'text-green-500' : 
                                  reg.compliance >= 90 ? 'text-yellow-500' : 'text-orange-500'
                                }`}>
                                  {reg.compliance}%
                                </span>
                                <Progress value={reg.compliance} className="h-1 w-20 mt-1" />
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Average Compliance */}
                        <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Cumplimiento Promedio Global</span>
                            <span className="text-2xl font-bold text-primary">
                              {Math.round(obelixiaSystemInfo.regulations.reduce((acc, r) => acc + r.compliance, 0) / obelixiaSystemInfo.regulations.length)}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.round(obelixiaSystemInfo.regulations.reduce((acc, r) => acc + r.compliance, 0) / obelixiaSystemInfo.regulations.length)} 
                            className="h-2 mt-2" 
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* Menu Structure */}
                    <AccordionItem value="menu-structure">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-cyan-500/10">
                            <Eye className="h-5 w-5 text-cyan-500" />
                          </div>
                          <div className="text-left">
                            <span className="font-semibold">{obelixiaSystemInfo.menuStructure.title}</span>
                            <p className="text-xs text-muted-foreground">{obelixiaSystemInfo.menuStructure.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-4">
                        {obelixiaSystemInfo.menuStructure.roles.map((roleInfo, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="font-medium">{roleInfo.role}</span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-xs font-medium text-green-600">Acceso Permitido:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {roleInfo.access.map((item, j) => (
                                    <Badge key={j} variant="outline" className="text-xs bg-green-500/5">{item}</Badge>
                                  ))}
                                </div>
                              </div>
                              {roleInfo.restricted.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-red-600">Restringido:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {roleInfo.restricted.map((item, j) => (
                                      <Badge key={j} variant="outline" className="text-xs bg-red-500/5">{item}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="modules" className="mt-0 space-y-4">
                  {selectedModule ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedModule(null)}
                        className="mb-2"
                      >
                        ← Volver al índice
                      </Button>
                      {renderModuleContent(
                        helpModules.find(m => m.id === selectedModule)!
                      )}
                    </>
                  ) : (
                    <div className="grid gap-3">
                      {filteredModules.map((module) => (
                        <motion.button
                          key={module.id}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedModule(module.id)}
                          className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all text-left group"
                        >
                          <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <module.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{module.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {module.description}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {module.sections.length} secciones
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="faqs" className="mt-0 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Todas las Preguntas Frecuentes</h3>
                  {helpModules.map((module) => (
                    module.sections.map((section) => (
                      section.faqs?.map((faq, i) => (
                        <div key={`${module.id}-${section.id}-${i}`} className="border rounded-lg p-4">
                          <Badge variant="outline" className="mb-2">{module.title}</Badge>
                          <p className="font-medium">{faq.question}</p>
                          <p className="text-sm text-muted-foreground mt-2">{faq.answer}</p>
                        </div>
                      ))
                    ))
                  ))}
                </TabsContent>

                <TabsContent value="tips" className="mt-0 space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Todos los Consejos</h3>
                  {helpModules.map((module) => (
                    module.sections.map((section) => (
                      section.tips?.map((tip, i) => (
                        <div key={`${module.id}-${section.id}-${i}`} className="flex items-start gap-3 p-4 border rounded-lg">
                          <Lightbulb className="h-5 w-5 text-yellow-500 shrink-0" />
                          <div>
                            <Badge variant="outline" className="mb-2">{module.title}</Badge>
                            <p className="text-sm">{tip}</p>
                          </div>
                        </div>
                      ))
                    ))
                  ))}
                </TabsContent>

                <TabsContent value="suggestions" className="mt-0">
                  <SuggestionBox />
                </TabsContent>
                </ScrollArea>
              </div>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
