/**
 * ERPAdvancedRatiosPanel - Panel consolidado de análisis financieros avanzados
 * Fase 5: Z-Score, DuPont, Capital Circulante, EBIT/EBITDA, Rating Bancario, Valor Añadido
 * REFACTORIZADO: Usa subcomponentes modulares para mejor mantenibilidad
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  RefreshCw,
  Brain,
  AlertTriangle,
  CheckCircle,
  Building2,
  Loader2,
  Target,
  Shield,
  Zap,
  PieChart,
  BarChart3,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Sparkles
} from 'lucide-react';
import { useERPAdvancedRatios, type AdvancedRatiosData, type AIAdvancedInsights } from '@/hooks/erp/useERPAdvancedRatios';
import { useERPContext } from '@/hooks/erp/useERPContext';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Subcomponentes refactorizados
import { ERPZScoreCard } from './advanced-ratios/ERPZScoreCard';
import { ERPDuPontPyramid } from './advanced-ratios/ERPDuPontPyramid';
import { ERPBankRatingCard } from './advanced-ratios/ERPBankRatingCard';
import { ERPWorkingCapitalCard } from './advanced-ratios/ERPWorkingCapitalCard';
import { ERPEBITDACard } from './advanced-ratios/ERPEBITDACard';
import { ERPAddedValueCard } from './advanced-ratios/ERPAddedValueCard';

interface ERPAdvancedRatiosPanelProps {
  className?: string;
}

// Colores para zonas Z-Score
const zScoreColors = {
  safe: '#22c55e',
  gray: '#eab308',
  distress: '#ef4444'
};

// Colores para ratings
const ratingColors: Record<string, string> = {
  'AAA': '#22c55e',
  'AA': '#4ade80',
  'A': '#86efac',
  'BBB': '#fde047',
  'BB': '#facc15',
  'B': '#f97316',
  'CCC': '#ef4444'
};

export function ERPAdvancedRatiosPanel({ className }: ERPAdvancedRatiosPanelProps) {
  const { currentCompany } = useERPContext();
  const {
    isLoading,
    isAnalyzing,
    data,
    aiInsights,
    error,
    lastCalculation,
    fetchAndCalculate,
    analyzeWithAI,
    formatNumber,
    formatPercent,
    formatCurrency
  } = useERPAdvancedRatios();

  const [activeTab, setActiveTab] = useState('zscore');
  const [selectedSector, setSelectedSector] = useState('general');

  // Cargar datos al montar
  useEffect(() => {
    if (currentCompany?.id) {
      fetchAndCalculate(currentCompany.id, selectedSector);
    }
  }, [currentCompany?.id, selectedSector, fetchAndCalculate]);

  // Analizar con IA
  const handleAnalyze = useCallback(async () => {
    if (data) {
      await analyzeWithAI(data, selectedSector);
    }
  }, [data, selectedSector, analyzeWithAI]);

  // Sin empresa seleccionada
  if (!currentCompany) {
    return (
      <Card className={cn("border-dashed opacity-50", className)}>
        <CardContent className="py-10 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Selecciona una empresa para ver análisis avanzados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                Análisis Financiero Avanzado
              </CardTitle>
              <CardDescription>
                Z-Score, DuPont, Capital Circulante, EBIT/EBITDA y Rating Bancario
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="manufacturing">Manufactura</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="services">Servicios</SelectItem>
                  <SelectItem value="technology">Tecnología</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAndCalculate(currentCompany.id, selectedSector)}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Actualizar
              </Button>
              <Button
                size="sm"
                onClick={handleAnalyze}
                disabled={!data || isAnalyzing}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Analizar con IA
              </Button>
            </div>
          </div>
          {lastCalculation && (
            <p className="text-xs text-muted-foreground mt-2">
              Último cálculo: {formatDistanceToNow(lastCalculation, { locale: es, addSuffix: true })}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && !data && (
        <Card>
          <CardContent className="py-10 text-center">
            <Loader2 className="h-10 w-10 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Calculando análisis avanzados...</p>
          </CardContent>
        </Card>
      )}

      {/* Contenido Principal */}
      {data && (
        <>
          {/* KPIs Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Z-Score */}
            <Card className="relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20"
                style={{ backgroundColor: zScoreColors[data.zScore[0]?.zone || 'gray'] }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Z-Score Altman
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" style={{ color: zScoreColors[data.zScore[0]?.zone || 'gray'] }}>
                  {data.zScore[0]?.zScore?.toFixed(2) || 'N/A'}
                </div>
                <Badge 
                  variant="outline" 
                  className="mt-2"
                  style={{ 
                    borderColor: zScoreColors[data.zScore[0]?.zone || 'gray'],
                    color: zScoreColors[data.zScore[0]?.zone || 'gray']
                  }}
                >
                  {data.zScore[0]?.zone === 'safe' ? 'Zona Segura' : 
                   data.zScore[0]?.zone === 'gray' ? 'Zona Gris' : 'Zona Riesgo'}
                </Badge>
              </CardContent>
            </Card>

            {/* ROE DuPont */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  ROE (DuPont)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {data.duPont[0]?.roe ? formatPercent(data.duPont[0].roe * 100) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ROA: {data.duPont[0]?.roa ? formatPercent(data.duPont[0].roa * 100) : 'N/A'}
                </p>
              </CardContent>
            </Card>

            {/* Rating Bancario */}
            <Card className="relative overflow-hidden">
              <div 
                className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20"
                style={{ backgroundColor: ratingColors[data.bankRating.rating] || '#94a3b8' }}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Rating Bancario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-3xl font-bold"
                  style={{ color: ratingColors[data.bankRating.rating] || '#94a3b8' }}
                >
                  {data.bankRating.rating}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Score: {data.bankRating.score.toFixed(0)}/100
                </p>
              </CardContent>
            </Card>

            {/* EBITDA */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Margen EBITDA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {data.ebitEbitda[0]?.margenEbitda ? formatPercent(data.ebitEbitda[0].margenEbitda) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  EBITDA: {data.ebitEbitda[0]?.ebitda ? formatCurrency(data.ebitEbitda[0].ebitda) : 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights si está disponible */}
          {aiInsights && (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Análisis IA
                  <Badge variant="secondary" className="ml-2">
                    Score: {aiInsights.healthScore}/100
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{aiInsights.overallAssessment}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fortalezas */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      Fortalezas
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.strengths?.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <ArrowUpRight className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Debilidades */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Áreas de Mejora
                    </h4>
                    <ul className="space-y-1">
                      {aiInsights.weaknesses?.slice(0, 3).map((w, i) => (
                        <li key={i} className="text-xs flex items-start gap-2">
                          <ArrowDownRight className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recomendaciones */}
                {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                  <div className="pt-2 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      Recomendaciones Prioritarias
                    </h4>
                    <div className="space-y-2">
                      {aiInsights.recommendations.slice(0, 3).map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          <div className="flex-1 text-xs">
                            <span className="font-medium">{rec.area}:</span> {rec.action}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs con análisis detallados */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="zscore" className="text-xs">Z-Score</TabsTrigger>
              <TabsTrigger value="dupont" className="text-xs">DuPont</TabsTrigger>
              <TabsTrigger value="working" className="text-xs">Capital Circ.</TabsTrigger>
              <TabsTrigger value="ebitda" className="text-xs">EBIT/EBITDA</TabsTrigger>
              <TabsTrigger value="rating" className="text-xs">Rating</TabsTrigger>
              <TabsTrigger value="added" className="text-xs">Valor Añadido</TabsTrigger>
            </TabsList>

            {/* Tab Z-Score - Componente Refactorizado */}
            <TabsContent value="zscore">
              <ERPZScoreCard data={data.zScore} sector={selectedSector} />
            </TabsContent>

            {/* Tab DuPont - Componente Refactorizado */}
            <TabsContent value="dupont">
              <ERPDuPontPyramid 
                data={data.duPont} 
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
                formatNumber={formatNumber}
              />
            </TabsContent>

            {/* Tab Capital Circulante - Componente Refactorizado */}
            <TabsContent value="working">
              <ERPWorkingCapitalCard 
                data={data.workingCapital}
                formatCurrency={formatCurrency}
                formatNumber={formatNumber}
              />
            </TabsContent>

            {/* Tab EBIT/EBITDA - Componente Refactorizado */}
            <TabsContent value="ebitda">
              <ERPEBITDACard 
                data={data.ebitEbitda}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />
            </TabsContent>

            {/* Tab Rating Bancario - Componente Refactorizado */}
            <TabsContent value="rating">
              <ERPBankRatingCard data={data.bankRating} />
            </TabsContent>

            {/* Tab Valor Añadido - Componente Refactorizado */}
            <TabsContent value="added">
              <ERPAddedValueCard 
                data={data.addedValue}
                formatCurrency={formatCurrency}
                formatPercent={formatPercent}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default ERPAdvancedRatiosPanel;
