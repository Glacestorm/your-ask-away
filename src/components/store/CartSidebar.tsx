import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCart, CartItem } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

const CartSidebar: React.FC = () => {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    updateLicenseType,
    clearCart,
    subtotal, 
    discount, 
    tax, 
    total, 
    promoCode,
    applyPromoCode,
    isCartOpen, 
    setIsCartOpen 
  } = useCart();
  
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const { toast } = useToast();

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplyingPromo(true);
    
    const success = await applyPromoCode(promoInput.trim());
    
    if (success) {
      toast({
        title: 'Código aplicado',
        description: 'El descuento se ha aplicado correctamente',
      });
      setPromoInput('');
    } else {
      toast({
        title: 'Código inválido',
        description: 'El código promocional no es válido',
        variant: 'destructive',
      });
    }
    
    setApplyingPromo(false);
  };

  const getItemPrice = (item: CartItem) => {
    let price = item.price;
    if (item.licenseType === 'perpetual') {
      price = price * 5;
    } else if (item.licenseType === 'monthly') {
      price = price / 10;
    }
    return price * item.quantity;
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setIsCartOpen(false)}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-semibold text-white">Tu Carrito</h2>
                  <Badge className="bg-emerald-500/20 text-emerald-300">{items.length}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-4">Tu carrito está vacío</p>
                  <Link to="/store/modules">
                    <Button 
                      variant="outline"
                      onClick={() => setIsCartOpen(false)}
                      className="border-emerald-500/50 text-emerald-300"
                    >
                      Explorar Módulos
                    </Button>
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className={`p-4 rounded-xl border ${
                      item.isPremium 
                        ? 'bg-amber-950/30 border-amber-500/30' 
                        : 'bg-slate-800/50 border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-white">{item.moduleName}</h3>
                        {item.isPremium && (
                          <Badge className="mt-1 bg-amber-500/20 text-amber-300 text-xs">Premium</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.moduleKey)}
                        className="text-slate-400 hover:text-red-400 -mr-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* License Type */}
                    <div className="mb-3">
                      <Select
                        value={item.licenseType}
                        onValueChange={(value: CartItem['licenseType']) => 
                          updateLicenseType(item.moduleKey, value)
                        }
                      >
                        <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                          <SelectItem value="perpetual">Perpetua (5x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 border-slate-600"
                          onClick={() => updateQuantity(item.moduleKey, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center text-white">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-8 h-8 border-slate-600"
                          onClick={() => updateQuantity(item.moduleKey, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="text-lg font-semibold text-white">
                        {formatPrice(getItemPrice(item))}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-900/95">
                {/* Promo Code */}
                {!promoCode && (
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Código promocional"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="bg-slate-800 border-slate-700"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={applyingPromo}
                      className="border-emerald-500/50 text-emerald-300"
                    >
                      <Tag className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {promoCode && (
                  <div className="flex items-center justify-between mb-4 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <span className="text-sm text-emerald-300">
                      <Tag className="w-4 h-4 inline mr-2" />
                      {promoCode}
                    </span>
                    <Badge className="bg-emerald-500/20 text-emerald-300">Aplicado</Badge>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal (SIN IVA)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400">
                      <span>Descuento</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>IVA (21%)</span>
                    <span>+{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-slate-700">
                    <span>Total (IVA incl.)</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center">
                    Empresas con NIF-IVA intracomunitario pueden aplicar inversión del sujeto pasivo
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Link to="/store/checkout" onClick={() => setIsCartOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6">
                      Finalizar Compra
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full text-slate-400 hover:text-white"
                    onClick={clearCart}
                  >
                    Vaciar carrito
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartSidebar;
