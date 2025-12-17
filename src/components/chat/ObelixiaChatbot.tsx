import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Knowledge base about ObelixIA
const OBELIXIA_KNOWLEDGE = {
  product: {
    name: "ObelixIA",
    description: "CRM Bancario Inteligente - An intelligent banking CRM platform for portfolio management",
    price: "880,000€ perpetual enterprise license with full code ownership",
    technology: "Built on React, Vite, TypeScript, Tailwind CSS, and Supabase",
  },
  features: [
    "Multi-CNAE sector support with automatic module generation",
    "AI-powered financial analysis and predictions",
    "Intelligent visit management and route planning",
    "Real-time company portfolio visualization with maps",
    "DORA/NIS2/ISO27001 compliance management",
    "Multi-language support (EN, ES, CA, FR)",
    "Holding Dashboard 360° for multi-sector enterprises",
    "Automated auditor reporting system",
    "PSD3-compliant strong customer authentication",
    "Voice-enabled AI assistant for managers",
  ],
  compliance: [
    "ISO 27001", "GDPR", "DORA", "NIS2", "PSD2/PSD3", 
    "eIDAS", "Basel III/IV", "MiFID II", "APDA (Andorra)"
  ],
  deployment: ["SaaS (Cloud)", "On-Premise", "Hybrid"],
  sectors: [
    "Banking & Finance", "Healthcare", "Retail", "Industry",
    "Construction", "Hospitality", "Professional Services"
  ],
};

