import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSubscription, SUBSCRIPTION_TIERS } from '@/hooks/useSubscription';
import { useEffect } from 'react';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { tier, subscribed, checkSubscription } = useSubscription();

  // Refresh subscription status after checkout
  useEffect(() => {
    if (sessionId) {
      // Wait a moment for Stripe to process, then check
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, checkSubscription]);

  const currentTier = tier ? SUBSCRIPTION_TIERS[tier] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <Card className="border-emerald-500/50 bg-slate-800/80 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          
          <CardHeader className="relative text-center pb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </motion.div>
            <CardTitle className="text-3xl text-white">¡Suscripción Activada!</CardTitle>
            <CardDescription className="text-slate-400 text-lg">
              Bienvenido a ObelixIA
            </CardDescription>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {currentTier && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-lg bg-slate-700/50 border border-slate-600"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-white">Plan {currentTier.name}</span>
                </div>
                <p className="text-sm text-slate-400 mb-3">{currentTier.description}</p>
                <ul className="space-y-1">
                  {currentTier.features.slice(0, 5).map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle className="h-3 w-3 text-emerald-400" />
                      {feature}
                    </li>
                  ))}
                  {currentTier.features.length > 5 && (
                    <li className="text-sm text-slate-500">
                      + {currentTier.features.length - 5} más...
                    </li>
                  )}
                </ul>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Link to="/dashboard" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/precios" className="block">
                <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                  Ver mi suscripción
                </Button>
              </Link>
            </motion.div>

            <p className="text-center text-xs text-slate-500">
              Recibirás un email de confirmación en breve.
              <br />
              ¿Necesitas ayuda? <Link to="/contact" className="text-emerald-400 hover:underline">Contacta con soporte</Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
