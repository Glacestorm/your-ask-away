import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Building2, Calendar, Clock, Send, Linkedin, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface DemoRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoRequestModal: React.FC<DemoRequestModalProps> = ({ isOpen, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    // Disponibilidad - 3 opciones
    date1: '',
    time1: '',
    date2: '',
    time2: '',
    date3: '',
    time3: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success('Solicitud de demo enviada correctamente');

    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        date1: '',
        time1: '',
        date2: '',
        time2: '',
        date3: '',
        time3: '',
        message: ''
      });
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-slate-900/95 backdrop-blur border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Crimson Pro, serif' }}>
                Solicitar Demo Personalizada
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
              {/* Co-founder Info */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Crimson Pro, serif' }}>
                    Tu contacto directo
                  </h3>
                  
                  <div className="flex items-start gap-4">
                    {/* Avatar placeholder */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      JF
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">Jaime Fernández García</h4>
                      <p className="text-emerald-400 font-medium">Co-fundador & Representante Comercial</p>
                      <p className="text-slate-400 text-sm">ObelixIA Technologies</p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-slate-300">
                      <Mail className="w-4 h-4 text-emerald-400" />
                      <span>jfernandez@obelixia.com</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>+34 606 770 033</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Linkedin className="w-4 h-4 text-emerald-400" />
                      <a 
                        href="https://linkedin.com/in/jaimefernandez" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-emerald-400 transition-colors"
                      >
                        linkedin.com/in/jaimefernandez
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <span>Andorra la Vella, Andorra</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-900/50 rounded-lg border border-slate-600/30">
                    <p className="text-slate-400 text-sm italic">
                      "Estaré encantado de mostrarte cómo ObelixIA puede transformar la gestión de tu empresa. 
                      Agenda una demo personalizada y descubre todo el potencial de nuestra plataforma."
                    </p>
                  </div>
                </div>

                {/* What to expect */}
                <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700/50">
                  <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Crimson Pro, serif' }}>
                    ¿Qué incluye la demo?
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Presentación personalizada de 45-60 minutos',
                      'Análisis de tus necesidades específicas',
                      'Demostración de módulos relevantes para tu sector',
                      'Q&A y resolución de dudas',
                      'Propuesta de implementación y pricing'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Form */}
              <div>
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">¡Solicitud enviada!</h3>
                    <p className="text-slate-400">
                      Jaime se pondrá en contacto contigo en las próximas 24 horas.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4" style={{ fontFamily: 'Crimson Pro, serif' }}>
                      Tus datos de contacto
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-slate-300">Nombre completo *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                            placeholder="Tu nombre"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                            placeholder="tu@email.com"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-300">Teléfono *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                            placeholder="+34 XXX XXX XXX"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-slate-300">Empresa *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <Input
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                            placeholder="Nombre de tu empresa"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-slate-300">Cargo</Label>
                      <Input
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Tu cargo en la empresa"
                      />
                    </div>

                    {/* Disponibilidad */}
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                      <h4 className="text-white font-semibold" style={{ fontFamily: 'Crimson Pro, serif' }}>
                        Disponibilidad para la demo (indica 2-3 opciones) *
                      </h4>
                      
                      {[1, 2, 3].map((num) => (
                        <div key={num} className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-xs">Opción {num} - Fecha</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                type="date"
                                name={`date${num}`}
                                value={formData[`date${num}` as keyof typeof formData]}
                                onChange={handleChange}
                                required={num <= 2}
                                className="pl-10 bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-xs">Hora preferida</Label>
                            <div className="relative">
                              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                              <Input
                                type="time"
                                name={`time${num}`}
                                value={formData[`time${num}` as keyof typeof formData]}
                                onChange={handleChange}
                                required={num <= 2}
                                className="pl-10 bg-slate-800 border-slate-700 text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-slate-300">Mensaje adicional</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        className="bg-slate-800 border-slate-700 text-white min-h-[80px]"
                        placeholder="¿Hay algo específico que te gustaría ver en la demo?"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-400 hover:via-cyan-400 hover:to-emerald-400 text-white py-6 text-lg font-semibold rounded-xl shadow-lg shadow-cyan-500/25"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          Enviando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-5 h-5" />
                          Solicitar Demo
                        </span>
                      )}
                    </Button>

                    <p className="text-xs text-slate-500 text-center">
                      Al enviar aceptas nuestra política de privacidad. Tus datos serán tratados conforme al RGPD.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DemoRequestModal;
