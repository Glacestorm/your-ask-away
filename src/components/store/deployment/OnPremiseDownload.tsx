import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Package, FileCode, Database, Settings, Server, Shield, CheckCircle2, Loader2, Copy, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import JSZip from "jszip";

type DeploymentType = "saas" | "on-premise" | "hybrid";

interface OnPremiseDownloadProps {
  selectedType: DeploymentType;
}

interface PackageComponent {
  id: string;
  name: string;
  description: string;
  size: string;
  required: boolean;
  icon: React.ReactNode;
}

const packageComponents: PackageComponent[] = [
  {
    id: "frontend",
    name: "Frontend Application",
    description: "React + Vite build optimizado para producción",
    size: "~15 MB",
    required: true,
    icon: <FileCode className="h-5 w-5" />
  },
  {
    id: "database",
    name: "Database Scripts",
    description: "Esquema PostgreSQL, migraciones, funciones y RLS",
    size: "~2 MB",
    required: true,
    icon: <Database className="h-5 w-5" />
  },
  {
    id: "edge-functions",
    name: "Edge Functions",
    description: "Funciones serverless adaptadas para Deno/Node.js",
    size: "~5 MB",
    required: true,
    icon: <Server className="h-5 w-5" />
  },
  {
    id: "config",
    name: "Configuration Files",
    description: "Docker, nginx, env templates, SSL",
    size: "~500 KB",
    required: true,
    icon: <Settings className="h-5 w-5" />
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Guías de instalación, configuración y mantenimiento",
    size: "~3 MB",
    required: false,
    icon: <Package className="h-5 w-5" />
  },
  {
    id: "security",
    name: "Security Hardening",
    description: "Scripts de hardening, WAF rules, audit configs",
    size: "~1 MB",
    required: false,
    icon: <Shield className="h-5 w-5" />
  }
];

