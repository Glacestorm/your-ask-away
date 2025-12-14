import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoContext } from '@/contexts/DemoContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { 
  Map, LayoutDashboard, Building2, Calendar, FileSpreadsheet, 
  Target, Bot, Settings, ChevronRight, ChevronLeft, X, Sparkles,
  CheckCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface TourStep {
  id: number;
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  path: string;
  section?: string;
}

export const DemoTour: React.FC = () => {
  const { tourActive, tourStep, setTourStep, skipTour, markSectionVisited } = useDemoContext();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const tourSteps: TourStep[] = useMemo(() => [
    {
      id: 0,
      titleKey: 'demo.tour.welcome.title',
      descKey: 'demo.tour.welcome.desc',
      icon: <Sparkles className="h-6 w-6" />,
      path: '/home'
    },
    {
      id: 1,
      titleKey: 'demo.tour.map.title',
      descKey: 'demo.tour.map.desc',
      icon: <Map className="h-6 w-6" />,
      path: '/admin',
      section: 'map'
    },
    {
      id: 2,
      titleKey: 'demo.tour.dashboard.title',
      descKey: 'demo.tour.dashboard.desc',
      icon: <LayoutDashboard className="h-6 w-6" />,
      path: '/admin',
      section: 'dashboard'
    },
    {
      id: 3,
      titleKey: 'demo.tour.companies.title',
      descKey: 'demo.tour.companies.desc',
      icon: <Building2 className="h-6 w-6" />,
      path: '/admin',
      section: 'companies'
    },
    {
      id: 4,
      titleKey: 'demo.tour.visits.title',
      descKey: 'demo.tour.visits.desc',
      icon: <Calendar className="h-6 w-6" />,
      path: '/admin',
      section: 'visits'
    },
    {
      id: 5,
      titleKey: 'demo.tour.accounting.title',
      descKey: 'demo.tour.accounting.desc',
      icon: <FileSpreadsheet className="h-6 w-6" />,
      path: '/admin',
      section: 'accounting'
    },
    {
      id: 6,
      titleKey: 'demo.tour.goals.title',
      descKey: 'demo.tour.goals.desc',
      icon: <Target className="h-6 w-6" />,
      path: '/admin',
      section: 'goals'
    },
    {
      id: 7,
      titleKey: 'demo.tour.assistant.title',
      descKey: 'demo.tour.assistant.desc',
      icon: <Bot className="h-6 w-6" />,
      path: '/admin',
      section: 'ai-assistant'
    },
    {
      id: 8,
      titleKey: 'demo.tour.settings.title',
      descKey: 'demo.tour.settings.desc',
      icon: <Settings className="h-6 w-6" />,
      path: '/admin',
      section: 'settings'
    },
    {
      id: 9,
      titleKey: 'demo.tour.ready.title',
      descKey: 'demo.tour.ready.desc',
      icon: <CheckCircle className="h-6 w-6" />,
      path: '/home'
    }
  ], []);

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
                      {t('demo.tour.step').replace('{current}', String(tourStep + 1)).replace('{total}', String(tourSteps.length))}
                    </p>
                    <h3 className="font-semibold text-lg text-foreground">
                      {t(currentStep.titleKey)}
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
                {t(currentStep.descKey)}
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
                  {t('demo.tour.previous')}
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
                  {isLastStep ? t('demo.tour.finish') : t('demo.tour.next')}
                  {!isLastStep && <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>

              {/* Skip link */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  {t('demo.tour.skip')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};