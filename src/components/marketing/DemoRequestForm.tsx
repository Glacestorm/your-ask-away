import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { toast } from 'sonner';

interface DemoRequestFormProps {
  onSuccess?: () => void;
}

export const DemoRequestForm: React.FC<DemoRequestFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackDemoRequest } = useMarketingAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await trackDemoRequest(form);
      toast.success('¡Solicitud enviada! Te contactaremos pronto.');
      setForm({ name: '', email: '', company: '', message: '' });
      onSuccess?.();
    } catch (error) {
      toast.error('Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    "Demo personalizada de 30 minutos",
    "Análisis de tu caso de uso específico",
    "Propuesta de implementación sin compromiso",
    "Acceso temporal a la plataforma",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid md:grid-cols-2 gap-8"
    >
      {/* Benefits */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Play className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Solicitar Demo</h3>
            <p className="text-sm text-slate-400">Sin compromiso</p>
          </div>
        </div>

        <p className="text-slate-400">
          Descubre cómo Obelixia puede transformar tu gestión financiera con una 
          demostración personalizada adaptada a tu sector.
        </p>

        <ul className="space-y-3">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Nombre completo"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Input
          type="email"
          placeholder="Email corporativo"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Input
          placeholder="Empresa"
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          required
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Textarea
          placeholder="¿Qué te gustaría ver en la demo?"
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={3}
          className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {isSubmitting ? (
            <>Enviando...</>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Solicitar Demo Gratuita
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default DemoRequestForm;
