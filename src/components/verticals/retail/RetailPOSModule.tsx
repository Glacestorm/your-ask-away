import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Receipt, CreditCard, Calculator, WifiOff, 
  Plus, Minus, Trash2, Search, ShoppingCart, Euro, Coffee, UtensilsCrossed, Percent
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export const RetailPOSModule: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');

  const demoProducts = [
    { id: '1', name: 'Café Solo', price: 1.50, category: 'Bebidas', icon: Coffee },
    { id: '2', name: 'Café con Leche', price: 1.80, category: 'Bebidas', icon: Coffee },
    { id: '3', name: 'Tostada', price: 2.50, category: 'Comida', icon: UtensilsCrossed },
    { id: '4', name: 'Croissant', price: 1.90, category: 'Comida', icon: UtensilsCrossed },
    { id: '5', name: 'Zumo Naranja', price: 3.00, category: 'Bebidas', icon: Coffee },
    { id: '6', name: 'Bocadillo Jamón', price: 4.50, category: 'Comida', icon: UtensilsCrossed },
  ];

  const addToCart = (product: typeof demoProducts[0]) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = total * 0.21;
  const totalWithTax = total + tax;

  const filteredProducts = demoProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Punto de Venta</h2>
            <p className="text-muted-foreground">Sistema TPV completo</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
          <WifiOff className="h-3 w-3" />
          Modo Offline Disponible
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Products Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  <TabsTrigger value="bebidas">Bebidas</TabsTrigger>
                  <TabsTrigger value="comida">Comida</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredProducts.map((product) => {
                      const ProductIcon = product.icon;
                      return (
                        <motion.div key={product.id} variants={itemVariants}>
                          <Card
                            className="cursor-pointer hover:border-amber-500/50 transition-all group"
                            onClick={() => addToCart(product)}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors">
                                <ProductIcon className="h-6 w-6 text-amber-500" />
                              </div>
                              <p className="font-medium text-sm">{product.name}</p>
                              <p className="text-lg font-bold text-amber-500">{product.price.toFixed(2)} €</p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </TabsContent>
                <TabsContent value="bebidas">
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredProducts
                      .filter(p => p.category === 'Bebidas')
                      .map((product) => {
                        const ProductIcon = product.icon;
                        return (
                          <motion.div key={product.id} variants={itemVariants}>
                            <Card
                              className="cursor-pointer hover:border-amber-500/50 transition-all group"
                              onClick={() => addToCart(product)}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors">
                                  <ProductIcon className="h-6 w-6 text-amber-500" />
                                </div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-lg font-bold text-amber-500">{product.price.toFixed(2)} €</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                </TabsContent>
                <TabsContent value="comida">
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredProducts
                      .filter(p => p.category === 'Comida')
                      .map((product) => {
                        const ProductIcon = product.icon;
                        return (
                          <motion.div key={product.id} variants={itemVariants}>
                            <Card
                              className="cursor-pointer hover:border-amber-500/50 transition-all group"
                              onClick={() => addToCart(product)}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-colors">
                                  <ProductIcon className="h-6 w-6 text-amber-500" />
                                </div>
                                <p className="font-medium text-sm">{product.name}</p>
                                <p className="text-lg font-bold text-amber-500">{product.price.toFixed(2)} €</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart Panel */}
        <Card className="h-fit border-amber-500/20">
          <CardHeader className="pb-3 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Receipt className="h-4 w-4 text-white" />
              </div>
              Ticket Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-64">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Carrito vacío</p>
                  <p className="text-xs text-muted-foreground">Añade productos para empezar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-xl hover:bg-muted transition-all"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.price.toFixed(2)} € x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:bg-amber-500/20"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 hover:bg-amber-500/20"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:bg-destructive/20"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Percent className="h-3 w-3" />
                  IVA (21%)
                </span>
                <span>{tax.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-2 border-t">
                <span>Total</span>
                <span className="text-amber-500">{totalWithTax.toFixed(2)} €</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'cash', label: 'Efectivo', icon: Euro },
                  { key: 'card', label: 'Tarjeta', icon: CreditCard },
                  { key: 'mixed', label: 'Mixto', icon: Calculator },
                ].map((method) => (
                  <Button
                    key={method.key}
                    variant={paymentMethod === method.key ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaymentMethod(method.key as 'cash' | 'card' | 'mixed')}
                    className={`gap-1 ${paymentMethod === method.key ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  >
                    <method.icon className="h-3 w-3" />
                    {method.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25" 
              size="lg" 
              disabled={cart.length === 0}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Cobrar {totalWithTax.toFixed(2)} €
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
