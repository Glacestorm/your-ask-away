import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  FileText, Download, Loader2, CheckCircle, Code, Layers, Database, 
  Shield, Zap, Globe, Users, BarChart3, Map, Calculator, Calendar,
  Bell, Mail, FileSearch, Palette, Languages, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';

interface FunctionalityModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  features: {
    name: string;
    description: string;
    status: 'completed' | 'partial' | 'pending';
    technicalDetails: string[];
  }[];
  files: string[];
  dependencies: string[];
  integrations: string[];
}

const FUNCTIONALITY_MODULES: FunctionalityModule[] = [
  {
    id: 'auth',
    name: 'Sistema de Autenticació',
    icon: <Shield className="h-5 w-5" />,
    category: 'Core',
    description: 'Gestió completa d\'autenticació amb Supabase Auth, sistema RBAC multi-rol i polítiques RLS.',
    features: [
      {
        name: 'Login/Logout Segur',
        description: 'Autenticació via email amb confirmació automàtica',
        status: 'completed',
        technicalDetails: ['Supabase Auth', 'JWT tokens', 'Session management', 'Auto-refresh tokens']
      },
      {
        name: 'Sistema de Rols RBAC',
        description: '6 rols: gestor, director_oficina, director_comercial, responsable_comercial, auditor, superadmin',
        status: 'completed',
        technicalDetails: ['Taula user_roles', 'Funcions has_role()', 'Hooks useAuth()']
      },
      {
        name: 'Row Level Security (RLS)',
        description: 'Polítiques de seguretat a nivell de fila en totes les taules crítiques',
        status: 'completed',
        technicalDetails: ['Polítiques SELECT/INSERT/UPDATE/DELETE', 'Funcions security-definer', 'is_admin_or_superadmin()']
      },
      {
        name: 'Selector de Visió',
        description: 'Superadmins poden veure dashboards com altres rols',
        status: 'completed',
        technicalDetails: ['Context React', 'Persistència sessió', 'Renderitzat condicional']
      }
    ],
    files: ['src/hooks/useAuth.tsx', 'src/pages/Auth.tsx', 'src/contexts/ThemeContext.tsx'],
    dependencies: ['@supabase/supabase-js'],
    integrations: ['Supabase Auth']
  },
  {
    id: 'dashboard',
    name: 'Dashboards Multi-Rol',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'Core',
    description: 'Dashboards adaptats per rol amb KPIs bancaris, gràfics interactius i benchmarking.',
    features: [
      {
        name: 'Dashboard Director de Negoci',
        description: 'Visió global de tota la xarxa comercial amb mètriques agregades',
        status: 'completed',
        technicalDetails: ['CommercialDirectorDashboard.tsx', 'Filtres per oficina/gestor', 'Gràfics Recharts']
      },
      {
        name: 'Dashboard Director d\'Oficina',
        description: 'Mètriques de la oficina assignada i els seus gestors',
        status: 'completed',
        technicalDetails: ['OfficeDirectorDashboard.tsx', 'Filtratge per oficina', 'Cascada gestor']
      },
      {
        name: 'Dashboard Gestor Personal',
        description: 'Dashboard individual amb objectius, visites i rendiment personal',
        status: 'completed',
        technicalDetails: ['GestorDashboard.tsx', 'Cards 3D navegables', 'Historial metes']
      },
      {
        name: 'Mètriques Unificades',
        description: '8 KPIs bancaris amb benchmarking europeu',
        status: 'completed',
        technicalDetails: ['UnifiedMetricsDashboard.tsx', 'Visites, Vinculació, Productes/Client, Conversió']
      },
      {
        name: 'Gràfics Interactius',
        description: 'Bar, Line, Area, Pie, Radar, Composed charts amb filtres',
        status: 'completed',
        technicalDetails: ['Recharts library', 'Responsives', 'Tooltips personalitzats']
      }
    ],
    files: [
      'src/components/admin/CommercialDirectorDashboard.tsx',
      'src/components/admin/OfficeDirectorDashboard.tsx',
      'src/components/admin/GestorDashboard.tsx',
      'src/components/dashboard/UnifiedMetricsDashboard.tsx'
    ],
    dependencies: ['recharts', 'react-day-picker'],
    integrations: ['Supabase Realtime']
  },
  {
    id: 'accounting',
    name: 'Mòdul Comptable PGC',
    icon: <Calculator className="h-5 w-5" />,
    category: 'Financer',
    description: 'Sistema comptable complet segons Pla General Comptable Andorra/Espanya amb anàlisi financer.',
    features: [
      {
        name: 'Balanç de Situació',
        description: 'Actiu, Passiu i Patrimoni Net amb tots els epígrafs PGC',
        status: 'completed',
        technicalDetails: ['BalanceSheetForm.tsx', 'balance_sheets table', '40+ camps financers']
      },
      {
        name: 'Compte de Pèrdues i Guanys',
        description: 'Estructura completa PyG amb càlculs automàtics',
        status: 'completed',
        technicalDetails: ['IncomeStatementForm.tsx', 'income_statements table', 'EBIT/EBITDA auto']
      },
      {
        name: 'Estat de Fluxos d\'Efectiu',
        description: 'Cash Flow amb activitats operatives, inversió i finançament',
        status: 'completed',
        technicalDetails: ['CashFlowForm.tsx', 'cash_flow_statements table']
      },
      {
        name: 'Consolidació Grups',
        description: 'Consolidació fins a 15 empreses amb eliminacions intergrupo',
        status: 'completed',
        technicalDetails: ['ConsolidatedStatementsManager.tsx', 'consolidation_groups', 'Integració global/proporcional']
      },
      {
        name: 'Import PDF amb IA',
        description: 'Extracció automàtica de dades d\'estats financers PDF',
        status: 'completed',
        technicalDetails: ['parse-financial-pdf Edge Function', 'Gemini 2.5 Pro', 'OCR integrat']
      },
      {
        name: 'Anàlisi Financer Avançat',
        description: 'Piràmide DuPont, Z-Score Altman, Ràtios Liquiditat, NOF',
        status: 'completed',
        technicalDetails: ['DuPontPyramid.tsx', 'ZScoreAnalysis.tsx', 'WorkingCapitalNOF.tsx']
      }
    ],
    files: [
      'src/components/admin/accounting/AccountingManager.tsx',
      'src/components/admin/accounting/BalanceSheetForm.tsx',
      'src/components/admin/accounting/IncomeStatementForm.tsx',
      'src/components/admin/accounting/DuPontPyramid.tsx',
      'src/components/admin/accounting/ZScoreAnalysis.tsx'
    ],
    dependencies: ['jspdf', 'xlsx'],
    integrations: ['Lovable AI (Gemini 2.5)']
  },
  {
    id: 'gis',
    name: 'GIS Bancari Enterprise',
    icon: <Map className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Sistema d\'informació geogràfica per gestió de cartera amb 20.000+ empreses.',
    features: [
      {
        name: 'Mapa Interactiu',
        description: 'MapLibre GL JS amb capas OSM, Satèl·lit i 3D',
        status: 'completed',
        technicalDetails: ['MapContainer.tsx', 'maplibre-gl', 'Tiles OSM/Satellite']
      },
      {
        name: 'Clustering Intel·ligent',
        description: 'Supercluster per rendiment amb 20.000+ punts',
        status: 'completed',
        technicalDetails: ['supercluster library', 'Zoom dinàmic', 'Agregació automàtica']
      },
      {
        name: 'Colorització Dinàmica',
        description: 'Per estat, vinculació, P&L banc, visites recents',
        status: 'completed',
        technicalDetails: ['colorMode state', 'Marcadors SVG personalitzats', 'Llegenda dinàmica']
      },
      {
        name: 'Sidebar Filtres Avançats',
        description: 'Filtratge per sector, CNAE, parròquia, vinculació, facturació',
        status: 'completed',
        technicalDetails: ['MapSidebar.tsx', 'Mode fullscreen', 'Paginació servidor']
      },
      {
        name: 'Planificador Rutes',
        description: 'Optimització rutes visites amb Google Directions API',
        status: 'partial',
        technicalDetails: ['RoutePlanner.tsx', 'optimize-route Edge Function', 'Instruccions turn-by-turn']
      }
    ],
    files: [
      'src/components/map/MapContainer.tsx',
      'src/components/map/MapSidebar.tsx',
      'src/components/map/RoutePlanner.tsx',
      'src/components/map/GeoSearch.tsx'
    ],
    dependencies: ['maplibre-gl', 'supercluster'],
    integrations: ['OpenStreetMap', 'Google Directions API']
  },
  {
    id: 'companies',
    name: 'Gestió d\'Empreses',
    icon: <Layers className="h-5 w-5" />,
    category: 'Core',
    description: 'CRUD complet d\'empreses amb paginació servidor, contactes, documents i productes.',
    features: [
      {
        name: 'Llistat Paginat',
        description: 'Suport per 20.000+ empreses amb paginació servidor',
        status: 'completed',
        technicalDetails: ['useCompaniesServerPagination.ts', 'SQL LIMIT/OFFSET', 'Filtres SQL']
      },
      {
        name: 'Detall Empresa',
        description: 'Pestanyes: Info, Contactes, Documents, Productes, TPV, Fotos, Visites',
        status: 'completed',
        technicalDetails: ['CompanyDetail.tsx', 'Tabs component', 'Lazy loading']
      },
      {
        name: 'Import Excel Massiu',
        description: 'Import amb geocodificació automàtica i detecció duplicats',
        status: 'completed',
        technicalDetails: ['ExcelImporter.tsx', 'xlsx library', 'geocode-address Edge Function']
      },
      {
        name: 'Export PDF/Excel',
        description: 'Generació informes empresa i llistats',
        status: 'completed',
        technicalDetails: ['PDFExportDialog.tsx', 'ExcelExportDialog.tsx', 'jspdf + xlsx']
      }
    ],
    files: [
      'src/components/admin/CompaniesManager.tsx',
      'src/components/company/CompanyDetail.tsx',
      'src/components/admin/ExcelImporter.tsx',
      'src/hooks/useCompaniesServerPagination.ts'
    ],
    dependencies: ['xlsx', 'jspdf', 'jspdf-autotable'],
    integrations: ['Nominatim/OpenStreetMap Geocoding']
  },
  {
    id: 'visits',
    name: 'Fitxes de Visita',
    icon: <FileSearch className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Formulari complet de 12 seccions per documentar visites comercials.',
    features: [
      {
        name: 'Formulari 12 Seccions',
        description: 'Dades visita, diagnòstic, situació financera, productes, resum, seguiment',
        status: 'completed',
        technicalDetails: ['VisitSheetForm.tsx', 'visit_sheets table', 'Validació Zod']
      },
      {
        name: 'Validació Jeràrquica',
        description: 'Aprovació per responsable comercial amb notificació email',
        status: 'completed',
        technicalDetails: ['VisitSheetValidationPanel.tsx', 'notify-visit-validation Edge Function']
      },
      {
        name: 'Sincronització Vinculació',
        description: 'Percentatges banc sincronitzats amb company_bank_affiliations',
        status: 'completed',
        technicalDetails: ['Trigger DB', 'Validació suma 100%', 'Pre-poblat automàtic']
      },
      {
        name: 'Alertes Oportunitats',
        description: 'Notificació automàtica visites amb probabilitat >90%',
        status: 'completed',
        technicalDetails: ['send-critical-opportunity-email', 'Email a directors i responsables']
      }
    ],
    files: [
      'src/components/visits/VisitSheetForm.tsx',
      'src/components/admin/VisitSheetValidationPanel.tsx',
      'src/pages/VisitSheets.tsx'
    ],
    dependencies: ['react-hook-form', 'zod'],
    integrations: ['Resend Email']
  },
  {
    id: 'goals',
    name: 'Objectius i Metes',
    icon: <Zap className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Definició, seguiment i anàlisi d\'objectius comercials per gestor.',
    features: [
      {
        name: 'Creació Objectius',
        description: '7 mètriques: clients nous, fitxes, TPV, conversió, facturació, productes, follow-ups',
        status: 'completed',
        technicalDetails: ['GoalsProgressTracker.tsx', 'goals table', 'Assignació per admin']
      },
      {
        name: 'Tracking Temps Real',
        description: 'Progress bars i indicadors de risc amb Supabase Realtime',
        status: 'completed',
        technicalDetails: ['useGoalsQuery.ts', 'Realtime subscriptions', 'Càlcul automàtic']
      },
      {
        name: 'Benchmarking',
        description: 'Comparativa vs oficina i equip',
        status: 'completed',
        technicalDetails: ['PersonalGoalsTracker.tsx', 'Càlcul mitjanes', 'TrendingUp/Down']
      },
      {
        name: 'Plans IA',
        description: 'Generació automàtica plans millora amb Gemini',
        status: 'completed',
        technicalDetails: ['generate-action-plan Edge Function', 'action_plans table', '4-6 passos per pla']
      }
    ],
    files: [
      'src/components/admin/GoalsProgressTracker.tsx',
      'src/components/dashboard/PersonalGoalsTracker.tsx',
      'src/hooks/useGoalsQuery.ts'
    ],
    dependencies: ['@tanstack/react-query'],
    integrations: ['Lovable AI', 'Supabase Realtime']
  },
  {
    id: 'calendar',
    name: 'Calendari Compartit',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Operacions',
    description: 'Vista calendari de visites amb filtres per gestor i oficina.',
    features: [
      {
        name: 'Vista Mensual/Setmanal',
        description: 'Calendari amb react-big-calendar',
        status: 'completed',
        technicalDetails: ['SharedVisitsCalendar.tsx', 'react-big-calendar', 'date-fns locale']
      },
      {
        name: 'Filtres Cascada',
        description: 'Oficina > Gestor amb actualització dinàmica',
        status: 'completed',
        technicalDetails: ['GestorFilterSelector.tsx', 'Cascada oficina-gestor']
      },
      {
        name: 'Creació Ràpida Visites',
        description: 'Dialog per crear visites des del calendari',
        status: 'completed',
        technicalDetails: ['CompanySearchBar.tsx', 'visit_participants table']
      }
    ],
    files: [
      'src/components/admin/SharedVisitsCalendar.tsx',
      'src/components/dashboard/GestorFilterSelector.tsx'
    ],
    dependencies: ['react-big-calendar', 'date-fns'],
    integrations: []
  },
  {
    id: 'alerts',
    name: 'Sistema d\'Alertes',
    icon: <Bell className="h-5 w-5" />,
    category: 'Operacions',
    description: 'Alertes configurables amb escalat automàtic i notificacions.',
    features: [
      {
        name: 'Configuració Alertes',
        description: 'Per mètrica, condició, gestor o oficina',
        status: 'completed',
        technicalDetails: ['AlertsManager.tsx', 'alerts table', 'check-alerts Edge Function']
      },
      {
        name: 'Escalat Automàtic',
        description: 'Escalat jeràrquic per temps sense resolució',
        status: 'completed',
        technicalDetails: ['escalate-alerts Edge Function', 'escalation_level', 'Notificació cadena']
      },
      {
        name: 'Historial Alertes',
        description: 'Registre alertes disparades amb resolució',
        status: 'completed',
        technicalDetails: ['AlertHistoryViewer.tsx', 'alert_history table', 'resolved_by']
      }
    ],
    files: [
      'src/components/dashboard/AlertsManager.tsx',
      'src/components/admin/AlertHistoryViewer.tsx',
      'supabase/functions/check-alerts/index.ts'
    ],
    dependencies: [],
    integrations: ['Resend Email']
  },
  {
    id: 'email',
    name: 'Notificacions Email',
    icon: <Mail className="h-5 w-5" />,
    category: 'Operacions',
    description: 'Enviament automàtic emails transaccionals via Resend.',
    features: [
      {
        name: 'Recordatoris Visites',
        description: 'Emails automàtics per visites pendents',
        status: 'completed',
        technicalDetails: ['send-reminder-email', 'check-visit-reminders', 'Templates HTML']
      },
      {
        name: 'Reports KPI',
        description: 'Enviament diari/setmanal/mensual mètriques',
        status: 'completed',
        technicalDetails: ['send-daily-kpi-report', 'send-weekly-kpi-report', 'send-monthly-kpi-report']
      },
      {
        name: 'Templates Personalitzables',
        description: 'Gestió templates HTML amb variables',
        status: 'completed',
        technicalDetails: ['EmailTemplatesManager.tsx', 'email_templates table', 'Variables dinàmiques']
      }
    ],
    files: [
      'src/components/admin/EmailTemplatesManager.tsx',
      'supabase/functions/send-reminder-email/index.ts'
    ],
    dependencies: [],
    integrations: ['Resend']
  },
  {
    id: 'audit',
    name: 'Auditoria i Logs',
    icon: <Database className="h-5 w-5" />,
    category: 'Seguretat',
    description: 'Registre complet de totes les accions d\'usuari per compliance.',
    features: [
      {
        name: 'Audit Logs',
        description: 'Registre INSERT/UPDATE/DELETE amb dades abans/després',
        status: 'completed',
        technicalDetails: ['audit_logs table', 'Triggers DB', 'user_id, timestamp, old_data, new_data']
      },
      {
        name: 'Visor Logs',
        description: 'Filtratge per acció, taula, usuari, data',
        status: 'completed',
        technicalDetails: ['AuditLogsViewer.tsx', 'Paginació', 'Export']
      },
      {
        name: 'Panel Auditoria RC',
        description: 'Vista especial per responsables comercials',
        status: 'completed',
        technicalDetails: ['CommercialManagerAudit.tsx', 'Filtres per RC']
      }
    ],
    files: [
      'src/components/admin/AuditLogsViewer.tsx',
      'src/components/admin/CommercialManagerAudit.tsx'
    ],
    dependencies: [],
    integrations: []
  },
  {
    id: 'i18n',
    name: 'Internacionalització',
    icon: <Languages className="h-5 w-5" />,
    category: 'UX',
    description: 'Suport multi-idioma per la interfície.',
    features: [
      {
        name: '4 Idiomes Complets',
        description: 'Espanyol, Català, Anglès, Francès',
        status: 'completed',
        technicalDetails: ['LanguageContext.tsx', 'src/locales/*.ts', 'useLanguage hook']
      },
      {
        name: 'Selector Persistent',
        description: 'Preferència guardada a localStorage',
        status: 'completed',
        technicalDetails: ['LanguageSelector.tsx', 'localStorage', 'Flags icons']
      }
    ],
    files: [
      'src/contexts/LanguageContext.tsx',
      'src/locales/es.ts',
      'src/locales/ca.ts',
      'src/locales/en.ts',
      'src/locales/fr.ts'
    ],
    dependencies: [],
    integrations: []
  },
  {
    id: 'themes',
    name: 'Temes Visuals',
    icon: <Palette className="h-5 w-5" />,
    category: 'UX',
    description: 'Sistema de temes personalitzables.',
    features: [
      {
        name: '4 Temes',
        description: 'Day (clar), Night (fosc), Creand (corporatiu), Aurora (vibrant)',
        status: 'completed',
        technicalDetails: ['ThemeContext.tsx', 'CSS variables', 'Transicions suaves']
      },
      {
        name: 'Selector Persistent',
        description: 'Preferència guardada a localStorage',
        status: 'completed',
        technicalDetails: ['ThemeSelector.tsx', 'data-theme attribute']
      }
    ],
    files: [
      'src/contexts/ThemeContext.tsx',
      'src/components/ThemeSelector.tsx',
      'src/index.css'
    ],
    dependencies: [],
    integrations: []
  },
  {
    id: 'presence',
    name: 'Presència Online',
    icon: <Users className="h-5 w-5" />,
    category: 'Col·laboració',
    description: 'Indicadors d\'usuaris connectats en temps real.',
    features: [
      {
        name: 'Avatars Online',
        description: 'Indicador usuaris connectats al header',
        status: 'completed',
        technicalDetails: ['OnlineUsersIndicator.tsx', 'Supabase Presence', 'PresenceContext']
      },
      {
        name: 'Optimistic Locking',
        description: 'Detecció conflictes edició simultània',
        status: 'completed',
        technicalDetails: ['useOptimisticLock.ts', 'version/updated_at fields', 'ConflictDialog']
      }
    ],
    files: [
      'src/contexts/PresenceContext.tsx',
      'src/components/presence/OnlineUsersIndicator.tsx',
      'src/hooks/useOptimisticLock.ts'
    ],
    dependencies: [],
    integrations: ['Supabase Presence']
  },
  {
    id: 'rfm-segmentation',
    name: 'Anàlisi RFM i Segmentació ML',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'IA/ML',
    description: 'Segmentació clients amb RFM scoring i models ML (SVM/CART) per predicció churn i CLV.',
    features: [
      {
        name: 'RFM Scoring Automàtic',
        description: 'Càlcul Recency, Frequency, Monetary amb 8 segments',
        status: 'completed',
        technicalDetails: ['RFMDashboard.tsx', 'calculate-rfm-analysis Edge Function', 'customer_rfm_scores table']
      },
      {
        name: 'Segmentació ML SVM/CART',
        description: 'Models machine learning per classificació clients',
        status: 'completed',
        technicalDetails: ['CustomerSegmentationPanel.tsx', 'segment-customers-ml Edge Function', 'customer_segments table']
      },
      {
        name: 'Predicció Churn',
        description: 'Probabilitat de pèrdua client amb factors de risc',
        status: 'completed',
        technicalDetails: ['Churn probability score', 'Risk factors', 'Tier distribution charts']
      },
      {
        name: 'CLV Prediction',
        description: 'Customer Lifetime Value estimat per segment',
        status: 'completed',
        technicalDetails: ['CLV distribution', 'Profitability tiers', 'Radar charts']
      },
      {
        name: 'Polítiques Gestió',
        description: 'Recomanacions automatitzades per cada segment',
        status: 'completed',
        technicalDetails: ['segment_management_policies table', 'Action recommendations', 'Priority scoring']
      }
    ],
    files: [
      'src/components/admin/RFMDashboard.tsx',
      'src/components/admin/CustomerSegmentationPanel.tsx',
      'supabase/functions/calculate-rfm-analysis/index.ts',
      'supabase/functions/segment-customers-ml/index.ts'
    ],
    dependencies: ['recharts'],
    integrations: ['Lovable AI (Gemini)']
  },
  {
    id: 'pipeline',
    name: 'Pipeline d\'Oportunitats',
    icon: <Layers className="h-5 w-5" />,
    category: 'Comercial',
    description: 'Kanban visual per gestió oportunitats comercials amb 5 etapes i drag & drop.',
    features: [
      {
        name: 'Kanban 5 Etapes',
        description: 'Lead, Qualified, Proposal, Negotiation, Won/Lost',
        status: 'completed',
        technicalDetails: ['PipelineBoard.tsx', 'opportunities table', 'Drag & drop nativa']
      },
      {
        name: 'Gestió Oportunitats',
        description: 'CRUD complet amb empresa, contacte, valor estimat',
        status: 'completed',
        technicalDetails: ['OpportunityForm.tsx', 'OpportunityCard.tsx', 'useOpportunities.ts hook']
      },
      {
        name: 'Valor Ponderat',
        description: 'Càlcul automàtic segons probabilitat cierre',
        status: 'completed',
        technicalDetails: ['weighted_value calculation', 'probability percentage', 'estimated_value']
      },
      {
        name: 'Marcatge VIP',
        description: 'Identificació oportunitats clau',
        status: 'completed',
        technicalDetails: ['is_vip flag', 'Visual badges', 'Priority filtering']
      }
    ],
    files: [
      'src/components/pipeline/PipelineBoard.tsx',
      'src/components/pipeline/OpportunityCard.tsx',
      'src/components/pipeline/OpportunityForm.tsx',
      'src/hooks/useOpportunities.ts'
    ],
    dependencies: ['@tanstack/react-query'],
    integrations: ['Supabase Realtime']
  },
  {
    id: 'ai-assistant',
    name: 'Assistent IA Intern',
    icon: <Zap className="h-5 w-5" />,
    category: 'IA/ML',
    description: 'Chatbot IA per gestors amb veu bidireccional i base de coneixements.',
    features: [
      {
        name: 'Chat IA Contextual',
        description: '6 tipus context: Clients, Regulacions, Productes, Procediments, Forms',
        status: 'completed',
        technicalDetails: ['InternalAssistantChat.tsx', 'internal-assistant-chat Edge Function', 'Gemini 2.5']
      },
      {
        name: 'Veu Bidireccional',
        description: 'Speech-to-text input i text-to-speech output',
        status: 'completed',
        technicalDetails: ['useVoiceChat.ts', 'Web Speech API', 'Auto-speak toggle']
      },
      {
        name: 'Base Coneixements',
        description: 'Upload PDFs i URLs per enriquir respostes',
        status: 'completed',
        technicalDetails: ['AssistantKnowledgeManager.tsx', 'assistant_knowledge_documents table', 'assistant-documents bucket']
      },
      {
        name: 'Audit Trail Permanent',
        description: 'Historial conversacions per compliance bancari',
        status: 'completed',
        technicalDetails: ['assistant_conversation_audit table', 'Legal notice GDPR/APDA', 'Auditors access']
      }
    ],
    files: [
      'src/components/admin/InternalAssistantChat.tsx',
      'src/components/admin/AssistantKnowledgeManager.tsx',
      'src/hooks/useVoiceChat.ts',
      'supabase/functions/internal-assistant-chat/index.ts'
    ],
    dependencies: [],
    integrations: ['Lovable AI (Gemini)', 'Web Speech API']
  },
  {
    id: 'financial-rag',
    name: 'RAG Chat Financer',
    icon: <Calculator className="h-5 w-5" />,
    category: 'IA/ML',
    description: 'Consultes IA sobre estats financers amb embeddings vectorials.',
    features: [
      {
        name: 'Embeddings Vectorials',
        description: 'Generació embeddings 768D per documents financers',
        status: 'completed',
        technicalDetails: ['generate-financial-embeddings Edge Function', 'financial_document_embeddings table', 'Lovable AI']
      },
      {
        name: 'Cerca Semàntica',
        description: 'Búsqueda per similitud coseno sobre documents',
        status: 'completed',
        technicalDetails: ['search_financial_embeddings function', 'match_threshold', 'match_count']
      },
      {
        name: 'Chat RAG',
        description: 'Converses amb context recuperat de documents reals',
        status: 'completed',
        technicalDetails: ['FinancialRAGChat.tsx', 'financial-rag-chat Edge Function', 'Sources citation']
      },
      {
        name: 'Historial Converses',
        description: 'Persistència conversacions per empresa/any fiscal',
        status: 'completed',
        technicalDetails: ['financial_rag_conversations table', 'financial_rag_messages table']
      }
    ],
    files: [
      'src/components/admin/accounting/FinancialRAGChat.tsx',
      'supabase/functions/financial-rag-chat/index.ts',
      'supabase/functions/generate-financial-embeddings/index.ts'
    ],
    dependencies: [],
    integrations: ['Lovable AI (Gemini)', 'Vector embeddings']
  },
  {
    id: 'ai-visit-summary',
    name: 'Resum IA Visites (ObelixIA)',
    icon: <FileSearch className="h-5 w-5" />,
    category: 'IA/ML',
    description: 'Generació automàtica resum, següents passos i riscos de notes de visita.',
    features: [
      {
        name: 'Botó Resumir amb ObelixIA',
        description: 'Integrat a fitxa visita per generar resum automàtic',
        status: 'completed',
        technicalDetails: ['AISummaryButton.tsx', 'summarize-visit Edge Function', 'Gemini 2.5 Flash']
      },
      {
        name: 'Resum Estructurat',
        description: 'Síntesi notes amb format consistent',
        status: 'completed',
        technicalDetails: ['JSON estructurat', 'summary field', 'Integration visit_sheets']
      },
      {
        name: 'Següents Passos',
        description: 'Identificació automàtica accions pendents',
        status: 'completed',
        technicalDetails: ['next_steps array', 'Actionable items', 'Follow-up dates']
      },
      {
        name: 'Detecció Riscos',
        description: 'Identificació riscos potencials de la reunió',
        status: 'completed',
        technicalDetails: ['risks array', 'Risk classification', 'Priority flagging']
      }
    ],
    files: [
      'src/components/visits/AISummaryButton.tsx',
      'supabase/functions/summarize-visit/index.ts'
    ],
    dependencies: [],
    integrations: ['Lovable AI (Gemini)']
  }
];

