import { useState } from 'react';
import { useAppReviews, useCreateReview } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, ThumbsUp, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AppReviewsProps {
  applicationId: string;
  ratingAverage: number;
  ratingCount: number;
}

function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false,
  size = 'md'
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-transform hover:scale-110`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onRatingChange?.(star)}
        >
          <Star 
            className={`${sizeClasses[size]} ${
              star <= (hovered || rating) 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-muted-foreground'
            }`} 
          />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ 
  applicationId, 
  onSuccess 
}: { 
  applicationId: string; 
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');

  const createReview = useCreateReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    createReview.mutate(
      {
        application_id: applicationId,
        rating,
        title: title || undefined,
        review_text: reviewText || undefined,
        pros: pros || undefined,
        cons: cons || undefined,
      },
      {
        onSuccess: () => {
          setRating(0);
          setTitle('');
          setReviewText('');
          setPros('');
          setCons('');
          onSuccess();
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Escribir una reseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Tu valoración *</label>
            <div className="mt-1">
              <StarRating 
                rating={rating} 
                onRatingChange={setRating} 
                size="lg"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Título</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resume tu experiencia en una frase"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tu reseña</label>
            <Textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Cuéntanos tu experiencia con esta aplicación..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-green-600">Pros</label>
              <Textarea 
                value={pros}
                onChange={(e) => setPros(e.target.value)}
                placeholder="¿Qué te gustó?"
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-red-600">Contras</label>
              <Textarea 
                value={cons}
                onChange={(e) => setCons(e.target.value)}
                placeholder="¿Qué mejorarías?"
                className="mt-1"
                rows={2}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={rating === 0 || createReview.isPending}
          >
            {createReview.isPending ? 'Publicando...' : 'Publicar reseña'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function AppReviews({ applicationId, ratingAverage, ratingCount }: AppReviewsProps) {
  const { user } = useAuth();
  const { data: reviews, isLoading, refetch } = useAppReviews(applicationId);
  const [showForm, setShowForm] = useState(false);

  // Rating distribution (mock for now)
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews?.filter((r) => r.rating === stars).length || 0;
    const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold">{ratingAverage.toFixed(1)}</div>
          <StarRating rating={Math.round(ratingAverage)} readonly size="md" />
          <p className="text-sm text-muted-foreground mt-1">
            {ratingCount} reseñas
          </p>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-2">
          {ratingDistribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-2">
              <span className="text-sm w-8">{stars}★</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground w-8">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      {user && !showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Escribir reseña
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
        <ReviewForm 
          applicationId={applicationId} 
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold">Reseñas de usuarios</h3>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarRating rating={review.rating} readonly size="sm" />
                        {review.is_verified_purchase && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Compra verificada
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(review.created_at), 'dd MMM yyyy', { locale: es })}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="font-medium mt-2">{review.title}</h4>
                      )}

                      {review.review_text && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.review_text}
                        </p>
                      )}

                      {(review.pros || review.cons) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                          {review.pros && (
                            <div>
                              <span className="text-xs font-medium text-green-600">Pros:</span>
                              <p className="text-sm text-muted-foreground">{review.pros}</p>
                            </div>
                          )}
                          {review.cons && (
                            <div>
                              <span className="text-xs font-medium text-red-600">Contras:</span>
                              <p className="text-sm text-muted-foreground">{review.cons}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {review.response_text && (
                        <div className="mt-4 pl-4 border-l-2 border-primary/30">
                          <p className="text-xs font-medium text-primary">Respuesta del desarrollador:</p>
                          <p className="text-sm text-muted-foreground mt-1">{review.response_text}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-3">
                        <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          Útil ({review.helpful_count})
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Aún no hay reseñas. ¡Sé el primero en opinar!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default AppReviews;
