import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Search, 
  Bot, 
  Book, 
  Code, 
  Zap,
  MessageSquare,
  ChevronRight,
  Star,
  Clock,
  Sparkles,
  Send,
  FileCode,
  Database,
  Shield,
  Settings
} from 'lucide-react';

interface DocCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  articles: number;
  description: string;
}

interface DocArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: number;
  views: number;
  updated: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const mockCategories: DocCategory[] = [
  { id: '1', name: 'Guía de Inicio', icon: <Zap className="h-5 w-5" />, articles: 12, description: 'Primeros pasos con la plataforma' },
  { id: '2', name: 'API Reference', icon: <Code className="h-5 w-5" />, articles: 45, description: 'Documentación completa de endpoints' },
  { id: '3', name: 'Integraciones', icon: <Database className="h-5 w-5" />, articles: 28, description: 'Conecta con tus herramientas favoritas' },
  { id: '4', name: 'Seguridad', icon: <Shield className="h-5 w-5" />, articles: 15, description: 'Mejores prácticas de seguridad' },
  { id: '5', name: 'Configuración', icon: <Settings className="h-5 w-5" />, articles: 22, description: 'Personaliza tu experiencia' },
  { id: '6', name: 'SDK & Libraries', icon: <FileCode className="h-5 w-5" />, articles: 18, description: 'SDKs para todos los lenguajes' },
];

const mockArticles: DocArticle[] = [
  { id: '1', title: 'Configuración inicial del CRM', category: 'Guía de Inicio', excerpt: 'Aprende a configurar tu espacio de trabajo desde cero...', readTime: 5, views: 1250, updated: '2024-01-15' },
  { id: '2', title: 'Autenticación OAuth 2.0', category: 'API Reference', excerpt: 'Implementa autenticación segura en tus integraciones...', readTime: 8, views: 890, updated: '2024-01-14' },
  { id: '3', title: 'Webhooks y eventos en tiempo real', category: 'Integraciones', excerpt: 'Configura webhooks para recibir notificaciones...', readTime: 6, views: 756, updated: '2024-01-13' },
  { id: '4', title: 'Cumplimiento GDPR', category: 'Seguridad', excerpt: 'Guía completa para el cumplimiento normativo...', readTime: 10, views: 1100, updated: '2024-01-12' },
  { id: '5', title: 'Personalización de campos', category: 'Configuración', excerpt: 'Crea campos personalizados para tu negocio...', readTime: 4, views: 650, updated: '2024-01-11' },
];

export const AIDocumentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('browse');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'assistant', content: '¡Hola! Soy tu asistente de documentación. Puedo ayudarte a encontrar información, explicar conceptos técnicos o guiarte paso a paso. ¿En qué puedo ayudarte?', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(inputMessage),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const getAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('api') || q.includes('endpoint')) {
      return 'Nuestra API REST sigue los estándares OpenAPI 3.0. Para autenticarte, necesitas incluir el header `Authorization: Bearer <token>` en todas las peticiones. ¿Te gustaría ver ejemplos de código para algún endpoint específico?';
    }
    if (q.includes('webhook') || q.includes('evento')) {
      return 'Los webhooks te permiten recibir notificaciones en tiempo real. Puedes configurarlos en Ajustes > Integraciones > Webhooks. Soportamos eventos como: lead.created, deal.updated, contact.deleted. ¿Necesitas ayuda con la configuración?';
    }
    if (q.includes('gdpr') || q.includes('privacidad')) {
      return 'Cumplimos con GDPR, SOC2 y PCI-DSS. Puedes gestionar los derechos de los usuarios (acceso, rectificación, eliminación) desde el panel de Compliance. También ofrecemos exportación de datos en formato portable. ¿Quieres saber más sobre algún aspecto específico?';
    }
    return 'Gracias por tu pregunta. Basándome en nuestra documentación, te recomiendo revisar la sección de Guía de Inicio para una visión general, o puedo buscar información más específica si me das más detalles sobre lo que necesitas.';
  };

  const suggestedQuestions = [
    '¿Cómo configuro webhooks?',
    '¿Cuál es el límite de la API?',
    'Explícame el modelo de datos',
    '¿Cómo exporto datos GDPR?'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Book className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Documentación AI-Powered</h2>
            <p className="text-sm text-muted-foreground">Centro de conocimiento con asistente inteligente</p>
          </div>
        </div>
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Enhanced
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busca en la documentación o hazle una pregunta al asistente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
            <Button size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
              <Bot className="h-4 w-4 mr-2" />
              Preguntar a IA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Explorar
          </TabsTrigger>
          <TabsTrigger value="assistant" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Asistente IA
          </TabsTrigger>
          <TabsTrigger value="popular" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Popular
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {mockCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {category.icon}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold mt-3">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  <Badge variant="secondary" className="mt-3">
                    {category.articles} artículos
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Artículos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockArticles.map((article) => (
                  <div key={article.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{article.readTime} min</span>
                      <Badge variant="outline">{article.category}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistant" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="col-span-2">
              <CardHeader className="border-b">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Asistente de Documentación
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-96 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mb-1">
                              <Bot className="h-3 w-3" />
                              <span className="text-xs font-medium">Asistente IA</span>
                            </div>
                          )}
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Escribe tu pregunta..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Preguntas Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setInputMessage(question)}
                    >
                      <Sparkles className="h-3 w-3 mr-2 text-primary" />
                      <span className="text-sm">{question}</span>
                    </Button>
                  ))}
                </div>

                <div className="mt-6 p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Capacidades IA</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Búsqueda semántica</li>
                    <li>• Explicaciones contextuales</li>
                    <li>• Generación de código</li>
                    <li>• Troubleshooting guiado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="popular" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {mockArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <Badge variant="secondary">{article.category}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" />
                      {article.views}
                    </div>
                  </div>
                  <h3 className="font-semibold mt-3">{article.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{article.excerpt}</p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {article.readTime} min de lectura
                    </span>
                    <span>Actualizado: {article.updated}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIDocumentation;
