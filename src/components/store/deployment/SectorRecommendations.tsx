import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Landmark, Heart, Factory, ShoppingCart, Truck, GraduationCap, Shield, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

type DeploymentType = "saas" | "on-premise" | "hybrid";

interface SectorRecommendation {
  sector: string;
  icon: React.ReactNode;
  recommendation: DeploymentType;
  reason: string;
  regulations: string[];
  securityLevel: "alto" | "muy-alto" | "critico";
  dataResidency: string;
  considerations: string[];
}

const sectorRecommendations: SectorRecommendation[] = [
  {
    sector: "Banca y Finanzas",
    icon: <Landmark className="h-6 w-6" />,
    recommendation: "on-premise",
    reason: "Regulaciones DORA, NIS2, PSD2 y MiFID II exigen control total de datos financieros y resiliencia operativa.",
    regulations: ["DORA", "NIS2", "PSD2", "MiFID II", "Basel III/IV", "APDA"],
    securityLevel: "critico",
    dataResidency: "Obligatoria en jurisdicción local",
    considerations: [
      "Auditorías regulatorias frecuentes",
      "Requisitos de air-gap para datos críticos",
      "Segregación de entornos obligatoria",
      "Pruebas de resiliencia mandatorias"
    ]
  },
  {
    sector: "Sanidad",
    icon: <Heart className="h-6 w-6" />,
    recommendation: "on-premise",
    reason: "Datos de salud requieren máxima protección bajo HIPAA, GDPR y normativas sanitarias locales.",
    regulations: ["HIPAA", "GDPR", "ENS", "ISO 27799"],
    securityLevel: "critico",
    dataResidency: "Datos clínicos no pueden salir del país",
    considerations: [
      "Consentimiento explícito del paciente",
      "Anonimización obligatoria",
      "Trazabilidad completa de accesos",
      "Retención de datos regulada"
    ]
  },
  {
    sector: "Seguros",
    icon: <Shield className="h-6 w-6" />,
    recommendation: "hybrid",
    reason: "Combinación de datos sensibles (pólizas) con necesidad de escalabilidad para cálculos actuariales.",
    regulations: ["Solvencia II", "DORA", "GDPR", "IDD"],
    securityLevel: "muy-alto",
    dataResidency: "Recomendada en UE",
    considerations: [
      "Datos de pólizas on-premise",
      "Cálculos actuariales en cloud",
      "Integración con reaseguradoras",
      "Reporting regulatorio automatizado"
    ]
  },
  {
    sector: "Industria y Manufactura",
    icon: <Factory className="h-6 w-6" />,
    recommendation: "hybrid",
    reason: "Propiedad intelectual requiere protección local, pero cadena de suministro se beneficia de cloud.",
    regulations: ["ISO 9001", "ISO 14001", "ISO 45001", "NIS2"],
    securityLevel: "alto",
    dataResidency: "Flexible según país",
    considerations: [
      "Secretos industriales locales",
      "ERP integración cloud",
      "IoT y sensores en cloud",
      "Trazabilidad de producción"
    ]
  },
  {
    sector: "Retail y Comercio",
    icon: <ShoppingCart className="h-6 w-6" />,
    recommendation: "saas",
    reason: "Necesidad de escalabilidad en picos de demanda y múltiples puntos de venta.",
    regulations: ["PCI-DSS", "GDPR", "LSSI"],
    securityLevel: "alto",
    dataResidency: "Flexible",
    considerations: [
      "Pagos vía pasarela certificada",
      "Datos de clientes protegidos",
      "Escalabilidad en Black Friday",
      "Multi-tienda y omnicanalidad"
    ]
  },
  {
    sector: "Logística y Transporte",
    icon: <Truck className="h-6 w-6" />,
    recommendation: "saas",
    reason: "Operaciones distribuidas geográficamente requieren acceso ubicuo y tiempo real.",
    regulations: ["GDPR", "ADR", "IATA"],
    securityLevel: "alto",
    dataResidency: "Multi-región recomendada",
    considerations: [
      "Tracking en tiempo real",
      "Múltiples almacenes/flotas",
      "Integración con carriers",
      "Documentación aduanera"
    ]
  },
  {
    sector: "Educación",
    icon: <GraduationCap className="h-6 w-6" />,
    recommendation: "hybrid",
    reason: "Datos de menores requieren protección especial, pero plataformas educativas se benefician de cloud.",
    regulations: ["GDPR", "COPPA", "FERPA", "LOPDGDD"],
    securityLevel: "muy-alto",
    dataResidency: "Local para datos de menores",
    considerations: [
      "Protección datos menores",
      "Expedientes académicos locales",
      "Plataforma e-learning cloud",
      "Consentimiento parental"
    ]
  },
  {
    sector: "Administración Pública",
    icon: <Building2 className="h-6 w-6" />,
    recommendation: "on-premise",
    reason: "Soberanía de datos y requisitos del ENS exigen infraestructura controlada por la administración.",
    regulations: ["ENS", "GDPR", "Ley 40/2015", "NIS2"],
    securityLevel: "critico",
    dataResidency: "Obligatoria en territorio nacional",
    considerations: [
      "Certificación ENS obligatoria",
      "Interoperabilidad con otras AAPP",
      "Accesibilidad WCAG 2.1",
      "Transparencia y datos abiertos"
    ]
  }
];

