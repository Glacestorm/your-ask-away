import React from 'react';
import { DashboardLayout } from '@/layouts';
import { SentimentAnalysisDashboard } from '@/components/crm/sentiment';

const demoSentimentData = [
  {
    id: '1',
    sourceType: 'message' as const,
    sourceId: 'msg1',
    content: 'Estoy muy satisfecho con el servicio, la atención fue excelente.',
    sentiment: 'positive' as const,
    sentimentScore: 0.85,
    emotions: [{ emotion: 'satisfacción', intensity: 0.9 }, { emotion: 'gratitud', intensity: 0.7 }],
    keyPhrases: ['muy satisfecho', 'servicio excelente', 'atención'],
    topics: ['Servicio al cliente', 'Satisfacción'],
    actionRequired: false,
    analyzedAt: new Date().toISOString(),
    companyName: 'Acme Corp'
  },
  {
    id: '2',
    sourceType: 'survey' as const,
    sourceId: 'srv1',
    content: 'El producto llegó tarde y en mal estado. Muy decepcionado.',
    sentiment: 'negative' as const,
    sentimentScore: -0.75,
    emotions: [{ emotion: 'frustración', intensity: 0.8 }, { emotion: 'decepción', intensity: 0.9 }],
    keyPhrases: ['llegó tarde', 'mal estado', 'decepcionado'],
    topics: ['Envío', 'Calidad', 'Logística'],
    actionRequired: true,
    suggestedAction: 'Contactar al cliente para ofrecer reemplazo y disculpas',
    analyzedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    companyName: 'TechStart'
  },
  {
    id: '3',
    sourceType: 'call_transcript' as const,
    sourceId: 'call1',
    content: 'La llamada fue informativa, aunque tuve que esperar bastante.',
    sentiment: 'neutral' as const,
    sentimentScore: 0.1,
    emotions: [{ emotion: 'neutralidad', intensity: 0.6 }, { emotion: 'impaciencia', intensity: 0.4 }],
    keyPhrases: ['informativa', 'esperar bastante'],
    topics: ['Soporte telefónico', 'Tiempo de espera'],
    actionRequired: false,
    analyzedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    sourceType: 'visit_note' as const,
    sourceId: 'visit1',
    content: '¡Increíble demostración! El equipo quedó impresionado con las funcionalidades.',
    sentiment: 'positive' as const,
    sentimentScore: 0.92,
    emotions: [{ emotion: 'entusiasmo', intensity: 0.95 }, { emotion: 'interés', intensity: 0.85 }],
    keyPhrases: ['increíble demostración', 'impresionado', 'funcionalidades'],
    topics: ['Demo', 'Producto', 'Ventas'],
    actionRequired: false,
    analyzedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    companyName: 'Global Industries'
  },
  {
    id: '5',
    sourceType: 'message' as const,
    sourceId: 'msg2',
    content: 'No me respondieron en más de 3 días. Inaceptable.',
    sentiment: 'negative' as const,
    sentimentScore: -0.88,
    emotions: [{ emotion: 'enojo', intensity: 0.85 }, { emotion: 'frustración', intensity: 0.9 }],
    keyPhrases: ['no respondieron', '3 días', 'inaceptable'],
    topics: ['Tiempo de respuesta', 'Servicio'],
    actionRequired: true,
    suggestedAction: 'Escalar a supervisor y contactar inmediatamente',
    analyzedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

const demoTrends = [
  { date: 'Lun', positive: 65, neutral: 25, negative: 10, avgScore: 45 },
  { date: 'Mar', positive: 55, neutral: 30, negative: 15, avgScore: 35 },
  { date: 'Mié', positive: 70, neutral: 20, negative: 10, avgScore: 55 },
  { date: 'Jue', positive: 60, neutral: 25, negative: 15, avgScore: 40 },
  { date: 'Vie', positive: 75, neutral: 18, negative: 7, avgScore: 62 },
  { date: 'Sáb', positive: 80, neutral: 15, negative: 5, avgScore: 70 },
  { date: 'Dom', positive: 72, neutral: 20, negative: 8, avgScore: 58 },
];

const SentimentPage = () => {
  return (
    <DashboardLayout title="Análisis de Sentimiento">
      <div className="p-6">
        <SentimentAnalysisDashboard 
          sentimentData={demoSentimentData}
          trends={demoTrends}
        />
      </div>
    </DashboardLayout>
  );
};

export default SentimentPage;
