import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Send, Linkedin, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import UnifiedFooter from '@/components/layout/UnifiedFooter';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.');
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      subject: '',
      message: ''
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/50 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Link to="/store">
            <Button variant="ghost" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la tienda
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Contacta con Nosotros</h1>
          <p className="text-xl text-slate-400">
            Estamos aquí para ayudarte. Cuéntanos en qué podemos asistirte.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Información de contacto */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-xl font-semibold text-white mb-6">Información de Contacto</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Mail className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Email</p>
                      <a href="mailto:jfernandez@obelixia.com" className="text-white hover:text-emerald-400">
                        jfernandez@obelixia.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Phone className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Teléfono</p>
                      <a href="tel:+34606770033" className="text-white hover:text-emerald-400">
                        +34 606 770 033
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Ubicación</p>
                      <p className="text-white">León, España</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Clock className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Horario</p>
                      <p className="text-white">Lun - Vie: 9:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                <h2 className="text-xl font-semibold text-white mb-4">Síguenos</h2>
                <div className="flex gap-4">
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                     className="p-3 bg-slate-800 rounded-lg hover:bg-emerald-500/20 transition-colors">
                    <Linkedin className="w-5 h-5 text-slate-400 hover:text-emerald-400" />
                  </a>
                </div>
              </div>

              <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">¿Prefieres una demo?</h3>
                </div>
                <p className="text-sm text-slate-400 mb-4">
                  Agenda una demostración personalizada de ObelixIA con nuestro equipo.
                </p>
                <Link to="/store">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    Solicitar Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Formulario */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-800">
                <h2 className="text-xl font-semibold text-white mb-6">Envíanos un mensaje</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Nombre completo *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="tu@email.com"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-slate-300">Empresa</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-300">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-slate-800 border-slate-700 text-white"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-slate-300">Asunto *</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(value) => setFormData({ ...formData, subject: value })}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Selecciona un asunto" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Información general</SelectItem>
                        <SelectItem value="demo">Solicitar demostración</SelectItem>
                        <SelectItem value="pricing">Precios y licencias</SelectItem>
                        <SelectItem value="support">Soporte técnico</SelectItem>
                        <SelectItem value="partnership">Colaboraciones</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-slate-300">Mensaje *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={5}
                      className="bg-slate-800 border-slate-700 text-white resize-none"
                      placeholder="¿En qué podemos ayudarte?"
                    />
                  </div>

                  <p className="text-xs text-slate-500">
                    Al enviar este formulario, aceptas nuestra{' '}
                    <Link to="/privacy" className="text-emerald-400 hover:underline">Política de Privacidad</Link>.
                  </p>

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar mensaje
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <UnifiedFooter />
    </div>
  );
};

export default Contact;
