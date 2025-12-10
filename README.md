# ObelixIA - CRM Bancario Inteligente

<div align="center">
  <h3>🏦 Plataforma CRM Bancaria con Inteligencia Artificial</h3>
  <p>Gestión comercial, análisis financiero y cumplimiento normativo para entidades bancarias</p>
</div>

---

## 📋 ¿Qué es ObelixIA?

**ObelixIA** es una plataforma CRM (Customer Relationship Management) diseñada específicamente para el sector bancario. Combina gestión comercial tradicional con capacidades de inteligencia artificial para optimizar la relación con clientes, el análisis financiero y el cumplimiento regulatorio.

### Características principales

- 🗺️ **Gestión Geográfica**: Visualización y gestión de clientes en mapa interactivo
- 📊 **Análisis Financiero**: Estados financieros, ratios, y análisis de riesgo
- 🎯 **Objetivos y Metas**: Sistema de KPIs y seguimiento de rendimiento comercial
- 📅 **Calendario de Visitas**: Planificación y registro de visitas comerciales
- 🔐 **Seguridad Bancaria**: Autenticación multifactor, cumplimiento PSD3, DORA/NIS2
- 🤖 **IA Integrada**: Análisis predictivo y recomendaciones automatizadas
- 📱 **Diseño Responsive**: Funciona en desktop, tablet y móvil

---

## 🛠️ Tecnología

| Categoría | Tecnología |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **Estilos** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Mapas** | MapLibre GL |
| **Gráficos** | Recharts |
| **IA** | Lovable AI (Gemini 2.5) |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o bun

### Instalación local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>

# 2. Entrar al directorio
cd obelixia

# 3. Instalar dependencias
npm install

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Variables de entorno

La aplicación requiere conexión a Supabase. Las variables se configuran automáticamente en el entorno de Lovable.

---

## 📂 Estructura del Proyecto

```
src/
├── components/         # Componentes React reutilizables
│   ├── admin/         # Paneles de administración
│   ├── auth/          # Autenticación y seguridad
│   ├── company/       # Gestión de empresas/clientes
│   ├── dashboard/     # Dashboards y métricas
│   ├── map/           # Componentes del mapa
│   └── ui/            # Componentes UI base (shadcn)
├── contexts/          # Contextos React (tema, idioma, etc.)
├── hooks/             # Custom hooks
├── lib/               # Utilidades y helpers
├── locales/           # Traducciones (es, en, ca, fr)
├── pages/             # Páginas de la aplicación
└── integrations/      # Integraciones (Supabase)

supabase/
├── functions/         # Edge Functions (backend serverless)
└── migrations/        # Migraciones de base de datos
```

---

## 🔐 Seguridad y Cumplimiento

ObelixIA implementa múltiples capas de seguridad para cumplir con normativas bancarias:

- **PSD3/SCA**: Autenticación fuerte del cliente
- **DORA/NIS2**: Resiliencia operativa digital
- **ISO 27001**: Marco de seguridad de la información
- **GDPR/APDA**: Protección de datos personales
- **Basel III/IV**: Métricas de capital y liquidez

---

## 🌐 Demo

Accede a la demo en: [Tu URL de Lovable]

---

## 📄 Licencia

Propietario. Todos los derechos reservados.

---

## 📞 Contacto

Para más información sobre ObelixIA, contacta con el equipo de desarrollo.

---

<div align="center">
  <strong>ObelixIA</strong> - CRM Bancario Inteligente con IA
</div>
