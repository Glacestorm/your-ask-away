import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMicrosurveys } from '@/hooks/useMicrosurveys';
import { X, Star, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicrosurveyWidgetProps {
  surveyId: string;
  companyId: string;
  contactId?: string;
  triggerContext?: Record<string, unknown>;
  onComplete?: () => void;
  onDismiss?: () => void;
}

export function MicrosurveyWidget({
  surveyId,
  companyId,
  contactId,
  triggerContext = {},
  onComplete,
  onDismiss,
}: MicrosurveyWidgetProps) {
  const { microsurveys, submitResponse, isSubmitting } = useMicrosurveys();
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [step, setStep] = useState<'rating' | 'feedback' | 'thanks'>('rating');
  const [startTime] = useState(Date.now());

  const survey = microsurveys?.find(s => s.id === surveyId);

  if (!survey) return null;

  const handleSubmit = () => {
    if (!selectedValue) return;

    const responseTimeSeconds = Math.round((Date.now() - startTime) / 1000);

    submitResponse({
      microsurvey_id: surveyId,
      company_id: companyId,
      contact_id: contactId || null,
      response_value: selectedValue,
      response_score: parseInt(selectedValue) || null,
      open_feedback: feedback || null,
      trigger_context: triggerContext,
      response_time_seconds: responseTimeSeconds,
    });

    setStep('thanks');
    setTimeout(() => {
      onComplete?.();
    }, 2000);
  };

  const renderRatingInput = () => {
    const surveyType = survey.survey_type;

    if (surveyType === 'nps') {
      return (
        <div className="flex flex-wrap justify-center gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
            <Button
              key={score}
              variant={selectedValue === score.toString() ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'w-9 h-9 p-0',
                score <= 6 && 'hover:bg-red-100 hover:border-red-300',
                score >= 7 && score <= 8 && 'hover:bg-yellow-100 hover:border-yellow-300',
                score >= 9 && 'hover:bg-green-100 hover:border-green-300'
              )}
              onClick={() => setSelectedValue(score.toString())}
            >
              {score}
            </Button>
          ))}
        </div>
      );
    }

    if (surveyType === 'csat') {
      return (
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <Button
              key={score}
              variant="ghost"
              size="lg"
              className={cn(
                'p-2',
                selectedValue === score.toString() && 'bg-primary/10'
              )}
              onClick={() => setSelectedValue(score.toString())}
            >
              <Star 
                className={cn(
                  'h-8 w-8',
                  parseInt(selectedValue || '0') >= score 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                )} 
              />
            </Button>
          ))}
        </div>
      );
    }

    if (surveyType === 'thumbs') {
      return (
        <div className="flex justify-center gap-4">
          <Button
            variant={selectedValue === 'positive' ? 'default' : 'outline'}
            size="lg"
            className="p-4"
            onClick={() => setSelectedValue('positive')}
          >
            <ThumbsUp className="h-8 w-8" />
          </Button>
          <Button
            variant={selectedValue === 'neutral' ? 'default' : 'outline'}
            size="lg"
            className="p-4"
            onClick={() => setSelectedValue('neutral')}
          >
            <Meh className="h-8 w-8" />
          </Button>
          <Button
            variant={selectedValue === 'negative' ? 'default' : 'outline'}
            size="lg"
            className="p-4"
            onClick={() => setSelectedValue('negative')}
          >
            <ThumbsDown className="h-8 w-8" />
          </Button>
        </div>
      );
    }

    // Default CES or other
    return (
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((score) => (
          <Button
            key={score}
            variant={selectedValue === score.toString() ? 'default' : 'outline'}
            size="sm"
            className="w-10 h-10 p-0"
            onClick={() => setSelectedValue(score.toString())}
          >
            {score}
          </Button>
        ))}
      </div>
    );
  };

  if (step === 'thanks') {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg animate-in fade-in-50 slide-in-from-bottom-4">
        <CardContent className="pt-6 text-center">
          <div className="text-4xl mb-4">🙏</div>
          <h3 className="text-lg font-semibold">¡Gracias por tu feedback!</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Tu opinión nos ayuda a mejorar
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg animate-in fade-in-50 slide-in-from-bottom-4">
      <CardContent className="pt-4 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        {step === 'rating' && (
          <div className="space-y-4">
            <h3 className="text-center font-medium pr-8">
              {survey.question_text}
            </h3>
            
            {renderRatingInput()}

            {survey.survey_type === 'nps' && (
              <div className="flex justify-between text-xs text-muted-foreground px-2">
                <span>Nada probable</span>
                <span>Muy probable</span>
              </div>
            )}

            {selectedValue && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('feedback')}
                >
                  Añadir comentario
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  Enviar
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'feedback' && (
          <div className="space-y-4">
            <h3 className="text-center font-medium">
              ¿Podrías contarnos más?
            </h3>
            <Textarea
              placeholder="Tu opinión nos ayuda a mejorar..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('rating')}
              >
                Atrás
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                Enviar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
