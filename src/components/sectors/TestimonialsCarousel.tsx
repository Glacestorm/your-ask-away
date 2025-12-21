import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  company_name: string;
  company_logo_url: string | null;
  author_name: string;
  author_role: string | null;
  author_avatar_url: string | null;
  quote: string;
  rating: number | null;
  metrics: Array<{ label: string; value: string }>;
}

interface TestimonialsCarouselProps {
  autoPlay?: boolean;
  interval?: number;
}

export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  autoPlay = true,
  interval = 6000
}) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_featured', true)
        .order('display_order', { ascending: true });

      if (!error && data) {
        const parsed: Testimonial[] = data.map(t => ({
          id: t.id,
          company_name: t.company_name,
          company_logo_url: t.company_logo_url,
          author_name: t.author_name,
          author_role: t.author_role,
          author_avatar_url: t.author_avatar_url,
          quote: t.quote,
          rating: t.rating,
          metrics: Array.isArray(t.metrics) 
            ? (t.metrics as Array<{ label: string; value: string }>)
            : []
        }));
        setTestimonials(parsed);
      }
      setIsLoading(false);
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!autoPlay || testimonials.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, testimonials.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  if (isLoading) {
    return (
      <div className="h-64 rounded-2xl bg-slate-800/50 animate-pulse" />
    );
  }

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  return (
    <div className="relative">
      {/* Main testimonial card */}
      <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl border border-slate-700/50 p-8 md:p-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <Quote className="absolute top-6 right-6 w-16 h-16 text-primary/10" />

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            {/* Rating */}
            {current.rating && (
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < current.rating!
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Quote */}
            <blockquote className="text-xl md:text-2xl text-white font-light leading-relaxed mb-8">
              "{current.quote}"
            </blockquote>

            {/* Metrics */}
            {current.metrics.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-8">
                {current.metrics.map((metric, i) => (
                  <div 
                    key={i}
                    className="px-4 py-2 bg-primary/10 rounded-lg border border-primary/20"
                  >
                    <span className="text-primary font-semibold">{metric.value}</span>
                    <span className="text-slate-400 text-sm ml-2">{metric.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Author */}
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-2 border-slate-700">
                <AvatarImage src={current.author_avatar_url || undefined} />
                <AvatarFallback className="bg-slate-800 text-white">
                  {current.author_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">{current.author_name}</p>
                <p className="text-slate-400 text-sm">
                  {current.author_role} · {current.company_name}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {testimonials.length > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="h-10 w-10 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="h-10 w-10 rounded-full border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsCarousel;
