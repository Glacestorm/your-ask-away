import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Shield, 
  BarChart3, 
  FileText,
  Calculator,
  Briefcase,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Globe,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSEOMeta, structuredDataGenerators } from '@/hooks/useSEOMeta';

const features = [
  {
    icon: Building2,
    title: 'Gestión Empresarial 360°',
    description: 'Control total de tu empresa desde un único panel: clientes, proveedores, empleados y operaciones.',
  },
  {
    icon: Calculator,
    title: 'Contabilidad Integrada',
    description: 'Plan General Contable español, asientos automáticos, balances y cuenta de resultados en tiempo real.',
  },
  {
    icon: FileText,
    title: 'Facturación Electrónica',
    description: 'Cumple con TicketBAI, SII y Facturae. Genera facturas electrónicas con validez legal automática.',
  },
  {
    icon: Users,
    title: 'Gestión de RRHH',
    description: 'Nóminas, contratos, vacaciones, control horario y portal del empleado integrado.',
  },
  {
    icon: BarChart3,
    title: 'Business Intelligence',
    description: 'Dashboards personalizables con KPIs en tiempo real y predicciones con IA.',
  },
  {
    icon: Shield,
    title: 'Compliance Automático',
    description: 'GDPR, LOPD, auditorías automáticas y trazabilidad blockchain para cumplimiento normativo.',
  },
];

const stats = [
  { value: '2,500+', label: 'Empresas Activas' },
  { value: '98%', label: 'Satisfacción' },
  { value: '45%', label: 'Ahorro Tiempo' },
  { value: '24/7', label: 'Soporte' },
];

const testimonials = [
  {
    name: 'María García',
    role: 'CEO, TechSolutions S.L.',
    content: 'ObelixCRM transformó nuestra gestión empresarial. La integración con contabilidad y facturación nos ahorra 20 horas semanales.',
    rating: 5,
  },
  {
    name: 'Carlos Rodríguez',
    role: 'Director Financiero, IndustriaMax',
    content: 'El módulo de BI nos permite tomar decisiones basadas en datos reales. ROI positivo en menos de 3 meses.',
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    features: ['5 usuarios', 'CRM básico', 'Facturación', 'Soporte email'],
    popular: false,
  },
  {
    name: 'Professional',
    price: 149,
    features: ['25 usuarios', 'CRM + ERP', 'Contabilidad', 'BI básico', 'Soporte prioritario'],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 399,
    features: ['Usuarios ilimitados', 'Suite completa', 'IA avanzada', 'API full', 'Soporte 24/7'],
    popular: false,
  },
];

export default function EmpresasLanding() {
  useSEOMeta({
    title: 'Software de Gestión Empresarial - ERP y CRM para Empresas',
    description: 'Solución integral de gestión empresarial con CRM, ERP, contabilidad, facturación y RRHH. Diseñado para PYMEs y grandes empresas españolas.',
    keywords: 'ERP, CRM, gestión empresarial, software empresas, contabilidad, facturación electrónica, RRHH, España',
    ogType: 'website',
    structuredData: structuredDataGenerators.softwareApplication({
      name: 'ObelixCRM Enterprise',
      description: 'Software de gestión empresarial integral',
      category: 'BusinessApplication',
    }),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4" variant="secondary">
                <Zap className="h-3 w-3 mr-1" />
                #1 en Software Empresarial
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                Gestiona tu empresa con{' '}
                <span className="text-primary">inteligencia</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-xl">
                Plataforma integral que unifica CRM, ERP, contabilidad, facturación y RRHH. 
                Diseñada para empresas españolas que buscan eficiencia y crecimiento.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/demo">
                    Solicitar Demo Gratuita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/precios">Ver Precios</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">2,500+</span> empresas confían en nosotros
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border shadow-2xl overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Building2 className="h-32 w-32 text-primary/30" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Todo lo que necesitas para gestionar tu empresa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Una plataforma unificada que elimina la complejidad y potencia tu productividad
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planes adaptados a tu empresa</h2>
            <p className="text-muted-foreground">Sin permanencia. Cancela cuando quieras.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={plan.popular ? 'border-primary shadow-lg' : ''}>
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                      Más Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price}€<span className="text-lg text-muted-foreground">/mes</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full mt-6" variant={plan.popular ? 'default' : 'outline'}>
                      Empezar Ahora
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="link" asChild>
              <Link to="/precios">Ver todos los planes y comparativa completa →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            ¿Listo para transformar tu empresa?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Únete a más de 2,500 empresas que ya optimizan su gestión con ObelixCRM
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/demo">
                <Clock className="mr-2 h-5 w-5" />
                Agendar Demo de 30 min
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contacto">
                <Globe className="mr-2 h-5 w-5" />
                Contactar Ventas
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