export function OnPremiseDownload({ selectedType }: OnPremiseDownloadProps) {
  const [selectedComponents, setSelectedComponents] = useState<string[]>(
    packageComponents.filter(c => c.required).map(c => c.id)
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [licenseKey, setLicenseKey] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const toggleComponent = (id: string) => {
    const component = packageComponents.find(c => c.id === id);
    if (component?.required) return;
    
    setSelectedComponents(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const generatePackage = async () => {
    if (!acceptedTerms) {
      toast.error("Debe aceptar los términos de licencia");
      return;
    }

    if (!companyName) {
      toast.error("Debe indicar el nombre de la empresa");
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const zip = new JSZip();
      
      // Simulate progress for each component
      for (let i = 0; i < selectedComponents.length; i++) {
        const componentId = selectedComponents[i];
        setProgress(((i + 1) / selectedComponents.length) * 100);
        
        // Add component-specific files
        if (componentId === "frontend") {
          zip.folder("frontend")?.file("README.md", generateFrontendReadme());
          zip.folder("frontend")?.file("build-instructions.md", generateBuildInstructions());
          zip.folder("frontend")?.file(".env.production.template", generateEnvTemplate());
        }
        
        if (componentId === "database") {
          zip.folder("database")?.file("schema.sql", generateDatabaseSchema());
          zip.folder("database")?.file("migrations.sql", generateMigrations());
          zip.folder("database")?.file("functions.sql", generateFunctions());
          zip.folder("database")?.file("rls-policies.sql", generateRLSPolicies());
          zip.folder("database")?.file("seed-data.sql", generateSeedData());
        }
        
        if (componentId === "edge-functions") {
          zip.folder("functions")?.file("README.md", generateFunctionsReadme());
          zip.folder("functions")?.file("deno-adapter.ts", generateDenoAdapter());
          zip.folder("functions")?.file("node-adapter.js", generateNodeAdapter());
        }
        
        if (componentId === "config") {
          zip.folder("config")?.file("docker-compose.yml", generateDockerCompose());
          zip.folder("config")?.file("nginx.conf", generateNginxConfig());
          zip.folder("config")?.file("Dockerfile", generateDockerfile());
          zip.folder("config")?.file(".env.template", generateMainEnvTemplate());
        }
        
        if (componentId === "docs") {
          zip.folder("docs")?.file("INSTALLATION.md", generateInstallationDoc());
          zip.folder("docs")?.file("CONFIGURATION.md", generateConfigurationDoc());
          zip.folder("docs")?.file("MAINTENANCE.md", generateMaintenanceDoc());
          zip.folder("docs")?.file("TROUBLESHOOTING.md", generateTroubleshootingDoc());
        }
        
        if (componentId === "security") {
          zip.folder("security")?.file("hardening.sh", generateHardeningScript());
          zip.folder("security")?.file("waf-rules.conf", generateWAFRules());
          zip.folder("security")?.file("audit-config.yml", generateAuditConfig());
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Add license file
      zip.file("LICENSE.txt", generateLicenseFile(companyName, licenseKey));
      zip.file("VERSION.txt", "ObelixIA v8.0.0\nBuild: " + new Date().toISOString());

      // Generate and download
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `obelixia-${selectedType}-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Paquete generado correctamente");
    } catch (error) {
      console.error("Error generating package:", error);
      toast.error("Error al generar el paquete");
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success("Comando copiado");
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">
          Descarga {selectedType === "on-premise" ? "On-Premise" : "Híbrido"}
        </h2>
        <p className="text-muted-foreground">
          Selecciona los componentes y genera tu paquete de instalación personalizado
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Components Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Componentes del Paquete
              </CardTitle>
              <CardDescription>
                Selecciona los componentes que necesitas para tu instalación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {packageComponents.map((component, index) => (
                <motion.div
                  key={component.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedComponents.includes(component.id)
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                  } ${component.required ? "cursor-default" : ""}`}
                  onClick={() => toggleComponent(component.id)}
                >
                  <Checkbox
                    checked={selectedComponents.includes(component.id)}
                    disabled={component.required}
                    onCheckedChange={() => toggleComponent(component.id)}
                  />
                  <div className={`p-2 rounded-lg ${
                    selectedComponents.includes(component.id)
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {component.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{component.name}</h4>
                      {component.required && (
                        <Badge variant="secondary" className="text-xs">Requerido</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                    <span className="text-xs text-muted-foreground">{component.size}</span>
                  </div>
                  {selectedComponents.includes(component.id) && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Start Commands */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                Comandos de Instalación Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Descomprimir paquete", command: "unzip obelixia-on-premise-*.zip -d obelixia" },
                { label: "Configurar variables", command: "cp config/.env.template .env && nano .env" },
                { label: "Iniciar PostgreSQL", command: "docker-compose up -d postgres" },
                { label: "Ejecutar migraciones", command: "psql -f database/schema.sql && psql -f database/migrations.sql" },
                { label: "Build frontend", command: "cd frontend && npm install && npm run build" },
                { label: "Iniciar servicios", command: "docker-compose up -d" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <code className="flex-1 bg-muted p-2 rounded text-sm font-mono">
                    {item.command}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyCommand(item.command)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Download Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Generar Paquete
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Nombre de Empresa *</Label>
                <Input
                  id="company"
                  placeholder="Mi Empresa S.A."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">Clave de Licencia (opcional)</Label>
                <Input
                  id="license"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Si ya tiene una licencia, introdúzcala. Si no, se generará una de evaluación.
                </p>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Acepto los términos de licencia de ObelixIA y las condiciones de uso del software.
                </label>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-muted-foreground">
                    Generando paquete... {Math.round(progress)}%
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={generatePackage}
                disabled={isGenerating || !acceptedTerms || !companyName}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Paquete
                  </>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Tamaño estimado: ~{
                  selectedComponents.reduce((acc, id) => {
                    const comp = packageComponents.find(c => c.id === id);
                    const size = parseInt(comp?.size.replace(/[^0-9]/g, "") || "0");
                    return acc + size;
                  }, 0)
                } MB
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Requisitos del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PostgreSQL</span>
                <span>≥ 14.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node.js</span>
                <span>≥ 18.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Docker</span>
                <span>≥ 20.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RAM</span>
                <span>≥ 8 GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Disco</span>
                <span>≥ 50 GB SSD</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// File generation functions
function generateFrontendReadme(): string {
  return `# ObelixIA Frontend

## Requisitos
- Node.js >= 18.0
- npm >= 9.0

## Instalación
\`\`\`bash
npm install
npm run build
\`\`\`

## Configuración
Copie \`.env.production.template\` a \`.env.production\` y configure las variables.

## Producción
Los archivos compilados estarán en \`dist/\`.
Sirva con nginx o cualquier servidor web estático.
`;
}

function generateBuildInstructions(): string {
  return `# Instrucciones de Build

## Desarrollo
\`\`\`bash
npm run dev
\`\`\`

## Producción
\`\`\`bash
npm run build
npm run preview # Para probar localmente
\`\`\`

## Variables de Entorno Requeridas
- VITE_SUPABASE_URL: URL de tu instancia Supabase/PostgreSQL
- VITE_SUPABASE_ANON_KEY: Clave anónima de Supabase
- VITE_API_URL: URL de tu backend API
`;
}

function generateEnvTemplate(): string {
  return `# ObelixIA Environment Configuration
# Copy this file to .env.production and fill in your values

VITE_SUPABASE_URL=https://your-supabase-instance.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id

# API Configuration
VITE_API_URL=https://your-api-domain.com

# Feature Flags
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_ANALYTICS=true
`;
}

function generateDatabaseSchema(): string {
  return `-- ObelixIA Database Schema
-- PostgreSQL >= 14.0 Required

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Core Tables
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'gestor',
    oficina TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    parroquia TEXT NOT NULL,
    gestor_id UUID REFERENCES profiles(id),
    sector TEXT,
    cnae TEXT,
    email TEXT,
    phone TEXT,
    turnover DECIMAL,
    employees INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add more tables as needed...
-- See migrations.sql for complete schema
`;
}

function generateMigrations(): string {
  return `-- ObelixIA Database Migrations
-- Run in order after schema.sql

-- Migration 001: Add financial statements
CREATE TABLE IF NOT EXISTS company_financial_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    fiscal_year INTEGER NOT NULL,
    statement_type TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 002: Add visits
CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    gestor_id UUID REFERENCES profiles(id),
    date DATE NOT NULL,
    result TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 003: Add goals
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gestor_id UUID REFERENCES profiles(id),
    target_type TEXT NOT NULL,
    target_value DECIMAL NOT NULL,
    current_value DECIMAL DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add more migrations as needed...
`;
}

function generateFunctions(): string {
  return `-- ObelixIA Database Functions

-- Function: Check if user is admin
CREATE OR REPLACE FUNCTION is_admin_or_superadmin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role IN ('admin', 'superadmin', 'director_comercial')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    RETURN COALESCE(user_role, 'gestor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_companies_timestamp
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;
}

function generateRLSPolicies(): string {
  return `-- ObelixIA Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin_or_superadmin(auth.uid()));

-- Companies policies
CREATE POLICY "Gestors can view assigned companies"
    ON companies FOR SELECT
    USING (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Gestors can update assigned companies"
    ON companies FOR UPDATE
    USING (gestor_id = auth.uid() OR is_admin_or_superadmin(auth.uid()));

-- Add more policies as needed...
`;
}

function generateSeedData(): string {
  return `-- ObelixIA Seed Data (Optional)
-- Sample data for testing

-- Sample sectors
INSERT INTO cnae_sector_mapping (cnae_code, sector, sector_name) VALUES
('6411', 'banking', 'Banca Central'),
('6419', 'banking', 'Otra Intermediación Monetaria'),
('6511', 'insurance', 'Seguros de Vida'),
('6512', 'insurance', 'Seguros Distintos de Vida')
ON CONFLICT DO NOTHING;

-- Sample status colors
INSERT INTO status_colors (name, color) VALUES
('Activo', '#22c55e'),
('Inactivo', '#ef4444'),
('Pendiente', '#f59e0b'),
('En revisión', '#3b82f6')
ON CONFLICT DO NOTHING;
`;
}

function generateFunctionsReadme(): string {
  return `# ObelixIA Edge Functions

## Descripción
Este directorio contiene las funciones serverless de ObelixIA,
adaptadas para ejecutarse en Deno (Supabase) o Node.js.

## Adaptadores
- \`deno-adapter.ts\`: Para despliegue en Supabase/Deno
- \`node-adapter.js\`: Para despliegue en Node.js/Express

## Funciones Disponibles
- analyze-codebase: Análisis de código con IA
- generate-action-plan: Generación de planes de acción
- geocode-address: Geocodificación de direcciones
- parse-financial-pdf: Parsing de documentos financieros

## Despliegue
Ver documentación específica de cada plataforma.
`;
}

function generateDenoAdapter(): string {
  return `// Deno Adapter for ObelixIA Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    
    // Route to appropriate function
    let result;
    switch (action) {
      case 'analyze':
        result = await analyzeCode(data);
        break;
      default:
        throw new Error('Unknown action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function analyzeCode(data: any) {
  // Implementation here
  return { success: true };
}
`;
}

function generateNodeAdapter(): string {
  return `// Node.js Adapter for ObelixIA Edge Functions
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '8.0.0' });
});

// Main function endpoint
app.post('/functions/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const data = req.body;

    let result;
    switch (name) {
      case 'analyze-codebase':
        result = await analyzeCodebase(data);
        break;
      case 'geocode-address':
        result = await geocodeAddress(data);
        break;
      default:
        return res.status(404).json({ error: 'Function not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function analyzeCodebase(data) {
  // Implementation
  return { success: true };
}

async function geocodeAddress(data) {
  // Implementation using local geocoding or Nominatim
  return { success: true };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`ObelixIA Functions running on port \${PORT}\`);
});

module.exports = app;
`;
}

function generateDockerCompose(): string {
  return `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: obelixia-db
    environment:
      POSTGRES_DB: obelixia
      POSTGRES_USER: \${DB_USER:-obelixia}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U obelixia"]
      interval: 10s
      timeout: 5s
      retries: 5

  frontend:
    build:
      context: ./frontend
      dockerfile: ../config/Dockerfile
    container_name: obelixia-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./config/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - postgres
      - functions

  functions:
    build:
      context: ./functions
      dockerfile: Dockerfile.functions
    container_name: obelixia-functions
    environment:
      - DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@postgres:5432/obelixia
      - JWT_SECRET=\${JWT_SECRET}
    ports:
      - "3001:3001"
    depends_on:
      - postgres

volumes:
  postgres_data:
`;
}

function generateNginxConfig(): string {
  return `# ObelixIA Nginx Configuration

worker_processes auto;
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    server {
        listen 80;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        root /usr/share/nginx/html;
        index index.html;

        # SPA routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api/ {
            proxy_pass http://functions:3001/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Static assets caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
`;
}

function generateDockerfile(): string {
  return `# ObelixIA Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
`;
}

function generateMainEnvTemplate(): string {
  return `# ObelixIA Main Environment Configuration

# Database
DB_USER=obelixia
DB_PASSWORD=your-secure-password-here
DATABASE_URL=postgresql://obelixia:password@localhost:5432/obelixia

# Security
JWT_SECRET=your-jwt-secret-minimum-32-characters
ENCRYPTION_KEY=your-256-bit-encryption-key

# External Services (optional)
MAPBOX_TOKEN=your-mapbox-token
RESEND_API_KEY=your-resend-key

# AI Services (optional)
GEMINI_API_KEY=your-gemini-key

# Feature Flags
ENABLE_DEMO_MODE=false
ENABLE_ANALYTICS=true
`;
}

function generateInstallationDoc(): string {
  return `# Guía de Instalación ObelixIA On-Premise

## Requisitos Previos
- Docker >= 20.0
- Docker Compose >= 2.0
- 8 GB RAM mínimo (16 GB recomendado)
- 50 GB espacio en disco SSD
- Certificado SSL válido

## Pasos de Instalación

### 1. Descomprimir el paquete
\`\`\`bash
unzip obelixia-on-premise-*.zip -d /opt/obelixia
cd /opt/obelixia
\`\`\`

### 2. Configurar variables de entorno
\`\`\`bash
cp config/.env.template .env
nano .env  # Editar con tus valores
\`\`\`

### 3. Configurar SSL
\`\`\`bash
mkdir -p ssl
cp /path/to/your/cert.pem ssl/
cp /path/to/your/key.pem ssl/
\`\`\`

### 4. Iniciar servicios
\`\`\`bash
docker-compose up -d
\`\`\`

### 5. Verificar instalación
\`\`\`bash
docker-compose ps
curl https://localhost/health
\`\`\`

## Post-Instalación
- Crear usuario administrador inicial
- Configurar backups automáticos
- Revisar logs de seguridad

## Soporte
Contactar: soporte@obelixia.com
`;
}

function generateConfigurationDoc(): string {
  return `# Guía de Configuración ObelixIA

## Variables de Entorno

### Base de Datos
- \`DB_USER\`: Usuario de PostgreSQL
- \`DB_PASSWORD\`: Contraseña de PostgreSQL
- \`DATABASE_URL\`: URL completa de conexión

### Seguridad
- \`JWT_SECRET\`: Secreto para tokens JWT (mínimo 32 caracteres)
- \`ENCRYPTION_KEY\`: Clave para encriptación AES-256

### Servicios Externos
- \`MAPBOX_TOKEN\`: Token de Mapbox (para mapas)
- \`RESEND_API_KEY\`: API key de Resend (para emails)

## Configuración de PostgreSQL

### Optimización para producción
\`\`\`sql
-- postgresql.conf
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 64MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
\`\`\`

## Configuración de Nginx
Ver archivo \`nginx.conf\` para configuración detallada.

## Certificados SSL
Recomendamos usar Let's Encrypt para certificados gratuitos.
`;
}

function generateMaintenanceDoc(): string {
  return `# Guía de Mantenimiento ObelixIA

## Backups

### Backup de Base de Datos
\`\`\`bash
# Backup completo
pg_dump -U obelixia -F c obelixia > backup_$(date +%Y%m%d).dump

# Restaurar
pg_restore -U obelixia -d obelixia backup_20240101.dump
\`\`\`

### Backup de Archivos
\`\`\`bash
tar -czf obelixia_files_$(date +%Y%m%d).tar.gz /opt/obelixia
\`\`\`

## Actualizaciones

### Actualizar aplicación
\`\`\`bash
docker-compose down
# Reemplazar archivos con nueva versión
docker-compose up -d --build
\`\`\`

### Actualizar base de datos
\`\`\`bash
psql -U obelixia -f database/migrations.sql
\`\`\`

## Monitorización

### Logs
\`\`\`bash
docker-compose logs -f frontend
docker-compose logs -f postgres
\`\`\`

### Salud del sistema
\`\`\`bash
curl https://localhost/health
docker stats
\`\`\`
`;
}

function generateTroubleshootingDoc(): string {
  return `# Guía de Resolución de Problemas

## Problemas Comunes

### Error de conexión a base de datos
1. Verificar que PostgreSQL está ejecutándose:
   \`docker-compose ps postgres\`
2. Verificar credenciales en .env
3. Revisar logs: \`docker-compose logs postgres\`

### Frontend no carga
1. Verificar que nginx está ejecutándose
2. Comprobar certificados SSL
3. Revisar logs: \`docker-compose logs frontend\`

### Errores de autenticación
1. Verificar JWT_SECRET está configurado
2. Comprobar sincronización de relojes
3. Limpiar caché del navegador

### Rendimiento lento
1. Revisar uso de recursos: \`docker stats\`
2. Optimizar consultas PostgreSQL
3. Aumentar recursos asignados a contenedores

## Logs de Debug
\`\`\`bash
# Habilitar logs de debug
export DEBUG=true
docker-compose up
\`\`\`

## Contacto de Soporte
Email: soporte@obelixia.com
Teléfono: +376 XXX XXX
`;
}

function generateHardeningScript(): string {
  return `#!/bin/bash
# ObelixIA Security Hardening Script

echo "=== ObelixIA Security Hardening ==="

# Update system
apt-get update && apt-get upgrade -y

# Configure firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Secure SSH
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Set secure permissions
chmod 600 /opt/obelixia/.env
chmod 600 /opt/obelixia/ssl/*

# Configure fail2ban
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Audit logging
apt-get install -y auditd
systemctl enable auditd
auditctl -e 1

echo "=== Hardening Complete ==="
`;
}

function generateWAFRules(): string {
  return `# ObelixIA WAF Rules (ModSecurity format)

# Block SQL Injection attempts
SecRule ARGS "@detectSQLi" "id:1001,phase:2,deny,status:403,msg:'SQL Injection Attempt'"

# Block XSS attempts
SecRule ARGS "@detectXSS" "id:1002,phase:2,deny,status:403,msg:'XSS Attempt'"

# Block path traversal
SecRule ARGS "@contains ../" "id:1003,phase:2,deny,status:403,msg:'Path Traversal Attempt'"

# Rate limiting
SecRule IP:REQUEST_RATE "@gt 100" "id:1004,phase:1,deny,status:429,msg:'Rate Limit Exceeded'"

# Block sensitive files
SecRule REQUEST_URI "@contains .env" "id:1005,phase:1,deny,status:403"
SecRule REQUEST_URI "@contains .git" "id:1006,phase:1,deny,status:403"

# Force HTTPS
SecRule SERVER_PORT "!@eq 443" "id:1007,phase:1,redirect:https://%{SERVER_NAME}%{REQUEST_URI}"
`;
}

function generateAuditConfig(): string {
  return `# ObelixIA Audit Configuration

audit:
  enabled: true
  level: detailed
  
  events:
    - authentication
    - authorization
    - data_access
    - data_modification
    - admin_actions
    - security_events
    
  retention:
    days: 365
    compression: true
    
  output:
    - type: file
      path: /var/log/obelixia/audit.log
      rotation: daily
      
    - type: syslog
      facility: auth
      
  alerts:
    - event: failed_login
      threshold: 5
      window: 300
      action: email
      
    - event: privilege_escalation
      threshold: 1
      action: immediate_alert
`;
}

function generateLicenseFile(company: string, key: string): string {
  const licenseKey = key || `EVAL-${Date.now().toString(36).toUpperCase()}`;
  return `ObelixIA Enterprise License

Licenciado a: ${company}
Clave de Licencia: ${licenseKey}
Fecha de Emisión: ${new Date().toISOString().split('T')[0]}
Tipo: ${key ? 'Perpetua' : 'Evaluación (30 días)'}

TÉRMINOS Y CONDICIONES

1. Esta licencia otorga el derecho de uso del software ObelixIA
   en los servidores propiedad de "${company}".

2. Está prohibida la redistribución, sublicencia o venta del software
   sin autorización expresa de ObelixIA.

3. El software se proporciona "tal cual" sin garantías expresas
   o implícitas más allá de las establecidas por ley.

4. Para soporte técnico, contactar: soporte@obelixia.com

© ${new Date().getFullYear()} ObelixIA. Todos los derechos reservados.
`;
}
