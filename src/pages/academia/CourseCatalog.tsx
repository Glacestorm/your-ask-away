/**
 * CourseCatalog - Catálogo de cursos de ObelixIA Academia
 * Fase 1: Filtros funcionales + grid mejorado
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Grid3X3, List, Star, Clock, Users,
  BookOpen, ArrowRight, GraduationCap, Play, X, SlidersHorizontal,
  ChevronDown, Award, TrendingUp, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import StoreNavbar from '@/components/store/StoreNavbar';
import { useLanguage } from '@/contexts/LanguageContext';

// Types
interface Course {
  id: string;
  title: string;
  titleEn: string;
  instructor: string;
  instructorRole: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  type: 'course' | 'certification' | 'webinar' | 'workshop';
  duration: number;
  modules: number;
  students: number;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  tags: string[];
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
}

// Mock data - En producción vendrá de Supabase
const coursesData: Course[] = [
  {
    id: 'crm-avanzado-empresas',
    title: 'CRM Avanzado para Empresas',
    titleEn: 'Advanced CRM for Business',
    instructor: 'María García',
    instructorRole: 'CRM Expert',
    category: 'CRM',
    level: 'intermediate',
    type: 'course',
    duration: 12,
    modules: 8,
    students: 1250,
    rating: 4.8,
    reviews: 324,
    price: 199,
    originalPrice: 299,
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    tags: ['CRM', 'Ventas', 'Automatización'],
    bestseller: true,
  },
  {
    id: 'ia-negocios',
    title: 'Inteligencia Artificial para Negocios',
    titleEn: 'AI for Business',
    instructor: 'Carlos López',
    instructorRole: 'AI Specialist',
    category: 'IA',
    level: 'beginner',
    type: 'course',
    duration: 8,
    modules: 6,
    students: 2340,
    rating: 4.9,
    reviews: 567,
    price: 149,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
    tags: ['IA', 'Machine Learning', 'Automatización'],
    featured: true,
    new: true,
  },
  {
    id: 'compliance-empresarial',
    title: 'Compliance y Normativa Empresarial',
    titleEn: 'Compliance & Business Regulations',
    instructor: 'Ana Martínez',
    instructorRole: 'Legal Compliance Officer',
    category: 'Compliance',
    level: 'advanced',
    type: 'certification',
    duration: 15,
    modules: 10,
    students: 890,
    rating: 4.7,
    reviews: 189,
    price: 249,
    thumbnail: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=300&fit=crop',
    tags: ['Legal', 'GDPR', 'Normativa'],
  },
  {
    id: 'analytics-ia',
    title: 'Análisis de Datos con IA',
    titleEn: 'Data Analysis with AI',
    instructor: 'Pedro Sánchez',
    instructorRole: 'Data Scientist',
    category: 'Analytics',
    level: 'intermediate',
    type: 'course',
    duration: 10,
    modules: 7,
    students: 1567,
    rating: 4.6,
    reviews: 412,
    price: 179,
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    tags: ['Analytics', 'Big Data', 'IA'],
  },
  {
    id: 'gestion-financiera',
    title: 'Gestión Financiera Inteligente',
    titleEn: 'Intelligent Financial Management',
    instructor: 'Laura Torres',
    instructorRole: 'CFO Consultant',
    category: 'Finanzas',
    level: 'advanced',
    type: 'course',
    duration: 14,
    modules: 9,
    students: 723,
    rating: 4.8,
    reviews: 156,
    price: 229,
    originalPrice: 349,
    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    tags: ['Finanzas', 'KPIs', 'Reporting'],
  },
  {
    id: 'certificacion-crm-pro',
    title: 'Certificación CRM Professional',
    titleEn: 'CRM Professional Certification',
    instructor: 'Equipo ObelixIA',
    instructorRole: 'Official Certification',
    category: 'CRM',
    level: 'expert',
    type: 'certification',
    duration: 20,
    modules: 12,
    students: 456,
    rating: 4.9,
    reviews: 98,
    price: 399,
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
    tags: ['Certificación', 'CRM', 'Profesional'],
    featured: true,
  },
  {
    id: 'webinar-tendencias-2025',
    title: 'Tendencias CRM 2025',
    titleEn: 'CRM Trends 2025',
    instructor: 'David Ruiz',
    instructorRole: 'Industry Analyst',
    category: 'CRM',
    level: 'beginner',
    type: 'webinar',
    duration: 2,
    modules: 1,
    students: 3200,
    rating: 4.5,
    reviews: 890,
    price: 0,
    thumbnail: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=400&h=300&fit=crop',
    tags: ['Webinar', 'Tendencias', 'Gratis'],
    new: true,
  },
  {
    id: 'automatizacion-procesos',
    title: 'Automatización de Procesos Empresariales',
    titleEn: 'Business Process Automation',
    instructor: 'Elena Navarro',
    instructorRole: 'Process Engineer',
    category: 'Automatización',
    level: 'intermediate',
    type: 'workshop',
    duration: 6,
    modules: 4,
    students: 1890,
    rating: 4.7,
    reviews: 423,
    price: 129,
    thumbnail: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop',
    tags: ['Automatización', 'Workflows', 'Eficiencia'],
    bestseller: true,
  },
];

const categories = ['CRM', 'IA', 'Compliance', 'Analytics', 'Finanzas', 'Automatización'];
const levels = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
const types = ['course', 'certification', 'webinar', 'workshop'] as const;

const CourseCatalog: React.FC = () => {
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State from URL params
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || 'all');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedLevel !== 'all') params.set('level', selectedLevel);
    if (selectedType !== 'all') params.set('type', selectedType);
    if (sortBy !== 'popular') params.set('sort', sortBy);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, selectedLevel, selectedType, sortBy]);

  // Filtered and sorted courses
  const filteredCourses = useMemo(() => {
    let result = [...coursesData];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.titleEn.toLowerCase().includes(query) ||
        c.instructor.toLowerCase().includes(query) ||
        c.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Level filter
    if (selectedLevel !== 'all') {
      result = result.filter(c => c.level === selectedLevel);
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter(c => c.type === selectedType);
    }

    // Free only filter
    if (showFreeOnly) {
      result = result.filter(c => c.price === 0);
    }

    // Price range filter
    result = result.filter(c => c.price >= priceRange[0] && c.price <= priceRange[1]);

    // Sorting
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.students - a.students);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.new ? 1 : 0) - (a.new ? 1 : 0));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedLevel, selectedType, sortBy, showFreeOnly, priceRange]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedLevel !== 'all',
    selectedType !== 'all',
    showFreeOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSelectedType('all');
    setShowFreeOnly(false);
    setPriceRange([0, 500]);
    setSearchQuery('');
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      beginner: { es: 'Principiante', en: 'Beginner' },
      intermediate: { es: 'Intermedio', en: 'Intermediate' },
      advanced: { es: 'Avanzado', en: 'Advanced' },
      expert: { es: 'Experto', en: 'Expert' },
    };
    return labels[level]?.[language as 'es' | 'en'] || level;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { es: string; en: string }> = {
      course: { es: 'Curso', en: 'Course' },
      certification: { es: 'Certificación', en: 'Certification' },
      webinar: { es: 'Webinar', en: 'Webinar' },
      workshop: { es: 'Taller', en: 'Workshop' },
    };
    return labels[type]?.[language as 'es' | 'en'] || type;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      intermediate: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      advanced: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      expert: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    return colors[level] || 'bg-slate-500/20 text-slate-400';
  };

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-white font-medium py-2">
          {language === 'es' ? 'Categorías' : 'Categories'}
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {categories.map(cat => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox 
                checked={selectedCategory === cat.toLowerCase()}
                onCheckedChange={(checked) => setSelectedCategory(checked ? cat.toLowerCase() : 'all')}
              />
              <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                {cat}
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Levels */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-white font-medium py-2">
          {language === 'es' ? 'Nivel' : 'Level'}
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {levels.map(level => (
            <label key={level} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox 
                checked={selectedLevel === level}
                onCheckedChange={(checked) => setSelectedLevel(checked ? level : 'all')}
              />
              <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                {getLevelLabel(level)}
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Types */}
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-white font-medium py-2">
          {language === 'es' ? 'Tipo' : 'Type'}
          <ChevronDown className="w-4 h-4" />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {types.map(type => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox 
                checked={selectedType === type}
                onCheckedChange={(checked) => setSelectedType(checked ? type : 'all')}
              />
              <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                {getTypeLabel(type)}
              </span>
            </label>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Free courses */}
      <div className="pt-2 border-t border-slate-700">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox 
            checked={showFreeOnly}
            onCheckedChange={(checked) => setShowFreeOnly(!!checked)}
          />
          <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
            {language === 'es' ? 'Solo cursos gratis' : 'Free courses only'}
          </span>
        </label>
      </div>

      {activeFiltersCount > 0 && (
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <X className="w-4 h-4 mr-2" />
          {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
        </Button>
      )}
    </div>
  );

  // Course Card Component
  const CourseCard = ({ course, index }: { course: Course; index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={viewMode === 'list' ? 'w-full' : ''}
    >
      <Link to={`/academia/curso/${course.id}`}>
        <Card className={`bg-slate-800/50 border-slate-700 hover:border-primary/50 transition-all group overflow-hidden h-full ${
          viewMode === 'list' ? 'flex flex-row' : ''
        }`}>
          <div className={`relative overflow-hidden ${
            viewMode === 'list' ? 'w-64 flex-shrink-0' : 'aspect-video'
          }`}>
            <img
              src={course.thumbnail}
              alt={language === 'es' ? course.title : course.titleEn}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <Badge className={`absolute top-3 left-3 ${getLevelColor(course.level)}`}>
              {getLevelLabel(course.level)}
            </Badge>
            {course.featured && (
              <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground">
                <Sparkles className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            {course.new && !course.featured && (
              <Badge className="absolute top-3 right-3 bg-emerald-500 text-white">
                {language === 'es' ? 'Nuevo' : 'New'}
              </Badge>
            )}
            {course.bestseller && !course.featured && !course.new && (
              <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
                <TrendingUp className="w-3 h-3 mr-1" />
                Bestseller
              </Badge>
            )}
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-1" />
              </div>
            </div>
          </div>

          <CardContent className={`p-4 flex flex-col ${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                {getTypeLabel(course.type)}
              </Badge>
              <span className="text-primary font-medium">{course.category}</span>
            </div>

            <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {language === 'es' ? course.title : course.titleEn}
            </h3>

            <p className="text-sm text-slate-400 mb-3">
              {course.instructor} • {course.instructorRole}
            </p>

            <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{course.duration}h</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{course.modules} {language === 'es' ? 'módulos' : 'modules'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{course.students.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-medium">{course.rating}</span>
              </div>
              <span className="text-slate-500 text-sm">({course.reviews.toLocaleString()} {language === 'es' ? 'reseñas' : 'reviews'})</span>
            </div>

            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                {course.price === 0 ? (
                  <span className="text-xl font-bold text-emerald-400">
                    {language === 'es' ? 'Gratis' : 'Free'}
                  </span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-white">€{course.price}</span>
                    {course.originalPrice && (
                      <span className="text-sm text-slate-500 line-through">€{course.originalPrice}</span>
                    )}
                  </>
                )}
              </div>
              <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10">
                {language === 'es' ? 'Ver curso' : 'View course'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <StoreNavbar />

      <div className="container mx-auto px-6 pt-28 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Link to="/academia" className="hover:text-white transition-colors">
              Academia
            </Link>
            <span>/</span>
            <span className="text-white">
              {language === 'es' ? 'Catálogo de Cursos' : 'Course Catalog'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {language === 'es' ? 'Catálogo de Cursos' : 'Course Catalog'}
              </h1>
              <p className="text-slate-400">
                {filteredCourses.length} {language === 'es' ? 'cursos encontrados' : 'courses found'}
              </p>
            </div>

            {/* Active filters */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory('all')} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedLevel !== 'all' && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                    {getLevelLabel(selectedLevel)}
                    <button onClick={() => setSelectedLevel('all')} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
                {selectedType !== 'all' && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-0">
                    {getTypeLabel(selectedType)}
                    <button onClick={() => setSelectedType('all')} className="ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Search & Sort Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder={language === 'es' ? 'Buscar cursos, instructores...' : 'Search courses, instructors...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Mobile filter button */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden border-slate-700 text-white">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Filtros' : 'Filters'}
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-primary text-white text-xs">{activeFiltersCount}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-slate-900 border-slate-700 w-80">
              <SheetHeader>
                <SheetTitle className="text-white">
                  {language === 'es' ? 'Filtros' : 'Filters'}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder={language === 'es' ? 'Ordenar por' : 'Sort by'} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="popular">{language === 'es' ? 'Más populares' : 'Most popular'}</SelectItem>
              <SelectItem value="rating">{language === 'es' ? 'Mejor valorados' : 'Highest rated'}</SelectItem>
              <SelectItem value="newest">{language === 'es' ? 'Más nuevos' : 'Newest'}</SelectItem>
              <SelectItem value="price-low">{language === 'es' ? 'Precio: menor a mayor' : 'Price: low to high'}</SelectItem>
              <SelectItem value="price-high">{language === 'es' ? 'Precio: mayor a menor' : 'Price: high to low'}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? '' : 'border-slate-700 text-slate-400'}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? '' : 'border-slate-700 text-slate-400'}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="hidden lg:block w-64 flex-shrink-0"
          >
            <div className="sticky top-28 bg-slate-800/30 rounded-xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {language === 'es' ? 'Filtros' : 'Filters'}
              </h3>
              <FilterContent />
            </div>
          </motion.aside>

          {/* Course Grid */}
          <div className="flex-1">
            <AnimatePresence mode="popLayout">
              {filteredCourses.length > 0 ? (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={viewMode === 'grid' 
                    ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'flex flex-col gap-4'}
                >
                  {filteredCourses.map((course, index) => (
                    <CourseCard key={course.id} course={course} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16"
                >
                  <GraduationCap className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {language === 'es' ? 'No se encontraron cursos' : 'No courses found'}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {language === 'es' 
                      ? 'Intenta ajustar los filtros o buscar con otros términos'
                      : 'Try adjusting filters or search with different terms'}
                  </p>
                  <Button onClick={clearFilters} variant="outline" className="border-slate-600 text-white">
                    {language === 'es' ? 'Limpiar filtros' : 'Clear filters'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Coming soon placeholder */}
            {filteredCourses.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-12 text-center py-10 border border-dashed border-slate-700 rounded-2xl"
              >
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {language === 'es' ? 'Más cursos próximamente' : 'More courses coming soon'}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {language === 'es' 
                    ? 'Nuevos cursos con tutores IA cada mes'
                    : 'New courses with AI tutors every month'}
                </p>
                <Button variant="outline" size="sm" className="border-slate-600 text-white hover:bg-slate-800">
                  {language === 'es' ? 'Suscribirme a novedades' : 'Subscribe to updates'}
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCatalog;