interface SectorRecommendationsProps {
  onSelectDeployment: (type: DeploymentType) => void;
}

export function SectorRecommendations({ onSelectDeployment }: SectorRecommendationsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Recomendaciones por Sector</h2>
        <p className="text-muted-foreground">
          Basadas en requisitos regulatorios, nivel de seguridad y residencia de datos
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {sectorRecommendations.map((sector, index) => (
          <motion.div
            key={sector.sector}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      sector.securityLevel === "critico" ? "bg-red-500/10 text-red-500" :
                      sector.securityLevel === "muy-alto" ? "bg-orange-500/10 text-orange-500" :
                      "bg-yellow-500/10 text-yellow-500"
                    }`}>
                      {sector.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{sector.sector}</CardTitle>
                      <Badge 
                        variant={
                          sector.recommendation === "on-premise" ? "default" :
                          sector.recommendation === "hybrid" ? "secondary" : "outline"
                        }
                        className={
                          sector.recommendation === "on-premise" ? "bg-green-500" :
                          sector.recommendation === "hybrid" ? "bg-purple-500" : ""
                        }
                      >
                        {sector.recommendation === "on-premise" ? "On-Premise" :
                         sector.recommendation === "hybrid" ? "Híbrido" : "SaaS"}
                      </Badge>
                    </div>
                  </div>
                  <Badge 
                    variant="outline"
                    className={
                      sector.securityLevel === "critico" ? "border-red-500 text-red-500" :
                      sector.securityLevel === "muy-alto" ? "border-orange-500 text-orange-500" :
                      "border-yellow-500 text-yellow-500"
                    }
                  >
                    Seguridad: {sector.securityLevel.replace("-", " ")}
                  </Badge>
                </div>
                <CardDescription className="mt-2">{sector.reason}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Regulations */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Normativas Aplicables
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {sector.regulations.map((reg, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {reg}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Data Residency */}
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium">Residencia de Datos:</span>
                    <p className="text-sm text-muted-foreground">{sector.dataResidency}</p>
                  </div>
                </div>

                {/* Considerations */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Consideraciones Clave
                  </h4>
                  <ul className="space-y-1">
                    {sector.considerations.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  className="w-full mt-2"
                  onClick={() => onSelectDeployment(sector.recommendation)}
                >
                  Seleccionar {
                    sector.recommendation === "on-premise" ? "On-Premise" :
                    sector.recommendation === "hybrid" ? "Híbrido" : "SaaS"
                  }
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
