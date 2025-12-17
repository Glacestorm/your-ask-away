import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud, Server, Building2, Shield, Download, FileText, Database, Settings, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";
import { SectorRecommendations } from "./SectorRecommendations";
import { OnPremiseDownload } from "./OnPremiseDownload";
import { InstallationGuide } from "./InstallationGuide";

type DeploymentType = "saas" | "on-premise" | "hybrid";

interface DeploymentOption {
  type: DeploymentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  pros: string[];
  cons: string[];
  price: string;
  recommended: string[];
  compliance: string[];
}

const deploymentOptions: DeploymentOption[] = [
  {
    type: "saas",
    title: "SaaS Cloud",
    description: "Acceso web inmediato sin instalación. Actualizaciones automáticas y mantenimiento incluido.",
    icon: <Cloud className="h-8 w-8" />,
    pros: [
      "Sin infraestructura propia",
      "Actualizaciones automáticas",
      "Escalabilidad instantánea",
      "Soporte 24/7 incluido",
      "Backups automáticos"
    ],
    cons: [
      "Datos en cloud externo",
      "Dependencia de conexión",
      "Menor control sobre datos"
    ],
    price: "Desde 2.500€/mes",
    recommended: ["Fintech", "Startups", "PYMES", "Aseguradoras pequeñas"],
    compliance: ["GDPR", "ISO 27001", "SOC 2"]
  },
  {
    type: "on-premise",
    title: "On-Premise",
    description: "Instalación en servidores propios con control total de datos y personalización completa.",
    icon: <Server className="h-8 w-8" />,
    pros: [
      "Control total de datos",
      "Máxima seguridad",
      "Sin dependencia externa",
      "Personalización completa",
      "Cumplimiento normativo total"
    ],
    cons: [
      "Requiere infraestructura",
      "Mantenimiento propio",
      "Actualizaciones manuales"
    ],
    price: "880.000€ licencia perpetua",
    recommended: ["Banca tradicional", "Entidades reguladas", "Gobierno", "Sanidad"],
    compliance: ["DORA", "NIS2", "PSD2", "MiFID II", "HIPAA", "Basel III/IV"]
  },
  {
    type: "hybrid",
    title: "Híbrido",
    description: "Datos sensibles on-premise + funcionalidades cloud. Lo mejor de ambos mundos.",
    icon: <Building2 className="h-8 w-8" />,
    pros: [
      "Datos críticos locales",
      "Funcionalidades cloud",
      "Flexibilidad máxima",
      "Escalabilidad selectiva"
    ],
    cons: [
      "Complejidad de gestión",
      "Costes mixtos",
      "Configuración avanzada"
    ],
    price: "440.000€ + 1.200€/mes",
    recommended: ["Banca mediana", "Holdings", "Multinacionales", "Retail financiero"],
    compliance: ["GDPR", "DORA", "ISO 27001", "PCI-DSS"]
  }
];

export function DeploymentOptionsPage() {
  const [selectedType, setSelectedType] = useState<DeploymentType | null>(null);
  const [activeTab, setActiveTab] = useState("options");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Opciones de Despliegue</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Elige el modelo de despliegue que mejor se adapte a las necesidades 
            de seguridad y cumplimiento normativo de tu organización.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="options" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Opciones
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Por Sector
            </TabsTrigger>
            <TabsTrigger value="download" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descarga
            </TabsTrigger>
            <TabsTrigger value="guide" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Guía
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options">
            {/* Deployment Options Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {deploymentOptions.map((option, index) => (
                <motion.div
                  key={option.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`h-full cursor-pointer transition-all hover:shadow-lg ${
                      selectedType === option.type 
                        ? "ring-2 ring-primary border-primary" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedType(option.type)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-3 rounded-lg ${
                          option.type === "saas" ? "bg-blue-500/10 text-blue-500" :
                          option.type === "on-premise" ? "bg-green-500/10 text-green-500" :
                          "bg-purple-500/10 text-purple-500"
                        }`}>
                          {option.icon}
                        </div>
                        {option.type === "on-premise" && (
                          <Badge variant="default" className="bg-green-500">
                            Recomendado Banca
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{option.title}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Price */}
                      <div className="text-2xl font-bold text-primary">
                        {option.price}
                      </div>

                      {/* Pros */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Ventajas
                        </h4>
                        <ul className="space-y-1">
                          {option.pros.map((pro, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-green-500 mt-1">•</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          Consideraciones
                        </h4>
                        <ul className="space-y-1">
                          {option.cons.map((con, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Compliance */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-blue-500" />
                          Cumplimiento
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {option.compliance.map((comp, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {comp}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Recommended for */}
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          Recomendado para
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {option.recommended.map((rec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {rec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4"
                        variant={selectedType === option.type ? "default" : "outline"}
                        onClick={() => {
                          setSelectedType(option.type);
                          if (option.type === "on-premise" || option.type === "hybrid") {
                            setActiveTab("download");
                          }
                        }}
                      >
                        {option.type === "saas" ? "Contratar SaaS" : "Descargar Paquete"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Comparativa Detallada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Característica</th>
                        <th className="text-center py-3 px-4">SaaS Cloud</th>
                        <th className="text-center py-3 px-4">On-Premise</th>
                        <th className="text-center py-3 px-4">Híbrido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Control de datos", saas: "Parcial", onprem: "Total", hybrid: "Alto" },
                        { feature: "Tiempo de implementación", saas: "Inmediato", onprem: "2-4 semanas", hybrid: "1-2 semanas" },
                        { feature: "Actualizaciones", saas: "Automáticas", onprem: "Manuales", hybrid: "Mixtas" },
                        { feature: "Escalabilidad", saas: "Ilimitada", onprem: "Según HW", hybrid: "Flexible" },
                        { feature: "Personalización", saas: "Limitada", onprem: "Total", hybrid: "Alta" },
                        { feature: "Cumplimiento DORA", saas: "Parcial", onprem: "Total", hybrid: "Total" },
                        { feature: "Cumplimiento NIS2", saas: "Parcial", onprem: "Total", hybrid: "Total" },
                        { feature: "Air-gap posible", saas: "No", onprem: "Sí", hybrid: "Parcial" },
                        { feature: "Soporte incluido", saas: "24/7", onprem: "Horario", hybrid: "24/7" },
                        { feature: "Backups", saas: "Automáticos", onprem: "Configurables", hybrid: "Mixtos" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.feature}</td>
                          <td className="text-center py-3 px-4">{row.saas}</td>
                          <td className="text-center py-3 px-4 bg-green-500/5">{row.onprem}</td>
                          <td className="text-center py-3 px-4">{row.hybrid}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            <SectorRecommendations onSelectDeployment={(type) => {
              setSelectedType(type);
              setActiveTab("download");
            }} />
          </TabsContent>

          <TabsContent value="download">
            <OnPremiseDownload selectedType={selectedType || "on-premise"} />
          </TabsContent>

          <TabsContent value="guide">
            <InstallationGuide />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
