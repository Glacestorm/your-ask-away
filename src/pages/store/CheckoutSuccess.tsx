import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Download, Mail, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import confetti from 'canvas-confetti';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const { t } = useLanguage();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart on success
    clearCart();

    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#6ee7b7'],
    });
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-emerald-950/20 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <div className="bg-slate-800/50 backdrop-blur border border-emerald-500/30 rounded-2xl p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            {t('checkout.purchaseCompleted')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 mb-8"
          >
            {t('checkout.thankYou')}
          </motion.p>

          {/* Order Info */}
          {sessionId && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/50 rounded-xl p-4 mb-8 text-left"
            >
              <div className="text-sm text-slate-400 mb-1">{t('checkout.orderReference')}:</div>
              <div className="text-emerald-400 font-mono text-sm break-all">{sessionId}</div>
            </motion.div>
          )}

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 mb-8 text-left"
          >
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              {t('checkout.nextSteps')}
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <Mail className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span>{t('checkout.emailConfirmation')}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <Download className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span>{t('checkout.invoiceAvailable')}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-slate-300">
                <Phone className="w-5 h-5 text-emerald-400 mt-0.5" />
                <span>{t('checkout.onboardingContact')}</span>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <Link to="/admin" className="block">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6">
                {t('checkout.accessDashboard')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/store" className="block">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-800">
                {t('checkout.backToStore')}
              </Button>
            </Link>
          </motion.div>

          {/* Support */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-sm text-slate-500"
          >
            {t('checkout.needHelp')}{' '}
            <a href="mailto:soporte@obelixia.com" className="text-emerald-400 hover:underline">
              soporte@obelixia.com
            </a>
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
