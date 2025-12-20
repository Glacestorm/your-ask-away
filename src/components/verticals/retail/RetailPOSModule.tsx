import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Receipt, CreditCard, Calculator, WifiOff, 
  Plus, Minus, Trash2, Search, ShoppingCart, Euro
} from 'lucide-react';

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
    { id: '1', name: 'Café Solo', price: 1.50, category: 'Bebidas' },
    { id: '2', name: 'Café con Leche', price: 1.80, category: 'Bebidas' },
    { id: '3', name: 'Tostada', price: 2.50, category: 'Comida' },
    { id: '4', name: 'Croissant', price: 1.90, category: 'Comida' },
    { id: '5', name: 'Zumo Naranja', price: 3.00, category: 'Bebidas' },
    { id: '6', name: 'Bocadillo Jamón', price: 4.50, category: 'Comida' },
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Punto de Venta</h2>
          <p className="text-muted-foreground">Sistema TPV completo</p>
        </div>
        <Badge variant="outline" className="gap-1">
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
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => addToCart(product)}
                      >
                        <CardContent className="p-4 text-center">
                          <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} €</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="bebidas">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts
                      .filter(p => p.category === 'Bebidas')
                      .map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4 text-center">
                            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} €</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="comida">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredProducts
                      .filter(p => p.category === 'Comida')
                      .map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => addToCart(product)}
                        >
                          <CardContent className="p-4 text-center">
                            <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-lg font-bold text-primary">{product.price.toFixed(2)} €</p>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Cart Panel */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Ticket Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-64">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Carrito vacío
                </p>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
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
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{total.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>IVA (21%)</span>
                <span>{tax.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{totalWithTax.toFixed(2)} €</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Método de pago</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('cash')}
                  className="gap-1"
                >
                  <Euro className="h-3 w-3" />
                  Efectivo
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('card')}
                  className="gap-1"
                >
                  <CreditCard className="h-3 w-3" />
                  Tarjeta
                </Button>
                <Button
                  variant={paymentMethod === 'mixed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('mixed')}
                  className="gap-1"
                >
                  <Calculator className="h-3 w-3" />
                  Mixto
                </Button>
              </div>
            </div>

            <Button className="w-full" size="lg" disabled={cart.length === 0}>
              <Receipt className="h-4 w-4 mr-2" />
              Cobrar {totalWithTax.toFixed(2)} €
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
