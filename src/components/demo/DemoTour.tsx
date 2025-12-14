import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { Button } from '@/components/ui/button';
import { 
  Map, LayoutDashboard, Building2, Calendar, FileSpreadsheet, 
  Target, Bot, Settings, ChevronRight, ChevronLeft, X, Sparkles,
  CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  section?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 0,
    title: 'Bienvenido a ObelixIA',
    description: 'El CRM bancario inteligente que revoluciona la gestión comercial. Explora todas las funcionalidades con datos de demostración reales.',
    icon: <Sparkles className="h-6 w-6" />,
    path: '/home'
  },
  {
    id: 1,
    title: 'Mapa Geográfico',
    description: 'Visualiza tu cartera de clientes en el mapa interactivo. Filtra por estado, productos, vinculación y más. Planifica rutas de visitas optimizadas.',
    icon: <Map className="h-6 w-6" />,
    path: '/admin',
    section: 'map'
  },
  {
    id: 2,
    title: 'Dashboard Ejecutivo',
    description: 'KPIs en tiempo real, métricas de rendimiento, gráficos interactivos y análisis de tu equipo comercial en un solo lugar.',
    icon: <LayoutDashboard className="h-6 w-6" />,
    path: '/admin',
    section: 'dashboard'
  },
  {
    id: 3,
    title: 'Gestión de Empresas',
    description: 'Administra tu cartera de clientes: datos de contacto, vinculación bancaria, productos contratados, documentos y fotos.',
    icon: <Building2 className="h-6 w-6" />,
    path: '/admin',
    section: 'companies'
  },
  {
    id: 4,
    title: 'Planificación de Visitas',
    description: 'Calendario interactivo para programar visitas, con integración de rutas, recordatorios automáticos y fichas de visita.',
    icon: <Calendar className="h-6 w-6" />,
    path: '/admin',
    section: 'visits'
  },
  {
    id: 5,
    title: 'Contabilidad y Análisis',
    description: 'Balances, cuentas de resultados, ratios financieros y análisis IFRS 9 para cada empresa de tu cartera.',
    icon: <FileSpreadsheet className="h-6 w-6" />,
    path: '/admin',
    section: 'accounting'
  },
  {
    id: 6,
    title: 'Objetivos y Gamificación',
    description: 'Define y sigue objetivos comerciales con sistema de puntos, logros y rankings para motivar al equipo.',
    icon: <Target className="h-6 w-6" />,
    path: '/admin',
    section: 'goals'
  },
  {
    id: 7,
    title: 'Asistente IA',
    description: 'Chat inteligente con contexto bancario, consultas por voz, y acceso a la base de conocimiento de productos y regulaciones.',
    icon: <Bot className="h-6 w-6" />,
    path: '/admin',
    section: 'ai-assistant'
  },
  {
    id: 8,
    title: 'Configuración',
    description: 'Personaliza el sistema: usuarios, productos, alertas, integraciones y white-labeling para tu entidad.',
    icon: <Settings className="h-6 w-6" />,
    path: '/admin',
    section: 'settings'
  },
  {
    id: 9,
    title: '¡Listo para explorar!',
    description: 'Has completado el tour. Ahora puedes explorar libremente todas las funcionalidades. Los datos de demostración se eliminarán al finalizar.',
    icon: <CheckCircle className="h-6 w-6" />,
    path: '/home'
  }
];

export const DemoTour: React.FC = () => {
  const { tourActive, tourStep, setTourStep, skipTour, markSectionVisited } = useDemoContext();
  const navigate = useNavigate();
  const location = useLocation();

  const currentStep = tourSteps[tourStep] || tourSteps[0];
  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === tourSteps.length - 1;

  useEffect(() => {
    if (tourActive && currentStep.section) {
      markSectionVisited(currentStep.section);
    }
  }, [tourActive, tourStep, currentStep.section, markSectionVisited]);

  const handleNext = () => {
    if (isLastStep) {
      skipTour();
    } else {
      const nextStep = tourSteps[tourStep + 1];
      setTourStep(tourStep + 1);
      
      // Navigate to the section
      if (nextStep.section) {
        navigate(`${nextStep.path}?section=${nextStep.section}`);
      } else {
        navigate(nextStep.path);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = tourSteps[tourStep - 1];
      setTourStep(tourStep - 1);
      
      if (prevStep.section) {
        navigate(`${prevStep.path}?section=${prevStep.section}`);
      } else {
        navigate(prevStep.path);
      }
    }
  };

  const handleSkip = () => {
    skipTour();
    navigate('/home');
  };

  if (!tourActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] pointer-events-none"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={handleSkip} />

        {/* Tour Card */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-lg px-4 pointer-events-auto"
        >
          <div className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {currentStep.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">
                      Paso {tourStep + 1} de {tourSteps.length}
                    </p>
                    <h3 className="font-semibold text-lg text-foreground">
                      {currentStep.title}
                    </h3>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSkip}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-6">
                {currentStep.description}
              </p>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>

                <div className="flex gap-1">
                  {tourSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const step = tourSteps[idx];
                        setTourStep(idx);
                        if (step.section) {
                          navigate(`${step.path}?section=${step.section}`);
                        } else {
                          navigate(step.path);
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === tourStep ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/50'
                      }`}
                    />
                  ))}
                </div>

                <Button onClick={handleNext} className="gap-1">
                  {isLastStep ? 'Finalizar' : 'Siguiente'}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {/* Skip link */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Saltar tour y explorar libremente
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
