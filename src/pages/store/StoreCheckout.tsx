import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, Lock, Shield, CheckCircle, 
  Building2, Mail, Phone, MapPin, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import StoreNavbar from '@/components/store/StoreNavbar';
import CartSidebar from '@/components/store/CartSidebar';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const StoreCheckout: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discount, tax, total, clearCart, promoCode } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    email: '',
    phone: '',
    country: 'ES',
    billingAddress: '',
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.companyName || !formData.taxId || !formData.email) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor, completa todos los campos obligatorios',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.acceptTerms || !formData.acceptPrivacy) {
      toast({
        title: 'Términos requeridos',
        description: 'Debes aceptar los términos y condiciones',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Añade productos antes de continuar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-store-checkout', {
        body: {
          items: items.map(item => ({
            moduleKey: item.moduleKey,
            moduleName: item.moduleName,
            price: item.price,
            quantity: item.quantity,
            licenseType: item.licenseType,
          })),
          customer: {
            companyName: formData.companyName,
            taxId: formData.taxId,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
            billingAddress: formData.billingAddress,
          },
          promoCode,
          subtotal,
          discount,
          tax,
          total,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error en el pago',
        description: error.message || 'No se pudo procesar el pago',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950">
        <StoreNavbar />
        <div className="container mx-auto px-4 pt-32 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Tu carrito está vacío</h1>
          <p className="text-slate-400 mb-8">Añade módulos antes de continuar con la compra</p>
          <Link to="/store/modules">
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              Explorar Módulos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <StoreNavbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <Link to="/store" className="inline-flex items-center text-slate-400 hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a la tienda
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8"
            >
              <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-emerald-400" />
                Finalizar Compra
              </h1>

              <div className="space-y-6">
                {/* Company Info */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                    Datos de la Empresa
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Nombre de la Empresa *</Label>
                      <Input
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-1"
                        placeholder="Empresa S.L."
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">CIF/NIF *</Label>
                      <Input
                        value={formData.taxId}
                        onChange={(e) => handleInputChange('taxId', e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-1"
                        placeholder="B12345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-emerald-400" />
                    Contacto
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-1"
                        placeholder="contacto@empresa.com"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Teléfono</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-1"
                        placeholder="+34 612 345 678"
                      />
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    Facturación
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300">País</Label>
                      <Select value={formData.country} onValueChange={(v) => handleInputChange('country', v)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ES">España</SelectItem>
                          <SelectItem value="AD">Andorra</SelectItem>
                          <SelectItem value="FR">Francia</SelectItem>
                          <SelectItem value="PT">Portugal</SelectItem>
                          <SelectItem value="DE">Alemania</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-300">Dirección de Facturación</Label>
                      <Input
                        value={formData.billingAddress}
                        onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                        className="bg-slate-700 border-slate-600 mt-1"
                        placeholder="Calle, número, ciudad, CP"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(v) => handleInputChange('acceptTerms', v as boolean)}
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-300 cursor-pointer">
                      Acepto los <Link to="/terms" className="text-emerald-400 hover:underline">Términos y Condiciones</Link> *
                    </Label>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="privacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(v) => handleInputChange('acceptPrivacy', v as boolean)}
                    />
                    <Label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer">
                      Acepto la <Link to="/privacy" className="text-emerald-400 hover:underline">Política de Privacidad</Link> *
                    </Label>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 sticky top-24"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Resumen del Pedido</h2>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-300">
                      {item.moduleName}
                      <Badge className="ml-2 text-xs bg-slate-700">{item.licenseType}</Badge>
                    </span>
                    <span className="text-white">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Descuento</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">IVA (21%)</span>
                  <span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-slate-700">
                  <span className="text-white">Total</span>
                  <span className="text-emerald-400">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6"
              >
                {loading ? (
                  'Procesando...'
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Pagar {formatPrice(total)}
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Shield className="w-4 h-4" />
                Pago seguro con Stripe
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <CartSidebar />
    </div>
  );
};

export default StoreCheckout;
