import React, { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Bell, 
  BarChart3, 
  Target, 
  Sparkles, 
  Headphones, 
  DollarSign,
  Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load components
const NewsChatbot = lazy(() => import('./NewsChatbot'));
const AlertChannelConfig = lazy(() => import('./AlertChannelConfig'));
const CompetitorBenchmarkDashboard = lazy(() => import('./CompetitorBenchmarkDashboard'));
const PersonalizedImpactDashboard = lazy(() => import('./PersonalizedImpactDashboard'));
const TrendPredictionDashboard = lazy(() => import('./TrendPredictionDashboard'));
const DailyAudioPlayer = lazy(() => import('./DailyAudioPlayer'));
const CommercialOpportunitiesDashboard = lazy(() => import('./CommercialOpportunitiesDashboard'));

const LoadingFallback = () => (
  <Card>
    <CardContent className="p-8 text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="mt-4 text-muted-foreground">Cargando...</p>
    </CardContent>
  </Card>
);

interface NewsAdminTabsProps {
  defaultTab?: string;
}

export const NewsAdminTabs: React.FC<NewsAdminTabsProps> = ({ defaultTab = 'chat' }) => {
  return (
    <Tabs defaultValue={defaultTab} className="space-y-6">
      <TabsList className="grid grid-cols-4 lg:grid-cols-7 gap-1">
        <TabsTrigger value="chat" className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden lg:inline">Chat IA</span>
        </TabsTrigger>
        <TabsTrigger value="alerts" className="flex items-center gap-1">
          <Bell className="h-4 w-4" />
          <span className="hidden lg:inline">Alertas</span>
        </TabsTrigger>
        <TabsTrigger value="benchmark" className="flex items-center gap-1">
          <BarChart3 className="h-4 w-4" />
          <span className="hidden lg:inline">Competencia</span>
        </TabsTrigger>
        <TabsTrigger value="impact" className="flex items-center gap-1">
          <Target className="h-4 w-4" />
          <span className="hidden lg:inline">Impacto</span>
        </TabsTrigger>
        <TabsTrigger value="trends" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          <span className="hidden lg:inline">Tendencias</span>
        </TabsTrigger>
        <TabsTrigger value="audio" className="flex items-center gap-1">
          <Headphones className="h-4 w-4" />
          <span className="hidden lg:inline">Audio</span>
        </TabsTrigger>
        <TabsTrigger value="opportunities" className="flex items-center gap-1">
          <DollarSign className="h-4 w-4" />
          <span className="hidden lg:inline">CRM</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="chat">
        <Suspense fallback={<LoadingFallback />}>
          <div className="max-w-4xl mx-auto">
            <NewsChatbot />
          </div>
        </Suspense>
      </TabsContent>

      <TabsContent value="alerts">
        <Suspense fallback={<LoadingFallback />}>
          <AlertChannelConfig />
        </Suspense>
      </TabsContent>

      <TabsContent value="benchmark">
        <Suspense fallback={<LoadingFallback />}>
          <CompetitorBenchmarkDashboard />
        </Suspense>
      </TabsContent>

      <TabsContent value="impact">
        <Suspense fallback={<LoadingFallback />}>
          <PersonalizedImpactDashboard />
        </Suspense>
      </TabsContent>

      <TabsContent value="trends">
        <Suspense fallback={<LoadingFallback />}>
          <TrendPredictionDashboard />
        </Suspense>
      </TabsContent>

      <TabsContent value="audio">
        <Suspense fallback={<LoadingFallback />}>
          <DailyAudioPlayer />
        </Suspense>
      </TabsContent>

      <TabsContent value="opportunities">
        <Suspense fallback={<LoadingFallback />}>
          <CommercialOpportunitiesDashboard />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
};

export default NewsAdminTabs;
