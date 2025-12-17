import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, Building2, Briefcase, MapPin, Lock, Eye, EyeOff, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StoreAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
}

const countries = [
  'España', 'Andorra', 'Francia', 'Portugal', 'Italia', 'Alemania', 
  'Reino Unido', 'México', 'Argentina', 'Colombia', 'Chile', 'Perú', 'Otro'
];

const companySizes = [
  '1-10 empleados', '11-50 empleados', '51-200 empleados', 
  '201-500 empleados', '501-1000 empleados', 'Más de 1000 empleados'
];

const sectors = [
  'Banca y Finanzas', 'Seguros', 'Retail', 'Industria', 'Tecnología',
  'Salud', 'Educación', 'Construcción', 'Logística', 'Servicios Profesionales', 'Otro'
];

export const StoreAuthModal: React.FC<StoreAuthModalProps> = ({ isOpen, onClose, initialMode }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    companySize: '',
    sector: '',
    country: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    acceptMarketing: false,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "¡Bienvenido!",
        description: "Has iniciado sesión correctamente.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (!registerData.acceptTerms) {
      toast({
        title: "Error",
        description: "Debes aceptar los términos y condiciones",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/store`,
          data: {
            first_name: registerData.firstName,
            last_name: registerData.lastName,
            phone: registerData.phone,
            company: registerData.company,
            position: registerData.position,
            company_size: registerData.companySize,
            sector: registerData.sector,
            country: registerData.country,
            accept_marketing: registerData.acceptMarketing,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada. Revisa tu email para confirmar.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error al registrarse",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl border border-slate-700/50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm p-6 border-b border-slate-800 z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Crimson Pro, serif' }}>
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="text-slate-400 mt-1">
              {mode === 'login' 
                ? 'Accede a tu cuenta de ObelixIA Store' 
                : 'Regístrate para explorar nuestros módulos'}
            </p>

            {/* Mode Toggle */}
            <div className="flex mt-4 bg-slate-800/50 rounded-xl p-1">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'login' 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  mode === 'register' 
                    ? 'bg-emerald-500 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: 'Crimson Pro, serif' }}
              >
                Registrarse
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Contraseña</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 shadow-lg"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Personal Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-slate-300">Nombre *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        required
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                        placeholder="Juan"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-300">Apellidos *</Label>
                    <Input
                      required
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      className="mt-1 bg-slate-800/50 border-slate-700 text-white text-sm"
                      placeholder="García López"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Email corporativo *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="email"
                      required
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                      placeholder="juan.garcia@empresa.com"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300">Teléfono *</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      type="tel"
                      required
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                {/* Company Info */}
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-3">Información de la empresa</p>
                  
                  <div>
                    <Label className="text-slate-300">Empresa *</Label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        required
                        value={registerData.company}
                        onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                        className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-slate-300">Cargo *</Label>
                    <div className="relative mt-1">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <Input
                        required
                        value={registerData.position}
                        onChange={(e) => setRegisterData({ ...registerData, position: e.target.value })}
                        className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                        placeholder="Director de IT"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label className="text-slate-300">Tamaño empresa</Label>
                      <Select
                        value={registerData.companySize}
                        onValueChange={(value) => setRegisterData({ ...registerData, companySize: value })}
                      >
                        <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700 text-white text-sm">
                          <Users className="w-4 h-4 mr-2 text-slate-500" />
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>{size}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Sector</Label>
                      <Select
                        value={registerData.sector}
                        onValueChange={(value) => setRegisterData({ ...registerData, sector: value })}
                      >
                        <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700 text-white text-sm">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {sectors.map((sector) => (
                            <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Label className="text-slate-300">País *</Label>
                    <Select
                      value={registerData.country}
                      onValueChange={(value) => setRegisterData({ ...registerData, country: value })}
                    >
                      <SelectTrigger className="mt-1 bg-slate-800/50 border-slate-700 text-white text-sm">
                        <Globe className="w-4 h-4 mr-2 text-slate-500" />
                        <SelectValue placeholder="Selecciona tu país" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Password */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-slate-300">Contraseña *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={8}
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="pl-9 bg-slate-800/50 border-slate-700 text-white text-sm"
                          placeholder="Mín. 8 caracteres"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-slate-300">Confirmar *</Label>
                      <div className="relative mt-1">
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          className="bg-slate-800/50 border-slate-700 text-white text-sm"
                          placeholder="Repetir contraseña"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={registerData.acceptTerms}
                      onCheckedChange={(checked) => setRegisterData({ ...registerData, acceptTerms: checked as boolean })}
                      className="mt-0.5"
                    />
                    <label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer">
                      Acepto los <span className="text-emerald-400 hover:underline">términos y condiciones</span> y la <span className="text-emerald-400 hover:underline">política de privacidad</span> *
                    </label>
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="marketing"
                      checked={registerData.acceptMarketing}
                      onCheckedChange={(checked) => setRegisterData({ ...registerData, acceptMarketing: checked as boolean })}
                      className="mt-0.5"
                    />
                    <label htmlFor="marketing" className="text-xs text-slate-400 cursor-pointer">
                      Deseo recibir información sobre productos, ofertas y novedades de ObelixIA
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 shadow-lg mt-4"
                  style={{ fontFamily: 'Crimson Pro, serif' }}
                >
                  {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoreAuthModal;
