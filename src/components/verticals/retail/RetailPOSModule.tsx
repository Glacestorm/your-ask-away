import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Receipt, CreditCard, Calculator, WifiOff, 
  Plus, Minus, Trash2, Search, ShoppingCart, Euro, Coffee, UtensilsCrossed, Percent,
  ArrowUpRight, TrendingUp, Users, Clock, Banknote, QrCode
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { motion } from 'framer-motion';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const salesByHour = [
  { hour: '08:00', ventas: 45 },
  { hour: '09:00', ventas: 120 },
  { hour: '10:00', ventas: 185 },
  { hour: '11:00', ventas: 210 },
  { hour: '12:00', ventas: 280 },
  { hour: '13:00', ventas: 320 },
  { hour: '14:00', ventas: 190 },
  { hour: '15:00', ventas: 95 },
  { hour: '16:00', ventas: 150 },
  { hour: '17:00', ventas: 220 },
  { hour: '18:00', ventas: 175 },
  { hour: '19:00', ventas: 110 },
];

const paymentMethods = [
  { name: 'Tarjeta', value: 55, color: '#3b82f6' },
  { name: 'Efectivo', value: 30, color: '#10b981' },
  { name: 'Bizum', value: 10, color: '#8b5cf6' },
  { name: 'Otros', value: 5, color: '#f59e0b' },
];

const categoryPerformance = [
  { category: 'Bebidas', ventas: 450, items: 312 },
  { category: 'Comida', ventas: 680, items: 198 },
  { category: 'Extras', ventas: 120, items: 87 },
];

export const RetailPOSModule: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mixed'>('cash');
  const [activeTab, setActiveTab] = useState('pos');

  const demoProducts = [
    { id: '1', name: 'Café Solo', price: 1.50, category: 'Bebidas', icon: Coffee },
    { id: '2', name: 'Café con Leche', price: 1.80, category: 'Bebidas', icon: Coffee },
    { id: '3', name: 'Tostada', price: 2.50, category: 'Comida', icon: UtensilsCrossed },
    { id: '4', name: 'Croissant', price: 1.90, category: 'Comida', icon: UtensilsCrossed },
    { id: '5', name: 'Zumo Naranja', price: 3.00, category: 'Bebidas', icon: Coffee },
    { id: '6', name: 'Bocadillo Jamón', price: 4.50, category: 'Comida', icon: UtensilsCrossed },
    { id: '7', name: 'Napolitana', price: 2.20, category: 'Comida', icon: UtensilsCrossed },
    { id: '8', name: 'Cortado', price: 1.40, category: 'Bebidas', icon: Coffee },
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
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

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

  const todayStats = {
    ventas: 1250.80,
    tickets: 47,
    ticketMedio: 26.61,
    clientes: 52
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pos">TPV</TabsTrigger>
          <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
          <TabsTrigger value="caja">Caja</TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="mt-4">
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
                    <Button variant="outline" size="icon">
                      <QrCode className="h-4 w-4" />
                    </Button>
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
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredProducts.map((product) => {
                          const ProductIcon = product.icon;
                          const inCart = cart.find(i => i.id === product.id);
                          return (
                            <motion.div key={product.id} variants={itemVariants}>
                              <Card
                                className={`cursor-pointer hover:border-amber-500/50 transition-all group relative ${inCart ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                                onClick={() => addToCart(product)}
                              >
                                {inCart && (
                                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                    {inCart.quantity}
                                  </div>
                                )}
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
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredProducts
                          .filter(p => p.category === 'Bebidas')
                          .map((product) => {
                            const ProductIcon = product.icon;
                            const inCart = cart.find(i => i.id === product.id);
                            return (
                              <motion.div key={product.id} variants={itemVariants}>
                                <Card
                                  className={`cursor-pointer hover:border-amber-500/50 transition-all group relative ${inCart ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                                  onClick={() => addToCart(product)}
                                >
                                  {inCart && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                      {inCart.quantity}
                                    </div>
                                  )}
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
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {filteredProducts
                          .filter(p => p.category === 'Comida')
                          .map((product) => {
                            const ProductIcon = product.icon;
                            const inCart = cart.find(i => i.id === product.id);
                            return (
                              <motion.div key={product.id} variants={itemVariants}>
                                <Card
                                  className={`cursor-pointer hover:border-amber-500/50 transition-all group relative ${inCart ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                                  onClick={() => addToCart(product)}
                                >
                                  {inCart && (
                                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                      {inCart.quantity}
                                    </div>
                                  )}
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <Receipt className="h-4 w-4 text-white" />
                    </div>
                    Ticket Actual
                  </div>
                  {totalItems > 0 && (
                    <Badge className="bg-amber-500 text-white">{totalItems} items</Badge>
                  )}
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
                      { key: 'cash', label: 'Efectivo', icon: Banknote },
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
        </TabsContent>

        <TabsContent value="estadisticas" className="space-y-4 mt-4">
          {/* Today Stats */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ventas Hoy</p>
                      <p className="text-3xl font-bold">{todayStats.ventas.toFixed(2)}€</p>
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500">+18% vs ayer</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                      <Euro className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tickets</p>
                      <p className="text-3xl font-bold">{todayStats.tickets}</p>
                      <span className="text-xs text-muted-foreground">Hoy</span>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <Receipt className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Medio</p>
                      <p className="text-3xl font-bold">{todayStats.ticketMedio.toFixed(2)}€</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500">+5%</span>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                      <p className="text-3xl font-bold">{todayStats.clientes}</p>
                      <span className="text-xs text-muted-foreground">Atendidos hoy</span>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Ventas por Hora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={salesByHour}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => `${value}€`} />
                    <Area type="monotone" dataKey="ventas" stroke="#f59e0b" fill="url(#salesGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-amber-500" />
                  Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="50%" height={180}>
                    <PieChart>
                      <Pie data={paymentMethods} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                        {paymentMethods.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {paymentMethods.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-500" />
                Rendimiento por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPerformance.map((cat, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 font-medium">{cat.category}</div>
                    <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${(cat.ventas / 680) * 100}%` }}
                      />
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="font-medium">{cat.ventas}€</p>
                      <p className="text-xs text-muted-foreground">{cat.items} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caja" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-500" />
                Resumen de Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">Apertura</p>
                    <p className="text-2xl font-bold">100.00€</p>
                    <p className="text-xs text-muted-foreground">08:00</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">Entradas Efectivo</p>
                    <p className="text-2xl font-bold text-emerald-500">+375.40€</p>
                    <p className="text-xs text-muted-foreground">14 operaciones</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">Total en Caja</p>
                    <p className="text-2xl font-bold text-amber-500">475.40€</p>
                    <p className="text-xs text-muted-foreground">Esperado: 475.40€</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Calculator className="h-4 w-4 mr-2" />
                  Realizar Arqueo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
