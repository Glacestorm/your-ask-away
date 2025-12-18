import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  FileText, 
  Search, 
  Tags, 
  BarChart3, 
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  Share2,
  Target,
  Brain,
  Zap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface GeneratedContent {
  type: string;
  content: any;
  generated_at: string;
}

interface QualityAnalysis {
  overall_score: number;
  readability: any;
  seo: any;
  engagement: any;
  grammar: any;
  tone: any;
  word_count: number;
  top_improvements: string[];
}

interface SEORecommendations {
  current_seo_score: number;
  title_recommendations: any;
  meta_description_recommendations: any;
  keyword_recommendations: any;
  quick_wins: any[];
  priority_actions: any[];
}

interface TagAnalysis {
  suggested_categories: any[];
  suggested_tags: any[];
  entities_detected: any;
  topics: any[];
  sentiment: any;
  content_type: any;
  auto_summary: string;
  audience?: any;
  key_phrases?: string[];
}

export const AIContentStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Generate state
  const [generateType, setGenerateType] = useState('title');
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateTone, setGenerateTone] = useState('profesional');
  const [generateLanguage, setGenerateLanguage] = useState('español');
  const [generateLength, setGenerateLength] = useState('medium');
  const [generateKeywords, setGenerateKeywords] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  
  // Quality state
  const [qualityContent, setQualityContent] = useState('');
  const [qualityTitle, setQualityTitle] = useState('');
  const [qualityAnalysis, setQualityAnalysis] = useState<QualityAnalysis | null>(null);
  
  // SEO state
  const [seoContent, setSeoContent] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoRecommendations, setSeoRecommendations] = useState<SEORecommendations | null>(null);
  
  // Tag state
  const [tagContent, setTagContent] = useState('');
  const [tagTitle, setTagTitle] = useState('');
  const [tagAnalysis, setTagAnalysis] = useState<TagAnalysis | null>(null);

  const handleGenerate = async () => {
    if (!generateTopic.trim()) {
      toast.error('Ingresa un tema para generar contenido');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-generate-content', {
        body: {
          type: generateType,
          topic: generateTopic,
          tone: generateTone,
          language: generateLanguage,
          length: generateLength,
          keywords: generateKeywords.split(',').map(k => k.trim()).filter(Boolean)
        }
      });

      if (error) throw error;
      setGeneratedContent(data);
      toast.success('Contenido generado exitosamente');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Error al generar contenido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeQuality = async () => {
    if (!qualityContent.trim()) {
      toast.error('Ingresa contenido para analizar');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-analyze-content-quality', {
        body: {
          content: qualityContent,
          title: qualityTitle
        }
      });

      if (error) throw error;
      setQualityAnalysis(data.analysis);
      toast.success('Análisis completado');
    } catch (error) {
      console.error('Error analyzing quality:', error);
      toast.error('Error al analizar contenido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestSEO = async () => {
    if (!seoContent.trim() && !seoTitle.trim()) {
      toast.error('Ingresa contenido o título para analizar');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-suggest-seo', {
        body: {
          content: seoContent,
          title: seoTitle,
          target_keywords: seoKeywords.split(',').map(k => k.trim()).filter(Boolean),
          industry: 'banking'
        }
      });

      if (error) throw error;
      setSeoRecommendations(data.recommendations);
      toast.success('Recomendaciones SEO generadas');
    } catch (error) {
      console.error('Error suggesting SEO:', error);
      toast.error('Error al generar recomendaciones SEO');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!tagContent.trim() && !tagTitle.trim()) {
      toast.error('Ingresa contenido para categorizar');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cms-auto-tag', {
        body: {
          content: tagContent,
          title: tagTitle,
          language: 'español'
        }
      });

      if (error) throw error;
      setTagAnalysis(data.analysis);
      toast.success('Categorización completada');
    } catch (error) {
      console.error('Error auto-tagging:', error);
      toast.error('Error al categorizar contenido');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Content Studio
          </h2>
          <p className="text-muted-foreground">
            Genera, analiza y optimiza contenido con inteligencia artificial
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generar
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Calidad
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Etiquetas
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Generador de Contenido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de contenido</label>
                  <Select value={generateType} onValueChange={setGenerateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Títulos</SelectItem>
                      <SelectItem value="description">Meta Descripciones</SelectItem>
                      <SelectItem value="article">Artículo Completo</SelectItem>
                      <SelectItem value="summary">Resumen</SelectItem>
                      <SelectItem value="social">Posts Redes Sociales</SelectItem>
                      <SelectItem value="cta">Llamadas a la Acción</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tema o contenido base</label>
                  <Textarea
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    placeholder="Describe el tema o pega el contenido base..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tono</label>
                    <Select value={generateTone} onValueChange={setGenerateTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="profesional">Profesional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="persuasivo">Persuasivo</SelectItem>
                        <SelectItem value="informativo">Informativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Idioma</label>
                    <Select value={generateLanguage} onValueChange={setGenerateLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="español">Español</SelectItem>
                        <SelectItem value="inglés">Inglés</SelectItem>
                        <SelectItem value="catalán">Catalán</SelectItem>
                        <SelectItem value="francés">Francés</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {generateType === 'article' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Longitud</label>
                    <Select value={generateLength} onValueChange={setGenerateLength}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Corto (300-500 palabras)</SelectItem>
                        <SelectItem value="medium">Medio (800-1200 palabras)</SelectItem>
                        <SelectItem value="long">Largo (1500-2500 palabras)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Palabras clave (separadas por coma)</label>
                  <Input
                    value={generateKeywords}
                    onChange={(e) => setGenerateKeywords(e.target.value)}
                    placeholder="banca digital, fintech, inversiones..."
                  />
                </div>

                <Button 
                  onClick={handleGenerate} 
                  disabled={isLoading || !generateTopic.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generar Contenido
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contenido Generado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <AnimatePresence mode="wait">
                    {generatedContent ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        {/* Titles */}
                        {generatedContent.content.titles && (
                          <div className="space-y-3">
                            {generatedContent.content.titles.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className="font-medium">{item.title}</p>
                                    <Badge variant="outline" className="mt-1">{item.type}</Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(item.title, idx)}
                                  >
                                    {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Descriptions */}
                        {generatedContent.content.descriptions && (
                          <div className="space-y-3">
                            {generatedContent.content.descriptions.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p>{item.text}</p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant="outline">{item.style}</Badge>
                                      <Badge variant="secondary">{item.characters} chars</Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(item.text, idx)}
                                  >
                                    {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Article */}
                        {generatedContent.content.article && (
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h3 className="text-lg font-bold mb-2">{generatedContent.content.article.title}</h3>
                              <p className="text-muted-foreground mb-4">{generatedContent.content.article.introduction}</p>
                              
                              {generatedContent.content.article.sections?.map((section: any, idx: number) => (
                                <div key={idx} className="mb-4">
                                  <h4 className="font-semibold text-primary">{section.heading}</h4>
                                  <p className="mt-1">{section.content}</p>
                                </div>
                              ))}

                              <div className="mt-4 pt-4 border-t">
                                <p className="font-medium">{generatedContent.content.article.conclusion}</p>
                              </div>

                              {generatedContent.content.article.key_points && (
                                <div className="mt-4">
                                  <h5 className="font-medium mb-2">Puntos clave:</h5>
                                  <ul className="list-disc list-inside space-y-1">
                                    {generatedContent.content.article.key_points.map((point: string, idx: number) => (
                                      <li key={idx}>{point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Social Posts */}
                        {generatedContent.content.social_posts && (
                          <div className="space-y-3">
                            {Object.entries(generatedContent.content.social_posts).map(([platform, data]: [string, any], idx) => (
                              <div key={platform} className="p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <Badge className="mb-2 capitalize">{platform}</Badge>
                                    <p>{data.text || data.caption}</p>
                                    {data.hashtags && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {data.hashtags.map((tag: string, i: number) => (
                                          <Badge key={i} variant="outline">#{tag}</Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(data.text || data.caption, idx)}
                                  >
                                    {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* CTAs */}
                        {generatedContent.content.ctas && (
                          <div className="space-y-3">
                            {generatedContent.content.ctas.map((cta: any, idx: number) => (
                              <div key={idx} className="p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-start gap-2">
                                  <div>
                                    <p className="font-medium">{cta.text}</p>
                                    <div className="flex gap-2 mt-1">
                                      <Badge variant="outline">{cta.type}</Badge>
                                      <Badge variant={cta.urgency === 'alta' ? 'destructive' : 'secondary'}>
                                        Urgencia: {cta.urgency}
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(cta.text, idx)}
                                  >
                                    {copiedIndex === idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Summary */}
                        {generatedContent.content.summary && (
                          <div className="space-y-3">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Resumen Corto</h4>
                              <p>{generatedContent.content.summary.short}</p>
                            </div>
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Resumen Medio</h4>
                              <p>{generatedContent.content.summary.medium}</p>
                            </div>
                            {generatedContent.content.summary.key_points && (
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-semibold mb-2">Puntos Clave</h4>
                                <ul className="list-disc list-inside">
                                  {generatedContent.content.summary.key_points.map((point: string, idx: number) => (
                                    <li key={idx}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Raw content fallback */}
                        {generatedContent.content.raw && (
                          <div className="p-4 bg-muted rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm">{generatedContent.content.raw}</pre>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                        <p>El contenido generado aparecerá aquí</p>
                      </div>
                    )}
                  </AnimatePresence>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analizar Calidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={qualityTitle}
                    onChange={(e) => setQualityTitle(e.target.value)}
                    placeholder="Título del contenido"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contenido a analizar</label>
                  <Textarea
                    value={qualityContent}
                    onChange={(e) => setQualityContent(e.target.value)}
                    placeholder="Pega aquí el contenido completo..."
                    rows={10}
                  />
                </div>
                <Button 
                  onClick={handleAnalyzeQuality} 
                  disabled={isLoading || !qualityContent.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Analizar Calidad
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultados del Análisis</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {qualityAnalysis ? (
                    <div className="space-y-6">
                      {/* Overall Score */}
                      <div className="text-center p-6 bg-muted rounded-lg">
                        <div className={`text-5xl font-bold ${getScoreColor(qualityAnalysis.overall_score)}`}>
                          {qualityAnalysis.overall_score}
                        </div>
                        <p className="text-muted-foreground mt-2">Puntuación General</p>
                        <Progress 
                          value={qualityAnalysis.overall_score} 
                          className="mt-4 h-3"
                        />
                      </div>

                      {/* Score Breakdown */}
                      <div className="grid grid-cols-2 gap-4">
                        {qualityAnalysis.readability && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4" />
                              <span className="font-medium">Legibilidad</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(qualityAnalysis.readability.score)}`}>
                              {qualityAnalysis.readability.score}
                            </div>
                            <Progress value={qualityAnalysis.readability.score} className="mt-2 h-2" />
                          </div>
                        )}
                        {qualityAnalysis.seo && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Search className="h-4 w-4" />
                              <span className="font-medium">SEO</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(qualityAnalysis.seo.score)}`}>
                              {qualityAnalysis.seo.score}
                            </div>
                            <Progress value={qualityAnalysis.seo.score} className="mt-2 h-2" />
                          </div>
                        )}
                        {qualityAnalysis.engagement && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4" />
                              <span className="font-medium">Engagement</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(qualityAnalysis.engagement.score)}`}>
                              {qualityAnalysis.engagement.score}
                            </div>
                            <Progress value={qualityAnalysis.engagement.score} className="mt-2 h-2" />
                          </div>
                        )}
                        {qualityAnalysis.grammar && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="font-medium">Gramática</span>
                            </div>
                            <div className={`text-2xl font-bold ${getScoreColor(qualityAnalysis.grammar.score)}`}>
                              {qualityAnalysis.grammar.score}
                            </div>
                            <Progress value={qualityAnalysis.grammar.score} className="mt-2 h-2" />
                          </div>
                        )}
                      </div>

                      {/* Top Improvements */}
                      {qualityAnalysis.top_improvements && qualityAnalysis.top_improvements.length > 0 && (
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <Lightbulb className="h-4 w-4 text-yellow-500" />
                            Mejoras Prioritarias
                          </h4>
                          <ul className="space-y-2">
                            {qualityAnalysis.top_improvements.map((improvement: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span>{improvement}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xl font-bold">{qualityAnalysis.word_count || 0}</div>
                          <p className="text-xs text-muted-foreground">Palabras</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xl font-bold">{qualityAnalysis.readability?.avg_sentence_length || 0}</div>
                          <p className="text-xs text-muted-foreground">Palabras/Oración</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="text-xl font-bold">{qualityAnalysis.tone?.detected || '-'}</div>
                          <p className="text-xs text-muted-foreground">Tono</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                      <p>Los resultados aparecerán aquí</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Sugerencias SEO
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título actual</label>
                  <Input
                    value={seoTitle}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    placeholder="Título de la página/artículo"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Palabras clave objetivo</label>
                  <Input
                    value={seoKeywords}
                    onChange={(e) => setSeoKeywords(e.target.value)}
                    placeholder="banca digital, inversiones, fintech..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contenido</label>
                  <Textarea
                    value={seoContent}
                    onChange={(e) => setSeoContent(e.target.value)}
                    placeholder="Pega el contenido para analizar..."
                    rows={8}
                  />
                </div>
                <Button 
                  onClick={handleSuggestSEO} 
                  disabled={isLoading || (!seoContent.trim() && !seoTitle.trim())}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4 mr-2" />
                  )}
                  Obtener Recomendaciones SEO
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recomendaciones SEO</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {seoRecommendations ? (
                    <div className="space-y-6">
                      {/* SEO Score */}
                      <div className="text-center p-6 bg-muted rounded-lg">
                        <div className={`text-5xl font-bold ${getScoreColor(seoRecommendations.current_seo_score)}`}>
                          {seoRecommendations.current_seo_score}
                        </div>
                        <p className="text-muted-foreground mt-2">Puntuación SEO Actual</p>
                        <Progress 
                          value={seoRecommendations.current_seo_score} 
                          className="mt-4 h-3"
                        />
                      </div>

                      {/* Quick Wins */}
                      {seoRecommendations.quick_wins && seoRecommendations.quick_wins.length > 0 && (
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <h4 className="font-semibold flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-green-500" />
                            Quick Wins
                          </h4>
                          <div className="space-y-2">
                            {seoRecommendations.quick_wins.slice(0, 5).map((win: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-background rounded">
                                <span className="text-sm">{win.action}</span>
                                <div className="flex gap-1">
                                  <Badge variant={win.impact === 'alto' ? 'default' : 'secondary'}>
                                    {win.impact}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Title Suggestions */}
                      {seoRecommendations.title_recommendations?.suggestions && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Sugerencias de Título</h4>
                          {seoRecommendations.title_recommendations.suggestions.map((sug: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="flex justify-between items-start">
                                <p className="font-medium">{sug.text}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(sug.text, 100 + idx)}
                                >
                                  {copiedIndex === 100 + idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{sug.reason}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meta Description Suggestions */}
                      {seoRecommendations.meta_description_recommendations?.suggested && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Sugerencias de Meta Descripción</h4>
                          {seoRecommendations.meta_description_recommendations.suggested.map((sug: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg">
                              <div className="flex justify-between items-start">
                                <p>{sug.text}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(sug.text, 200 + idx)}
                                >
                                  {copiedIndex === 200 + idx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              <Badge variant="outline" className="mt-1">{sug.focus}</Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Keyword Recommendations */}
                      {seoRecommendations.keyword_recommendations && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Palabras Clave Recomendadas</h4>
                          {seoRecommendations.keyword_recommendations.primary && (
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <p className="font-medium">{seoRecommendations.keyword_recommendations.primary.keyword}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge>Principal</Badge>
                                <Badge variant="outline">Volumen: {seoRecommendations.keyword_recommendations.primary.search_volume_estimate}</Badge>
                              </div>
                            </div>
                          )}
                          {seoRecommendations.keyword_recommendations.long_tail && (
                            <div className="flex flex-wrap gap-2">
                              {seoRecommendations.keyword_recommendations.long_tail.map((kw: any, idx: number) => (
                                <Badge key={idx} variant="secondary">{kw.keyword}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Priority Actions */}
                      {seoRecommendations.priority_actions && seoRecommendations.priority_actions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-semibold">Acciones Prioritarias</h4>
                          {seoRecommendations.priority_actions.map((action: any, idx: number) => (
                            <div key={idx} className="p-3 bg-muted rounded-lg flex items-start gap-3">
                              <Badge className="flex-shrink-0">{action.priority}</Badge>
                              <div>
                                <p className="font-medium">{action.action}</p>
                                <p className="text-sm text-muted-foreground">{action.expected_impact}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Search className="h-12 w-12 mb-4 opacity-50" />
                      <p>Las recomendaciones aparecerán aquí</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5 text-primary" />
                  Auto-Etiquetado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={tagTitle}
                    onChange={(e) => setTagTitle(e.target.value)}
                    placeholder="Título del contenido"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contenido</label>
                  <Textarea
                    value={tagContent}
                    onChange={(e) => setTagContent(e.target.value)}
                    placeholder="Pega el contenido para categorizar automáticamente..."
                    rows={10}
                  />
                </div>
                <Button 
                  onClick={handleAutoTag} 
                  disabled={isLoading || (!tagContent.trim() && !tagTitle.trim())}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Tags className="h-4 w-4 mr-2" />
                  )}
                  Categorizar Automáticamente
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorización Sugerida</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {tagAnalysis ? (
                    <div className="space-y-6">
                      {/* Auto Summary */}
                      {tagAnalysis.auto_summary && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Resumen Automático</h4>
                          <p className="text-sm">{tagAnalysis.auto_summary}</p>
                        </div>
                      )}

                      {/* Content Type */}
                      {tagAnalysis.content_type && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Tipo de Contenido:</span>
                          <Badge variant="default" className="capitalize">
                            {tagAnalysis.content_type.detected}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            ({tagAnalysis.content_type.confidence}% confianza)
                          </span>
                        </div>
                      )}

                      {/* Sentiment */}
                      {tagAnalysis.sentiment && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">Sentimiento:</span>
                          <Badge variant={
                            tagAnalysis.sentiment.overall === 'positivo' ? 'default' :
                            tagAnalysis.sentiment.overall === 'negativo' ? 'destructive' : 'secondary'
                          }>
                            {tagAnalysis.sentiment.overall}
                          </Badge>
                        </div>
                      )}

                      {/* Suggested Categories */}
                      {tagAnalysis.suggested_categories && tagAnalysis.suggested_categories.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Categorías Sugeridas</h4>
                          <div className="space-y-2">
                            {tagAnalysis.suggested_categories.map((cat: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{cat.name}</span>
                                  {cat.is_existing && <Badge variant="outline">Existente</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress value={cat.confidence} className="w-20 h-2" />
                                  <span className="text-sm text-muted-foreground">{cat.confidence}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested Tags */}
                      {tagAnalysis.suggested_tags && tagAnalysis.suggested_tags.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Etiquetas Sugeridas</h4>
                          <div className="flex flex-wrap gap-2">
                            {tagAnalysis.suggested_tags.map((tag: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant={tag.is_existing ? 'default' : 'outline'}
                                className="cursor-pointer hover:bg-primary/80"
                                onClick={() => copyToClipboard(tag.name, 300 + idx)}
                              >
                                {tag.name}
                                <span className="ml-1 opacity-60 text-xs">({tag.confidence}%)</span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Topics */}
                      {tagAnalysis.topics && tagAnalysis.topics.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Temas Detectados</h4>
                          <div className="space-y-2">
                            {tagAnalysis.topics.map((topic: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="text-sm">{topic.topic}</span>
                                <Progress value={topic.relevance} className="flex-1 h-2" />
                                <span className="text-sm text-muted-foreground">{topic.relevance}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Entities */}
                      {tagAnalysis.entities_detected && (
                        <div>
                          <h4 className="font-semibold mb-3">Entidades Detectadas</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {tagAnalysis.entities_detected.organizations?.length > 0 && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Organizaciones</p>
                                <div className="flex flex-wrap gap-1">
                                  {tagAnalysis.entities_detected.organizations.map((org: string, idx: number) => (
                                    <Badge key={idx} variant="secondary">{org}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {tagAnalysis.entities_detected.people?.length > 0 && (
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Personas</p>
                                <div className="flex flex-wrap gap-1">
                                  {tagAnalysis.entities_detected.people.map((person: string, idx: number) => (
                                    <Badge key={idx} variant="secondary">{person}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {tagAnalysis.entities_detected.concepts?.length > 0 && (
                              <div className="p-3 bg-muted rounded-lg col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">Conceptos</p>
                                <div className="flex flex-wrap gap-1">
                                  {tagAnalysis.entities_detected.concepts.map((concept: string, idx: number) => (
                                    <Badge key={idx} variant="outline">{concept}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Audience */}
                      {tagAnalysis.audience && (
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold mb-2">Audiencia Sugerida</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge>{tagAnalysis.audience.suggested}</Badge>
                            <Badge variant="outline">{tagAnalysis.audience.age_group}</Badge>
                            <Badge variant="secondary">{tagAnalysis.audience.expertise_level}</Badge>
                          </div>
                        </div>
                      )}

                      {/* Key Phrases */}
                      {tagAnalysis.key_phrases && tagAnalysis.key_phrases.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Frases Clave</h4>
                          <div className="flex flex-wrap gap-2">
                            {tagAnalysis.key_phrases.map((phrase: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                "{phrase}"
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <Tags className="h-12 w-12 mb-4 opacity-50" />
                      <p>Las etiquetas sugeridas aparecerán aquí</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIContentStudio;
