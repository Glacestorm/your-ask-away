import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search,
  Image,
  Type,
  Contrast,
  Accessibility,
  FileCheck,
  RefreshCw,
  Download,
  Target,
  Zap,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface WCAGIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  level: 'A' | 'AA' | 'AAA';
  criterion: string;
  description: string;
  element: string;
  selector: string;
  suggestion: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface AltTextItem {
  id: string;
  src: string;
  currentAlt: string;
  suggestedAlt: string;
  page: string;
  status: 'missing' | 'incomplete' | 'good';
}

interface ContrastResult {
  id: string;
  foreground: string;
  background: string;
  ratio: number;
  level: 'AAA' | 'AA' | 'fail';
  element: string;
  selector: string;
}

interface PageScore {
  page: string;
  url: string;
  score: number;
  issues: { errors: number; warnings: number; notices: number };
  lastChecked: string;
}

interface ChecklistItem {
  id: string;
  criterion: string;
  level: 'A' | 'AA' | 'AAA';
  description: string;
  category: string;
  checked: boolean;
  notes: string;
}

export const AccessibilityChecker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [scanUrl, setScanUrl] = useState('');
  const [overallScore, setOverallScore] = useState(78);

  // Mock data for WCAG issues
  const [wcagIssues] = useState<WCAGIssue[]>([
    {
      id: '1',
      type: 'error',
      level: 'A',
      criterion: '1.1.1',
      description: 'Image missing alt attribute',
      element: '<img src="hero.jpg">',
      selector: '.hero-section img',
      suggestion: 'Add descriptive alt text describing the image content',
      impact: 'critical'
    },
    {
      id: '2',
      type: 'error',
      level: 'A',
      criterion: '2.4.4',
      description: 'Link text not descriptive',
      element: '<a href="#">Click here</a>',
      selector: '.cta-button',
      suggestion: 'Use descriptive link text that indicates the destination',
      impact: 'serious'
    },
    {
      id: '3',
      type: 'warning',
      level: 'AA',
      criterion: '1.4.3',
      description: 'Contrast ratio below 4.5:1',
      element: '<p class="subtitle">...',
      selector: '.subtitle',
      suggestion: 'Increase contrast between text and background',
      impact: 'moderate'
    },
    {
      id: '4',
      type: 'warning',
      level: 'AA',
      criterion: '2.4.6',
      description: 'Heading levels skipped',
      element: '<h4>Section Title</h4>',
      selector: '.content h4',
      suggestion: 'Use sequential heading levels (h1 → h2 → h3)',
      impact: 'moderate'
    },
    {
      id: '5',
      type: 'info',
      level: 'AAA',
      criterion: '1.4.8',
      description: 'Line height could be improved',
      element: '<p class="body-text">...',
      selector: '.body-text',
      suggestion: 'Use line-height of at least 1.5 for better readability',
      impact: 'minor'
    }
  ]);

  // Mock alt-text items
  const [altTextItems, setAltTextItems] = useState<AltTextItem[]>([
    { id: '1', src: '/images/hero.jpg', currentAlt: '', suggestedAlt: 'Professional team meeting in modern office', page: '/home', status: 'missing' },
    { id: '2', src: '/images/product.png', currentAlt: 'img', suggestedAlt: 'Product dashboard showing analytics metrics', page: '/products', status: 'incomplete' },
    { id: '3', src: '/images/team.jpg', currentAlt: 'Our dedicated team of professionals', suggestedAlt: '', page: '/about', status: 'good' },
    { id: '4', src: '/images/service.webp', currentAlt: '', suggestedAlt: 'Customer support representative helping client', page: '/services', status: 'missing' },
    { id: '5', src: '/images/contact.jpg', currentAlt: 'contact', suggestedAlt: 'Contact form illustration with envelope icon', page: '/contact', status: 'incomplete' }
  ]);

  // Mock contrast results
  const [contrastResults] = useState<ContrastResult[]>([
    { id: '1', foreground: '#333333', background: '#FFFFFF', ratio: 12.63, level: 'AAA', element: 'Body text', selector: 'body' },
    { id: '2', foreground: '#666666', background: '#F5F5F5', ratio: 5.74, level: 'AA', element: 'Subtitle', selector: '.subtitle' },
    { id: '3', foreground: '#888888', background: '#FFFFFF', ratio: 3.54, level: 'fail', element: 'Muted text', selector: '.text-muted' },
    { id: '4', foreground: '#FFFFFF', background: '#3B82F6', ratio: 4.68, level: 'AA', element: 'Primary button', selector: '.btn-primary' },
    { id: '5', foreground: '#FFFFFF', background: '#10B981', ratio: 3.03, level: 'fail', element: 'Success button', selector: '.btn-success' }
  ]);

  // Mock page scores
  const [pageScores] = useState<PageScore[]>([
    { page: 'Home', url: '/', score: 85, issues: { errors: 2, warnings: 5, notices: 8 }, lastChecked: '2024-01-15T10:30:00Z' },
    { page: 'Products', url: '/products', score: 72, issues: { errors: 5, warnings: 8, notices: 12 }, lastChecked: '2024-01-15T10:30:00Z' },
    { page: 'About', url: '/about', score: 91, issues: { errors: 1, warnings: 3, notices: 4 }, lastChecked: '2024-01-15T10:30:00Z' },
    { page: 'Contact', url: '/contact', score: 68, issues: { errors: 7, warnings: 10, notices: 6 }, lastChecked: '2024-01-15T10:30:00Z' },
    { page: 'Blog', url: '/blog', score: 79, issues: { errors: 3, warnings: 6, notices: 9 }, lastChecked: '2024-01-15T10:30:00Z' }
  ]);

  // WCAG Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: '1', criterion: '1.1.1', level: 'A', description: 'Non-text Content - All images have alt text', category: 'Perceivable', checked: true, notes: '' },
    { id: '2', criterion: '1.2.1', level: 'A', description: 'Audio-only and Video-only - Alternatives provided', category: 'Perceivable', checked: false, notes: 'Need to add transcripts' },
    { id: '3', criterion: '1.3.1', level: 'A', description: 'Info and Relationships - Semantic HTML used', category: 'Perceivable', checked: true, notes: '' },
    { id: '4', criterion: '1.4.1', level: 'A', description: 'Use of Color - Not sole means of conveying info', category: 'Perceivable', checked: true, notes: '' },
    { id: '5', criterion: '1.4.3', level: 'AA', description: 'Contrast (Minimum) - 4.5:1 for normal text', category: 'Perceivable', checked: false, notes: 'Some text needs adjustment' },
    { id: '6', criterion: '2.1.1', level: 'A', description: 'Keyboard - All functionality keyboard accessible', category: 'Operable', checked: true, notes: '' },
    { id: '7', criterion: '2.4.1', level: 'A', description: 'Bypass Blocks - Skip navigation available', category: 'Operable', checked: false, notes: 'Need to implement skip links' },
    { id: '8', criterion: '2.4.4', level: 'A', description: 'Link Purpose - Links have descriptive text', category: 'Operable', checked: false, notes: 'Review CTA buttons' },
    { id: '9', criterion: '3.1.1', level: 'A', description: 'Language of Page - Lang attribute set', category: 'Understandable', checked: true, notes: '' },
    { id: '10', criterion: '3.2.1', level: 'A', description: 'On Focus - No unexpected context changes', category: 'Understandable', checked: true, notes: '' },
    { id: '11', criterion: '4.1.1', level: 'A', description: 'Parsing - Valid HTML markup', category: 'Robust', checked: true, notes: '' },
    { id: '12', criterion: '4.1.2', level: 'A', description: 'Name, Role, Value - ARIA attributes correct', category: 'Robust', checked: false, notes: 'Need ARIA audit' }
  ]);

  const runScan = async () => {
    setIsScanning(true);
    toast.info('Iniciando análisis WCAG...');
    
    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setIsScanning(false);
    toast.success('Análisis completado');
  };

  const updateAltText = (id: string, newAlt: string) => {
    setAltTextItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, currentAlt: newAlt, status: newAlt.length > 10 ? 'good' : 'incomplete' }
          : item
      )
    );
    toast.success('Alt text actualizado');
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(items =>
      items.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'serious': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'minor': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getContrastLevelColor = (level: string) => {
    switch (level) {
      case 'AAA': return 'bg-green-500/20 text-green-400';
      case 'AA': return 'bg-yellow-500/20 text-yellow-400';
      case 'fail': return 'bg-red-500/20 text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const checkedCount = checklist.filter(item => item.checked).length;
  const compliancePercentage = Math.round((checkedCount / checklist.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Accessibility className="h-6 w-6 text-primary" />
            Verificador de Accesibilidad WCAG
          </h2>
          <p className="text-muted-foreground">
            Análisis automático y gestión de compliance WCAG 2.1
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}%
            </div>
            <div className="text-xs text-muted-foreground">Score Global</div>
          </div>
          <Button onClick={runScan} disabled={isScanning}>
            {isScanning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {isScanning ? 'Analizando...' : 'Analizar Sitio'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Errores Críticos</p>
                <p className="text-2xl font-bold text-red-400">
                  {wcagIssues.filter(i => i.type === 'error').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Advertencias</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {wcagIssues.filter(i => i.type === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Imágenes sin Alt</p>
                <p className="text-2xl font-bold text-orange-400">
                  {altTextItems.filter(i => i.status === 'missing').length}
                </p>
              </div>
              <Image className="h-8 w-8 text-orange-400/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Compliance</p>
                <p className="text-2xl font-bold text-green-400">
                  {compliancePercentage}%
                </p>
              </div>
              <FileCheck className="h-8 w-8 text-green-400/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="scanner" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="alttext" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Alt Texts
          </TabsTrigger>
          <TabsTrigger value="contrast" className="flex items-center gap-2">
            <Contrast className="h-4 w-4" />
            Contraste
          </TabsTrigger>
          <TabsTrigger value="scores" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Scores
          </TabsTrigger>
          <TabsTrigger value="checklist" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Checklist
          </TabsTrigger>
        </TabsList>

        {/* Scanner Tab */}
        <TabsContent value="scanner" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Scanner WCAG Automático
              </CardTitle>
              <CardDescription>
                Análisis automático de problemas de accesibilidad según WCAG 2.1
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="URL a analizar (ej: /home, /products)"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={runScan} disabled={isScanning}>
                  {isScanning ? 'Analizando...' : 'Analizar'}
                </Button>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {wcagIssues.map((issue) => (
                    <Card key={issue.id} className="bg-background/50 border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {issue.type === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
                            {issue.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                            {issue.type === 'info' && <Eye className="h-5 w-5 text-blue-400" />}
                            <span className="font-medium">{issue.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">WCAG {issue.criterion}</Badge>
                            <Badge variant="outline">Nivel {issue.level}</Badge>
                            <Badge className={getImpactColor(issue.impact)}>
                              {issue.impact}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">
                            {issue.selector}
                          </code>
                        </div>
                        
                        <div className="bg-muted/50 p-2 rounded text-xs font-mono mb-2 overflow-x-auto">
                          {issue.element}
                        </div>
                        
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{issue.suggestion}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alt Text Tab */}
        <TabsContent value="alttext" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Gestión de Alt Texts
              </CardTitle>
              <CardDescription>
                Gestión centralizada de textos alternativos para imágenes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {altTextItems.map((item) => (
                    <Card key={item.id} className="bg-background/50 border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <code className="text-xs text-muted-foreground">
                                {item.src}
                              </code>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{item.page}</Badge>
                                <Badge 
                                  className={
                                    item.status === 'good' 
                                      ? 'bg-green-500/20 text-green-400'
                                      : item.status === 'missing'
                                      ? 'bg-red-500/20 text-red-400'
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }
                                >
                                  {item.status === 'good' ? 'Correcto' : item.status === 'missing' ? 'Falta' : 'Incompleto'}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-muted-foreground">Alt text actual:</label>
                              <Input
                                value={item.currentAlt}
                                onChange={(e) => updateAltText(item.id, e.target.value)}
                                placeholder="Añadir texto alternativo..."
                                className={item.status === 'missing' ? 'border-red-500/50' : ''}
                              />
                            </div>
                            
                            {item.suggestedAlt && (
                              <div className="flex items-center gap-2 text-sm">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">Sugerencia IA:</span>
                                <span className="text-foreground">{item.suggestedAlt}</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => updateAltText(item.id, item.suggestedAlt)}
                                >
                                  Aplicar
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contrast Tab */}
        <TabsContent value="contrast" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Contrast className="h-5 w-5 text-primary" />
                Verificador de Contraste
              </CardTitle>
              <CardDescription>
                Análisis de ratios de contraste según WCAG 2.1 (AA: 4.5:1, AAA: 7:1)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {contrastResults.map((result) => (
                    <Card key={result.id} className="bg-background/50 border-border/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded border border-border"
                                style={{ backgroundColor: result.foreground }}
                              />
                              <span className="text-xs text-muted-foreground">sobre</span>
                              <div 
                                className="w-8 h-8 rounded border border-border"
                                style={{ backgroundColor: result.background }}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{result.element}</div>
                              <code className="text-xs text-muted-foreground">
                                {result.selector}
                              </code>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-lg font-bold">{result.ratio.toFixed(2)}:1</div>
                              <div className="text-xs text-muted-foreground">Ratio</div>
                            </div>
                            <Badge className={getContrastLevelColor(result.level)}>
                              {result.level === 'fail' ? 'FAIL' : result.level}
                            </Badge>
                          </div>
                        </div>
                        
                        {result.level === 'fail' && (
                          <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Ratio insuficiente. Necesita al menos 4.5:1 para texto normal (AA).
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Page Scores Tab */}
        <TabsContent value="scores" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Score de Accesibilidad por Página
              </CardTitle>
              <CardDescription>
                Puntuación y estado de accesibilidad para cada página del sitio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pageScores.map((page) => (
                  <Card key={page.url} className="bg-background/50 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{page.page}</div>
                            <code className="text-xs text-muted-foreground">{page.url}</code>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getScoreColor(page.score)}`}>
                              {page.score}%
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-analizar
                          </Button>
                        </div>
                      </div>
                      
                      <Progress value={page.score} className="h-2 mb-3" />
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-400" />
                          <span>{page.issues.errors} errores</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <span>{page.issues.warnings} advertencias</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-blue-400" />
                          <span>{page.issues.notices} avisos</span>
                        </div>
                        <div className="ml-auto text-xs text-muted-foreground">
                          Último análisis: {new Date(page.lastChecked).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Checklist de Compliance WCAG 2.1
                  </CardTitle>
                  <CardDescription>
                    Lista de verificación manual para compliance completo
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {checkedCount}/{checklist.length}
                  </div>
                  <Progress value={compliancePercentage} className="w-32 h-2" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {['Perceivable', 'Operable', 'Understandable', 'Robust'].map((category) => (
                    <div key={category} className="mb-4">
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {checklist
                          .filter(item => item.category === category)
                          .map((item) => (
                            <Card 
                              key={item.id} 
                              className={`bg-background/50 border-border/30 ${
                                item.checked ? 'border-l-2 border-l-green-500' : ''
                              }`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                  <Checkbox
                                    checked={item.checked}
                                    onCheckedChange={() => toggleChecklistItem(item.id)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-xs">
                                        {item.criterion}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          item.level === 'A' 
                                            ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                            : item.level === 'AA'
                                            ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                            : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                        }
                                      >
                                        Nivel {item.level}
                                      </Badge>
                                      {item.checked && (
                                        <CheckCircle2 className="h-4 w-4 text-green-400 ml-auto" />
                                      )}
                                    </div>
                                    <p className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : ''}`}>
                                      {item.description}
                                    </p>
                                    {item.notes && (
                                      <p className="text-xs text-yellow-400 mt-1">
                                        Nota: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button onClick={() => toast.success('Informe exportado')}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Informe de Compliance
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccessibilityChecker;