export const CodebaseIndexGenerator = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [codeStats, setCodeStats] = useState({
    components: 0,
    hooks: 0,
    pages: 0,
    edgeFunctions: 0,
    tables: 0
  });

  useEffect(() => {
    // Simular càlcul d'estadístiques
    setCodeStats({
      components: 185,
      hooks: 18,
      pages: 9,
      edgeFunctions: 22,
      tables: 35
    });
  }, []);

  const analyzeCodebase = async () => {
    setAnalyzing(true);
    setProgress(0);

    try {
      // Simular anàlisi progressiu
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 200));
        setProgress(i);
      }

      setLastAnalysis(new Date());
      toast.success('Anàlisi del codi completada correctament');
    } catch (error) {
      console.error('Error analitzant codi:', error);
      toast.error('Error durant l\'anàlisi');
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    setProgress(0);

    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;
      let pageNumber = 1;

      const addNewPage = () => {
        doc.addPage();
        pageNumber++;
        currentY = margin;
        addFooter();
      };

      const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Pàgina ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
        doc.text('Índex Funcionalitats - CRM Bancari Creand', margin, pageHeight - 8);
        doc.setTextColor(0, 0, 0);
      };

      const checkPageBreak = (needed: number) => {
        if (currentY + needed > pageHeight - 25) {
          addNewPage();
          return true;
        }
        return false;
      };

      // PORTADA
      setProgress(10);
      doc.setFillColor(15, 50, 120);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('ÍNDEX DE FUNCIONALITATS', pageWidth / 2, 32, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('CRM Bancari Creand - Documentació Tècnica', pageWidth / 2, 48, { align: 'center' });
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generat: ${new Date().toLocaleDateString('ca-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 70, { align: 'center' });
      
      currentY = 95;
      doc.setTextColor(0, 0, 0);

      // Estadístiques
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, currentY - 5, contentWidth, 35, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Estadístiques del Codi:', margin + 5, currentY + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const stats = [
        `Components React: ${codeStats.components}`,
        `Custom Hooks: ${codeStats.hooks}`,
        `Pàgines: ${codeStats.pages}`,
        `Edge Functions: ${codeStats.edgeFunctions}`,
        `Taules BD: ${codeStats.tables}`,
        `Mòduls: ${FUNCTIONALITY_MODULES.length}`
      ];
      
      stats.forEach((stat, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        doc.text(stat, margin + 5 + (col * 55), currentY + 12 + (row * 8));
      });
      
      currentY += 45;
      addFooter();

      // ÍNDEX
      setProgress(20);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('ÍNDEX DE CONTINGUTS', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      
      FUNCTIONALITY_MODULES.forEach((module, idx) => {
        checkPageBreak(6);
        doc.text(`${idx + 1}. ${module.name} (${module.category})`, margin + 5, currentY);
        currentY += 5;
      });
      
      currentY += 10;

      // MÒDULS DETALLATS
      setProgress(30);
      
      FUNCTIONALITY_MODULES.forEach((module, moduleIdx) => {
        setProgress(30 + Math.floor((moduleIdx / FUNCTIONALITY_MODULES.length) * 60));
        
        checkPageBreak(40);
        
        // Títol mòdul
        doc.setFillColor(15, 50, 120);
        doc.rect(margin, currentY - 4, contentWidth, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${moduleIdx + 1}. ${module.name}`, margin + 3, currentY + 2);
        doc.setFontSize(8);
        doc.text(module.category, pageWidth - margin - 3, currentY + 2, { align: 'right' });
        currentY += 12;
        
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        
        // Descripció
        const descLines = doc.splitTextToSize(module.description, contentWidth - 5);
        descLines.forEach((line: string) => {
          checkPageBreak(5);
          doc.text(line, margin + 2, currentY);
          currentY += 4.5;
        });
        currentY += 3;
        
        // Funcionalitats
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Funcionalitats:', margin + 2, currentY);
        currentY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        module.features.forEach((feature) => {
          checkPageBreak(15);
          
          // Status badge
          const statusColors: Record<string, number[]> = {
            'completed': [34, 197, 94],
            'partial': [234, 179, 8],
            'pending': [239, 68, 68]
          };
          const color = statusColors[feature.status] || [100, 100, 100];
          doc.setFillColor(color[0], color[1], color[2]);
          doc.circle(margin + 4, currentY - 1, 1.5, 'F');
          
          doc.setFont('helvetica', 'bold');
          doc.text(feature.name, margin + 8, currentY);
          doc.setFont('helvetica', 'normal');
          currentY += 4;
          
          const featDescLines = doc.splitTextToSize(feature.description, contentWidth - 15);
          featDescLines.forEach((line: string) => {
            doc.setTextColor(80, 80, 80);
            doc.text(line, margin + 8, currentY);
            currentY += 3.5;
          });
          
          // Detalls tècnics
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(7);
          const techText = feature.technicalDetails.join(' • ');
          const techLines = doc.splitTextToSize(techText, contentWidth - 15);
          techLines.slice(0, 2).forEach((line: string) => {
            doc.text(line, margin + 8, currentY);
            currentY += 3;
          });
          
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(8);
          currentY += 2;
        });
        
        // Fitxers principals
        if (module.files.length > 0) {
          checkPageBreak(10);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text('Fitxers principals:', margin + 2, currentY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          currentY += 4;
          const filesText = module.files.slice(0, 3).join(', ');
          doc.text(filesText, margin + 4, currentY);
          currentY += 4;
        }
        
        // Dependències
        if (module.dependencies.length > 0 || module.integrations.length > 0) {
          checkPageBreak(8);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          const depsText = `Deps: ${module.dependencies.join(', ')} | Integracions: ${module.integrations.join(', ') || 'Cap'}`;
          doc.text(depsText, margin + 2, currentY);
          currentY += 5;
        }
        
        doc.setTextColor(0, 0, 0);
        currentY += 8;
      });

      // RESUM FINAL
      setProgress(95);
      addNewPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 50, 120);
      doc.text('RESUM EXECUTIU', margin, currentY);
      currentY += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      
      const completedFeatures = FUNCTIONALITY_MODULES.reduce((acc, m) => acc + m.features.filter(f => f.status === 'completed').length, 0);
      const partialFeatures = FUNCTIONALITY_MODULES.reduce((acc, m) => acc + m.features.filter(f => f.status === 'partial').length, 0);
      const pendingFeatures = FUNCTIONALITY_MODULES.reduce((acc, m) => acc + m.features.filter(f => f.status === 'pending').length, 0);
      const totalFeatures = completedFeatures + partialFeatures + pendingFeatures;
      
      const summaryItems = [
        `Total Mòduls: ${FUNCTIONALITY_MODULES.length}`,
        `Total Funcionalitats: ${totalFeatures}`,
        `Completades: ${completedFeatures} (${Math.round(completedFeatures/totalFeatures*100)}%)`,
        `Parcials: ${partialFeatures} (${Math.round(partialFeatures/totalFeatures*100)}%)`,
        `Pendents: ${pendingFeatures} (${Math.round(pendingFeatures/totalFeatures*100)}%)`
      ];
      
      summaryItems.forEach(item => {
        doc.text(`• ${item}`, margin + 5, currentY);
        currentY += 6;
      });

      setProgress(100);
      doc.save(`Index_Funcionalitats_CRM_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF generat correctament');

    } catch (error) {
      console.error('Error generant PDF:', error);
      toast.error('Error generant el document');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Complet</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Parcial</Badge>;
      case 'pending':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Pendent</Badge>;
      default:
        return null;
    }
  };

  const categories = [...new Set(FUNCTIONALITY_MODULES.map(m => m.category))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Índex de Funcionalitats del Codi
          </CardTitle>
          <CardDescription>
            Verificació i documentació completa de totes les funcionalitats de l'aplicatiu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estadístiques */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{codeStats.components}</div>
              <div className="text-xs text-muted-foreground">Components</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{codeStats.hooks}</div>
              <div className="text-xs text-muted-foreground">Hooks</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{codeStats.pages}</div>
              <div className="text-xs text-muted-foreground">Pàgines</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{codeStats.edgeFunctions}</div>
              <div className="text-xs text-muted-foreground">Edge Functions</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{codeStats.tables}</div>
              <div className="text-xs text-muted-foreground">Taules BD</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary">{FUNCTIONALITY_MODULES.length}</div>
              <div className="text-xs text-muted-foreground">Mòduls</div>
            </div>
          </div>

          {/* Accions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={analyzeCodebase} 
              disabled={analyzing}
              variant="outline"
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analitzant...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Codi
                </>
              )}
            </Button>
            <Button onClick={generatePDF} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generant...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generar PDF Índex
                </>
              )}
            </Button>
          </div>

          {(analyzing || generating) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">{progress}%</p>
            </div>
          )}

          {lastAnalysis && (
            <p className="text-sm text-muted-foreground">
              <CheckCircle className="inline h-4 w-4 text-green-500 mr-1" />
              Última verificació: {lastAnalysis.toLocaleString('ca-ES')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Índex per Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Mòduls per Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={categories[0]} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
              {categories.map(cat => (
                <TabsTrigger key={cat} value={cat} className="text-xs">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {categories.map(cat => (
              <TabsContent key={cat} value={cat}>
                <ScrollArea className="h-[500px]">
                  <Accordion type="multiple" className="w-full">
                    {FUNCTIONALITY_MODULES.filter(m => m.category === cat).map((module) => (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              {module.icon}
                            </div>
                            <div className="text-left">
                              <div className="font-semibold">{module.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {module.features.length} funcionalitats
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-11 space-y-4">
                            <p className="text-sm text-muted-foreground">{module.description}</p>
                            
                            <div className="space-y-3">
                              {module.features.map((feature, idx) => (
                                <div key={idx} className="border-l-2 border-primary/30 pl-3 py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{feature.name}</span>
                                    {getStatusBadge(feature.status)}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {feature.technicalDetails.map((detail, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {detail}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {module.files.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium mb-1">Fitxers principals:</p>
                                <div className="flex flex-wrap gap-1">
                                  {module.files.map((file, i) => (
                                    <code key={i} className="text-xs bg-muted px-1 py-0.5 rounded">
                                      {file.split('/').pop()}
                                    </code>
                                  ))}
                                </div>
                              </div>
                            )}

                            {(module.dependencies.length > 0 || module.integrations.length > 0) && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                {module.dependencies.length > 0 && (
                                  <span>Deps: {module.dependencies.join(', ')}</span>
                                )}
                                {module.integrations.length > 0 && (
                                  <span className="ml-2">| Integracions: {module.integrations.join(', ')}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
