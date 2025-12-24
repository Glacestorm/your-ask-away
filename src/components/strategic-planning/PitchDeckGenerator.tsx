import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Presentation, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Maximize2, 
  Minimize2,
  Target,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  Shield,
  Rocket,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitchSlide {
  id: string;
  type: 'cover' | 'problem' | 'solution' | 'market' | 'business_model' | 'traction' | 'financials' | 'team' | 'ask' | 'contact';
  title: string;
  subtitle?: string;
  content: string[];
  metrics?: { label: string; value: string }[];
  icon: React.ElementType;
}

interface PitchDeckGeneratorProps {
  evaluation?: {
    project_name: string;
    project_description?: string;
    total_score?: number;
    viability_level?: string;
  };
  sections?: {
    section_name: string;
    section_score?: number;
    questions?: { question: string; answer?: string; score?: number }[];
  }[];
  financialData?: {
    revenue_year_1?: number;
    revenue_year_5?: number;
    investment_needed?: number;
    breakeven_year?: number;
    npv?: number;
    irr?: number;
  };
  dafoItems?: {
    category: string;
    description: string;
    importance: number;
  }[];
}

export function PitchDeckGenerator({ 
  evaluation, 
  sections = [], 
  financialData,
  dafoItems = []
}: PitchDeckGeneratorProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate slides from business plan data
  const generateSlides = (): PitchSlide[] => {
    const slides: PitchSlide[] = [];

    // 1. Cover Slide
    slides.push({
      id: 'cover',
      type: 'cover',
      title: evaluation?.project_name || 'Plan de Negocio',
      subtitle: 'Presentación para Inversores',
      content: [
        evaluation?.project_description || 'Una oportunidad de inversión única',
        `Puntuación de viabilidad: ${evaluation?.total_score || 0}/100`
      ],
      icon: Presentation
    });

    // 2. Problem Slide
    const threats = dafoItems.filter(i => i.category === 'threats').slice(0, 3);
    const weaknesses = dafoItems.filter(i => i.category === 'weaknesses').slice(0, 3);
    slides.push({
      id: 'problem',
      type: 'problem',
      title: 'El Problema',
      content: [
        ...threats.map(t => t.description),
        ...weaknesses.map(w => w.description)
      ].slice(0, 4),
      icon: Target
    });

    // 3. Solution Slide
    const strengths = dafoItems.filter(i => i.category === 'strengths').slice(0, 4);
    slides.push({
      id: 'solution',
      type: 'solution',
      title: 'Nuestra Solución',
      content: strengths.map(s => s.description),
      icon: Rocket
    });

    // 4. Market Opportunity
    const opportunities = dafoItems.filter(i => i.category === 'opportunities').slice(0, 4);
    slides.push({
      id: 'market',
      type: 'market',
      title: 'Oportunidad de Mercado',
      content: opportunities.map(o => o.description),
      icon: TrendingUp
    });

    // 5. Business Model
    const modelSection = sections.find(s => s.section_name.toLowerCase().includes('modelo') || s.section_name.toLowerCase().includes('negocio'));
    slides.push({
      id: 'business_model',
      type: 'business_model',
      title: 'Modelo de Negocio',
      content: modelSection?.questions?.filter(q => q.answer).map(q => q.answer || '') || [
        'Fuentes de ingresos diversificadas',
        'Estructura de costes optimizada',
        'Escalabilidad demostrada'
      ],
      icon: DollarSign
    });

    // 6. Traction (if available)
    slides.push({
      id: 'traction',
      type: 'traction',
      title: 'Tracción y Validación',
      content: [
        'Validación de mercado completada',
        'Primeros clientes adquiridos',
        'Métricas clave en crecimiento'
      ],
      metrics: [
        { label: 'Score Viabilidad', value: `${evaluation?.total_score || 0}%` },
        { label: 'Nivel', value: evaluation?.viability_level || 'Pendiente' }
      ],
      icon: BarChart3
    });

    // 7. Financial Projections
    slides.push({
      id: 'financials',
      type: 'financials',
      title: 'Proyecciones Financieras',
      content: [],
      metrics: [
        { label: 'Ingresos Año 1', value: financialData?.revenue_year_1 ? `€${(financialData.revenue_year_1 / 1000).toFixed(0)}K` : 'Por definir' },
        { label: 'Ingresos Año 5', value: financialData?.revenue_year_5 ? `€${(financialData.revenue_year_5 / 1000000).toFixed(1)}M` : 'Por definir' },
        { label: 'Break-even', value: financialData?.breakeven_year ? `Año ${financialData.breakeven_year}` : 'Por calcular' },
        { label: 'TIR', value: financialData?.irr ? `${(financialData.irr * 100).toFixed(1)}%` : 'Por calcular' }
      ],
      icon: TrendingUp
    });

    // 8. Team
    slides.push({
      id: 'team',
      type: 'team',
      title: 'Equipo Fundador',
      content: [
        'Experiencia combinada en el sector',
        'Track record de éxito empresarial',
        'Equipo complementario y comprometido'
      ],
      icon: Users
    });

    // 9. Investment Ask
    slides.push({
      id: 'ask',
      type: 'ask',
      title: 'Ronda de Inversión',
      content: [
        financialData?.investment_needed 
          ? `Buscamos €${(financialData.investment_needed / 1000).toFixed(0)}K`
          : 'Ronda por definir',
        'Uso de fondos: Desarrollo de producto, Marketing, Equipo',
        'Hitos a alcanzar: Escalabilidad, Break-even, Expansión'
      ],
      metrics: [
        { label: 'Inversión', value: financialData?.investment_needed ? `€${(financialData.investment_needed / 1000).toFixed(0)}K` : 'TBD' },
        { label: 'VAN Estimado', value: financialData?.npv ? `€${(financialData.npv / 1000).toFixed(0)}K` : 'TBD' }
      ],
      icon: DollarSign
    });

    // 10. Contact
    slides.push({
      id: 'contact',
      type: 'contact',
      title: '¿Hablamos?',
      subtitle: 'Estamos listos para responder tus preguntas',
      content: [
        'Agenda una reunión para más detalles',
        'Data room disponible bajo NDA',
        'Referencias de inversores actuales'
      ],
      icon: Phone
    });

    return slides;
  };

  const slides = generateSlides();

  const handlePrevSlide = () => {
    setCurrentSlide(prev => (prev > 0 ? prev - 1 : slides.length - 1));
  };

  const handleNextSlide = () => {
    setCurrentSlide(prev => (prev < slides.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevSlide();
    if (e.key === 'ArrowRight') handleNextSlide();
    if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
  };

  const exportToPDF = async () => {
    setIsGenerating(true);
    // In a real implementation, this would generate a PDF
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);
    // toast.success('Pitch Deck exportado a PDF');
  };

  const currentSlideData = slides[currentSlide];
  const SlideIcon = currentSlideData?.icon || Presentation;

  return (
    <div 
      className={cn(
        "transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50 bg-background p-8"
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <Card className={cn("overflow-hidden", isFullscreen && "h-full")}>
        <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-accent/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5" />
              Pitch Deck para Inversores
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentSlide + 1} / {slides.length}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF} disabled={isGenerating}>
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generando...' : 'Exportar PDF'}
              </Button>
            </div>
          </div>
          <Progress value={(currentSlide + 1) / slides.length * 100} className="h-1 mt-2" />
        </CardHeader>

        <CardContent className={cn("p-0", isFullscreen ? "h-[calc(100%-120px)]" : "h-[500px]")}>
          {/* Slide Content */}
          <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background via-muted/20 to-background">
            <div className="max-w-3xl w-full text-center space-y-6">
              {/* Slide Icon */}
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <SlideIcon className="h-12 w-12 text-primary" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-4xl font-bold">{currentSlideData?.title}</h2>
              {currentSlideData?.subtitle && (
                <p className="text-xl text-muted-foreground">{currentSlideData.subtitle}</p>
              )}

              {/* Content */}
              {currentSlideData?.content && currentSlideData.content.length > 0 && (
                <ul className="space-y-3 text-left max-w-xl mx-auto">
                  {currentSlideData.content.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Metrics */}
              {currentSlideData?.metrics && currentSlideData.metrics.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {currentSlideData.metrics.map((metric, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/50 border">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold text-primary">{metric.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={handlePrevSlide}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={handleNextSlide}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Slide Thumbnails */}
      {!isFullscreen && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {slides.map((slide, idx) => {
            const Icon = slide.icon;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlide(idx)}
                className={cn(
                  "flex-shrink-0 p-3 rounded-lg border transition-all",
                  idx === currentSlide 
                    ? "border-primary bg-primary/10" 
                    : "border-muted hover:border-primary/50"
                )}
              >
                <Icon className="h-4 w-4 mb-1" />
                <p className="text-xs font-medium truncate w-20">{slide.title}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