function generateResponse(question: string): string {
  const q = question.toLowerCase();
  
  // Greetings
  if (q.match(/^(hola|hello|hi|hey|buenos|buenas)/)) {
    return "¡Hola! 👋 Soy el asistente virtual de ObelixIA. ¿En qué puedo ayudarte? Puedo responder preguntas sobre nuestras funcionalidades, precios, compliance, sectores soportados y más.";
  }
  
  // Price questions
  if (q.includes('precio') || q.includes('cuesta') || q.includes('coste') || q.includes('price') || q.includes('cost')) {
    return `💰 **Precio de ObelixIA**\n\nLa licencia empresarial perpetua de ObelixIA tiene un precio de **${OBELIXIA_KNOWLEDGE.product.price}**.\n\nEsto incluye:\n• Propiedad completa del código fuente\n• 195+ componentes\n• 72 Edge Functions\n• 48+ tablas de base de datos\n• Seguridad de grado bancario\n• 35+ módulos funcionales\n\n¿Te gustaría saber más sobre lo que incluye?`;
  }
  
  // Features questions
  if (q.includes('función') || q.includes('característica') || q.includes('feature') || q.includes('puede hacer') || q.includes('qué hace')) {
    const features = OBELIXIA_KNOWLEDGE.features.slice(0, 5).map(f => `• ${f}`).join('\n');
    return `✨ **Funcionalidades principales de ObelixIA**\n\n${features}\n\n...y muchas más.\n\n¿Te interesa conocer alguna funcionalidad en detalle?`;
  }
  
  // Compliance questions
  if (q.includes('compliance') || q.includes('normativa') || q.includes('regulación') || q.includes('gdpr') || q.includes('dora') || q.includes('iso')) {
    const compliance = OBELIXIA_KNOWLEDGE.compliance.join(', ');
    return `🛡️ **Compliance y Normativas**\n\nObelixIA cumple con las siguientes regulaciones:\n${compliance}\n\nNuestro sistema incluye:\n• Dashboard de cumplimiento DORA/NIS2\n• Generación automática de informes para auditores\n• Gestión de incidentes de seguridad\n• Tests de estrés automatizados\n\n¿Necesitas más información sobre alguna regulación específica?`;
  }
  
  // Sectors
  if (q.includes('sector') || q.includes('industria') || q.includes('cnae')) {
    const sectors = OBELIXIA_KNOWLEDGE.sectors.join(', ');
    return `🏢 **Sectores soportados**\n\nObelixIA soporta múltiples sectores:\n${sectors}\n\n**Sistema Multi-CNAE único:**\n• Una empresa puede instalar múltiples sectores simultáneamente\n• Descuentos automáticos por volumen (5-18%)\n• Bundles sectoriales con descuentos del 20-30%\n• Contabilidad consolidada multi-sector\n\n¿Te interesa algún sector en particular?`;
  }
  
  // Deployment
  if (q.includes('deploy') || q.includes('instalación') || q.includes('on-premise') || q.includes('cloud') || q.includes('saas')) {
    return `☁️ **Opciones de despliegue**\n\nObelixIA ofrece tres modalidades:\n\n1. **SaaS (Cloud)**: Despliegue rápido sin infraestructura propia\n2. **On-Premise**: Instalación local para máximo control\n3. **Hybrid**: Combinación de ambos modelos\n\nRecomendamos On-Premise o Hybrid para el sector bancario por requisitos regulatorios (DORA).\n\n¿Cuál modelo te interesa?`;
  }
  
  // Technology
  if (q.includes('tecnología') || q.includes('tech') || q.includes('stack') || q.includes('react') || q.includes('supabase')) {
    return `🔧 **Stack Tecnológico**\n\nObelixIA está construido con tecnologías modernas:\n\n• **Frontend**: React 19, TypeScript, Tailwind CSS\n• **Backend**: Supabase (PostgreSQL + Edge Functions)\n• **UI**: Shadcn/ui, Framer Motion\n• **Mapas**: MapLibre GL, Mapbox\n• **IA**: Integración con Gemini AI\n\nArquitectura escalable para 500-1000+ usuarios simultáneos.`;
  }
  
  // AI features
  if (q.includes('ia') || q.includes('inteligencia artificial') || q.includes('ai') || q.includes('artificial')) {
    return `🤖 **Capacidades de IA**\n\nObelixIA integra inteligencia artificial en múltiples áreas:\n\n• Asistente virtual con voz para gestores\n• Análisis financiero predictivo\n• Generación automática de planes de acción\n• Detección de anomalías comportamentales\n• Auto-remediación de problemas del sistema\n• Parsing inteligente de PDFs financieros\n• Sugerencias de bundles CNAE mediante IA\n\n¿Quieres profundizar en alguna de estas capacidades?`;
  }
  
  // Security
  if (q.includes('seguridad') || q.includes('security') || q.includes('autenticación') || q.includes('mfa')) {
    return `🔒 **Seguridad de Grado Bancario**\n\nObelixIA implementa múltiples capas de seguridad:\n\n• Autenticación multifactor (MFA) con WebAuthn/Passkeys\n• Biometría comportamental (patrones de tecleo/mouse)\n• Row Level Security (RLS) en toda la base de datos\n• Cifrado AES-256-GCM para datos sensibles\n• Detección de fraude contextual AML\n• Logs de auditoría completos\n• Headers de seguridad HTTP estrictos\n\nCumplimos con PSD3/SCA para autenticación fuerte.`;
  }
  
  // What is ObelixIA
  if (q.includes('qué es') || q.includes('what is') || q.includes('obelixia')) {
    return `🧠 **¿Qué es ObelixIA?**\n\nObelixIA es un **CRM Bancario Inteligente** diseñado para la gestión de carteras comerciales en entidades financieras.\n\n**Valor principal:**\n• Gestión geográfica de empresas con mapas interactivos\n• Sistema de visitas y seguimiento comercial\n• Análisis financiero automático (Z-Score, ratios sectoriales)\n• Cumplimiento normativo automatizado\n• IA integrada para productividad\n\nIdeal para bancos, gestoras y entidades financieras en España, Andorra y Europa.\n\n¿Qué aspecto te gustaría explorar?`;
  }
  
  // Demo
  if (q.includes('demo') || q.includes('prueba') || q.includes('trial') || q.includes('probar')) {
    return `🎮 **Demo de ObelixIA**\n\nPuedes probar ObelixIA con nuestra demo gratuita que incluye:\n\n• 50 empresas de ejemplo\n• 100+ visitas simuladas\n• Estados financieros completos\n• Todas las funcionalidades activas\n• Duración: 2 horas\n\nHaz clic en "Probar Demo Gratuita" en la página de inicio de sesión para comenzar.\n\n¿Necesitas ayuda para iniciar la demo?`;
  }
  
  // Contact
  if (q.includes('contacto') || q.includes('contact') || q.includes('hablar') || q.includes('llamar')) {
    return `📞 **Contacto**\n\nPuedes contactarnos a través de:\n\n• Visita nuestra página /contact\n• Email: disponible en la sección de contacto\n• También puedes solicitar una demo personalizada\n\n¿Prefieres que te contactemos nosotros?`;
  }
  
  // Default response
  return `Gracias por tu pregunta. Puedo ayudarte con información sobre:\n\n• 💰 **Precios** - Licenciamiento y costes\n• ✨ **Funcionalidades** - Qué puede hacer ObelixIA\n• 🛡️ **Compliance** - Normativas y regulaciones\n• 🏢 **Sectores** - Industrias soportadas\n• ☁️ **Despliegue** - Cloud, On-Premise, Hybrid\n• 🤖 **IA** - Capacidades de inteligencia artificial\n• 🔒 **Seguridad** - Medidas de protección\n\n¿Sobre qué tema te gustaría saber más?`;
}

export function ObelixiaChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Hola! 👋 Soy el asistente virtual de ObelixIA. Pregúntame lo que quieras sobre nuestra plataforma de CRM bancario inteligente.',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    const response = generateResponse(userMessage.content);
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-14 h-14 rounded-full shadow-lg transition-all duration-300",
            "bg-gradient-to-br from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400",
            "border-2 border-white/20",
            isOpen && "rotate-90"
          )}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                className="relative"
              >
                <Bot className="w-6 h-6 text-white" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)]"
          >
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-emerald-600 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Asistente ObelixIA</h3>
                    <p className="text-xs text-white/80">Siempre disponible para ayudarte</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="h-[350px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2",
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === 'user' 
                          ? 'bg-cyan-500/20' 
                          : 'bg-gradient-to-br from-cyan-500 to-emerald-500'
                      )}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                        message.role === 'user'
                          ? 'bg-cyan-500/20 text-white rounded-tr-sm'
                          : 'bg-white/10 text-gray-100 rounded-tl-sm'
                      )}>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribe tu pregunta..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-cyan-500"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}