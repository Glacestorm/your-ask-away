import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CaseStudyCard } from './CaseStudyCard';
import { Sector } from '@/hooks/useSectors';

interface CaseStudiesCarouselProps {
  sectors: Sector[];
  autoPlay?: boolean;
  interval?: number;
}

export const CaseStudiesCarousel: React.FC<CaseStudiesCarouselProps> = ({
  sectors,
  autoPlay = true,
  interval = 5000
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  // Get all case studies with sector info
  const allCaseStudies = sectors.flatMap(sector => 
    sector.case_studies.map(cs => ({
      ...cs,
      sectorName: sector.name,
      sectorSlug: sector.slug,
      gradientColor: sector.gradient_from || '#3B82F6'
    }))
  );

  const totalItems = allCaseStudies.length;

  useEffect(() => {
    if (!isPlaying || totalItems === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalItems);
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, totalItems, interval]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  if (totalItems === 0) return null;

  const currentCaseStudy = allCaseStudies[currentIndex];

  return (
    <div className="relative">
      {/* Main carousel */}
      <div className="relative overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
          >
            <CaseStudyCard
              caseStudy={currentCaseStudy}
              sectorName={currentCaseStudy.sectorName}
              sectorSlug={currentCaseStudy.sectorSlug}
              gradientColor={currentCaseStudy.gradientColor}
              variant="featured"
              index={0}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-6">
        {/* Progress indicators */}
        <div className="flex items-center gap-1.5">
          {allCaseStudies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex 
                  ? 'w-8 bg-primary' 
                  : 'w-1.5 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            className="h-9 w-9 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaseStudiesCarousel;
