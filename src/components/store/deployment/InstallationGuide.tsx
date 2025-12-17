import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Server, Database, Shield, Settings, AlertTriangle, FileCode, Terminal } from "lucide-react";

export function InstallationGuide() {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Guía de Instalación</h2>
        <p className="text-muted-foreground">
          Documentación completa para despliegue on-premise de ObelixIA
        </p>
      </div>

      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Requisitos del Sistema
          </CardTitle>
          <CardDescription>
            Hardware y software mínimo necesario para la instalación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Hardware Mínimo
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  CPU: 4 cores (8 recomendados)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  RAM: 8 GB (16 GB recomendados)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Disco: 50 GB SSD (100 GB recomendados)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Red: 100 Mbps (1 Gbps recomendado)
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Software Requerido
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  PostgreSQL ≥ 14.0
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Node.js ≥ 18.0
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Docker ≥ 20.0 (opcional)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  nginx o Apache
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Pasos de Instalación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step1">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 1</Badge>
                  Preparar el Entorno
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Descomprime el paquete descargado y configura las variables de entorno.
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# Descomprimir paquete
unzip obelixia-on-premise-*.zip -d /opt/obelixia
cd /opt/obelixia

# Copiar y editar configuración
cp config/.env.template .env
nano .env`}
                </pre>
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <p className="text-sm">
                      Asegúrate de configurar una contraseña segura para la base de datos
                      y un JWT_SECRET de al menos 32 caracteres.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step2">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 2</Badge>
                  Configurar PostgreSQL
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Crea la base de datos y ejecuta los scripts de inicialización.
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# Con Docker
docker-compose up -d postgres

# O instalación local
sudo -u postgres createdb obelixia
sudo -u postgres psql -c "CREATE USER obelixia WITH PASSWORD 'tu-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE obelixia TO obelixia;"

# Ejecutar esquema y migraciones
psql -U obelixia -d obelixia -f database/schema.sql
psql -U obelixia -d obelixia -f database/migrations.sql
psql -U obelixia -d obelixia -f database/functions.sql
psql -U obelixia -d obelixia -f database/rls-policies.sql`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step3">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 3</Badge>
                  Compilar Frontend
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Compila la aplicación React para producción.
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`cd frontend

# Instalar dependencias
npm install

# Configurar variables de producción
cp .env.production.template .env.production
nano .env.production

# Compilar
npm run build

# Los archivos estarán en dist/`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step4">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 4</Badge>
                  Configurar SSL y Nginx
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configura el servidor web y los certificados SSL.
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# Crear directorio SSL
mkdir -p ssl

# Opción A: Let's Encrypt (recomendado)
certbot certonly --standalone -d tu-dominio.com
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem ssl/cert.pem
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem ssl/key.pem

# Opción B: Certificado existente
cp /path/to/cert.pem ssl/
cp /path/to/key.pem ssl/

# Copiar configuración nginx
cp config/nginx.conf /etc/nginx/nginx.conf
nginx -t && systemctl restart nginx`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step5">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 5</Badge>
                  Iniciar Servicios
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Inicia todos los servicios y verifica la instalación.
                </p>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# Con Docker Compose (recomendado)
docker-compose up -d

# Verificar estado
docker-compose ps
docker-compose logs -f

# Sin Docker
# Iniciar functions API
cd functions && node node-adapter.js &

# Verificar instalación
curl https://localhost/health
curl https://localhost/api/health`}
                </pre>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step6">
              <AccordionTrigger>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Paso 6</Badge>
                  Post-Instalación
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configuraciones adicionales recomendadas para producción.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>Crear usuario administrador:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 text-xs">
{`INSERT INTO profiles (email, full_name, role) 
VALUES ('admin@empresa.com', 'Administrador', 'superadmin');`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>Configurar backups automáticos:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 text-xs">
{`# Añadir a crontab
0 2 * * * pg_dump -U obelixia -F c obelixia > /backups/obelixia_$(date +%Y%m%d).dump`}
                      </pre>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>Ejecutar hardening de seguridad:</strong>
                      <pre className="bg-muted p-2 rounded mt-1 text-xs">
{`chmod +x security/hardening.sh
sudo ./security/hardening.sh`}
                      </pre>
                    </div>
                  </li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Security Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consideraciones de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Firewall",
                description: "Configurar UFW/iptables permitiendo solo puertos 22, 80, 443"
              },
              {
                title: "SSL/TLS",
                description: "Usar TLS 1.3, deshabilitar protocolos antiguos"
              },
              {
                title: "Contraseñas",
                description: "Mínimo 16 caracteres, incluyendo símbolos y números"
              },
              {
                title: "Actualizaciones",
                description: "Mantener sistema operativo y dependencias actualizadas"
              },
              {
                title: "Backups",
                description: "Backups diarios cifrados con retención de 90 días"
              },
              {
                title: "Auditoría",
                description: "Habilitar logs de auditoría y revisión semanal"
              }
            ].map((item, i) => (
              <div key={i} className="p-3 border rounded-lg">
                <h4 className="font-medium text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Configuración de PostgreSQL
          </CardTitle>
          <CardDescription>
            Optimizaciones recomendadas para producción
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# postgresql.conf - Optimizaciones para ObelixIA

# Memoria
shared_buffers = 2GB                    # 25% de RAM total
effective_cache_size = 6GB              # 75% de RAM total
maintenance_work_mem = 512MB
work_mem = 64MB

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 64MB
min_wal_size = 1GB
max_wal_size = 4GB

# Query Planner
default_statistics_target = 100
random_page_cost = 1.1                  # Para SSD
effective_io_concurrency = 200          # Para SSD

# Conexiones
max_connections = 200
superuser_reserved_connections = 3

# Logging
log_min_duration_statement = 1000       # Queries > 1s
log_checkpoints = on
log_connections = on
log_disconnections = on`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
