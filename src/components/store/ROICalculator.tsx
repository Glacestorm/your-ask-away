import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp, Users, Clock, Euro, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const ROICalculator: React.FC = () => {
  const [employees, setEmployees] = useState(50);
  const [sector, setSector] = useState('finance');
  const [currentCost, setCurrentCost] = useState(100000);
  const { t } = useLanguage();
  
  const calculations = useMemo(() => {
    const hoursSavedPerEmployee = sector === 'finance' ? 15 : sector === 'retail' ? 10 : 12;
    const hourlyRate = 35;
    const annualHoursSaved = employees * hoursSavedPerEmployee * 12;
    const annualSavings = annualHoursSaved * hourlyRate;
    
    const obelixiaCost = Math.max(99000, employees * 1980);
    const netSavings = annualSavings - obelixiaCost;
    const roi = ((netSavings / obelixiaCost) * 100);
    
    return {
      hoursSaved: annualHoursSaved,
      annualSavings,
      obelixiaCost,
      netSavings,
      roi: Math.max(0, roi),
      paybackMonths: Math.ceil(obelixiaCost / (annualSavings / 12)),
    };
  }, [employees, sector, currentCost]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-teal-500/20 text-teal-300 border-teal-500/30">
            <Calculator className="w-3 h-3 mr-1" />
            {t('landing.roi.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('landing.roi.title')}
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            {t('landing.roi.subtitle')}
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-6">{t('landing.roi.companyData')}</h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-slate-300 mb-2 block">{t('landing.roi.employees')}</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[employees]}
                      onValueChange={(v) => setEmployees(v[0])}
                      min={10}
                      max={500}
                      step={10}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={employees}
                      onChange={(e) => setEmployees(Number(e.target.value))}
                      className="w-24 bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">{t('landing.roi.sector')}</Label>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">{t('landing.roi.sectorFinance')}</SelectItem>
                      <SelectItem value="retail">{t('landing.roi.sectorRetail')}</SelectItem>
                      <SelectItem value="industry">{t('landing.roi.sectorIndustry')}</SelectItem>
                      <SelectItem value="services">{t('landing.roi.sectorServices')}</SelectItem>
                      <SelectItem value="healthcare">{t('landing.roi.sectorHealthcare')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">{t('landing.roi.currentCost')}</Label>
                  <Input
                    type="number"
                    value={currentCost}
                    onChange={(e) => setCurrentCost(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </motion.div>

            {/* Results Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-gradient-to-br from-emerald-950/50 to-slate-800/50 backdrop-blur border border-emerald-500/30 rounded-2xl"
            >
              <h3 className="text-xl font-semibold text-white mb-6">{t('landing.roi.savingsPotential')}</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <Clock className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{calculations.hoursSaved.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">{t('landing.roi.hoursSaved')}</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <Euro className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{formatCurrency(calculations.annualSavings)}</div>
                  <div className="text-xs text-slate-400">{t('landing.roi.annualSavings')}</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-emerald-400">{calculations.roi.toFixed(0)}%</div>
                  <div className="text-xs text-slate-400">{t('landing.roi.expectedRoi')}</div>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{calculations.paybackMonths}</div>
                  <div className="text-xs text-slate-400">{t('landing.roi.paybackMonths')}</div>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300">{t('landing.roi.investment')}</span>
                  <div className="text-right">
                    <span className="text-white font-medium">{formatCurrency(calculations.obelixiaCost)}</span>
                    <span className="text-[10px] text-slate-500 ml-1">/{t('landing.roi.yearExVat')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-emerald-300 font-medium">{t('landing.roi.netBenefit')}</span>
                  <span className="text-emerald-400 font-bold text-xl">{formatCurrency(calculations.netSavings)}</span>
                </div>
              </div>

              <Link to="/store/modules">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-6">
                  {t('landing.roi.startNow')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ROICalculator;
