import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Brain, 
  Mic, 
  Users, 
  TrendingUp, 
  DollarSign, 
  HeadphonesIcon,
  Factory,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AutonomousAgentsPanel } from '@/components/admin/ai-agents/AutonomousAgentsPanel';
import { PredictiveCopilotPanel } from '@/components/admin/ai-agents/PredictiveCopilotPanel';
import { VoiceInterfacePanel } from '@/components/admin/ai-agents/VoiceInterfacePanel';
import { SpecificAgentsPanel } from '@/components/admin/agents/SpecificAgentsPanel';

export default function AIAgentsPage() {
  const [activeTab, setActiveTab] = useState('autonomous');

  const agentCategories = [
    { id: 'autonomous', name: 'Agentes Autónomos', icon: Bot, description: 'Agentes con ejecución automática' },
    { id: 'copilot', name: 'Copiloto Predictivo', icon: Brain, description: 'Asistencia inteligente en tiempo real' },
    { id: 'voice', name: 'Interfaz de Voz', icon: Mic, description: 'Comandos y control por voz' },
    { id: 'specific', name: 'Agentes Específicos', icon: Users, description: 'Sales, CS, Finance, Operations' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/admin-obelixia">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Agentes IA Específicos</h1>
              <p className="text-muted-foreground">
                Gestiona y configura los agentes de inteligencia artificial para cada área
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Enterprise AI
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Bot className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-muted-foreground">Agentes Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,847</p>
                  <p className="text-xs text-muted-foreground">Acciones Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Brain className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">94.2%</p>
                  <p className="text-xs text-muted-foreground">Precisión</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">€47K</p>
                  <p className="text-xs text-muted-foreground">Valor Generado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1">
            {agentCategories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex flex-col items-center gap-1 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <cat.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="autonomous" className="space-y-4">
            <AutonomousAgentsPanel />
          </TabsContent>

          <TabsContent value="copilot" className="space-y-4">
            <PredictiveCopilotPanel />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <VoiceInterfacePanel />
          </TabsContent>

          <TabsContent value="specific" className="space-y-4">
            <SpecificAgentsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
