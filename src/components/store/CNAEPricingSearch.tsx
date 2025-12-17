import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash2, Calculator, Package, Sparkles, TrendingDown, Euro } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useCNAEPricing, CNAEPriceDetail } from '@/hooks/useCNAEPricing';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCnaeDescription } from '@/lib/cnaeDescriptions';

const CNAEPricingSearch: React.FC = () => {
  const { t } = useLanguage();
  const [selectedCnaes, setSelectedCnaes] = useState<string[]>([]);
  const [cnaeInput, setCnaeInput] = useState('');
  const [turnover, setTurnover] = useState<number>(1000000);
  const [availableCnaes, setAvailableCnaes] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const {
    isLoading,
    pricingResult,
    calculatePricing,
    fetchCNAEPricing,
    getComplexityTierColor,
    getTurnoverTierLabel
  } = useCNAEPricing();

  useEffect(() => {
    loadAvailableCnaes();
  }, []);

  useEffect(() => {
    if (selectedCnaes.length > 0) {
      calculatePricing(selectedCnaes, turnover);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [selectedCnaes, turnover]);

  const loadAvailableCnaes = async () => {
    try {
      const data = await fetchCNAEPricing();
      setAvailableCnaes(data || []);
    } catch (error) {
      console.error('Error loading CNAEs:', error);
    }
  };

  const addCnae = (cnaeCode: string) => {
    if (cnaeCode && !selectedCnaes.includes(cnaeCode)) {
      setSelectedCnaes([...selectedCnaes, cnaeCode]);
      setCnaeInput('');
    }
  };

  const removeCnae = (cnaeCode: string) => {
    setSelectedCnaes(selectedCnaes.filter(c => c !== cnaeCode));
  };

  const filteredCnaes = availableCnaes.filter(cnae =>
    (cnae.cnae_code.includes(cnaeInput) || 
     cnae.sector_category?.toLowerCase().includes(cnaeInput.toLowerCase())) &&
    !selectedCnaes.includes(cnae.cnae_code)
  );

  return (
    <section id="cnae-pricing" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent" />
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            CALCULADORA CNAE
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Calcula tu Precio por CNAE
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Introduce tu código CNAE y facturación para obtener un presupuesto personalizado
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto"
        >
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
            <CardContent className="p-8 space-y-6">
              {/* Turnover Input */}
              <div className="space-y-2">
                <Label className="text-slate-300">Facturación Anual (€)</Label>
                <Input
                  type="number"
                  value={turnover}
                  onChange={(e) => setTurnover(Number(e.target.value))}
                  placeholder="Ej: 1000000"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                />
                {pricingResult && pricingResult.details.length > 0 && (
                  <p className="text-sm text-emerald-400">
                    Tier: {getTurnoverTierLabel(pricingResult.details[0]?.turnover_tier || 'medium')}
                  </p>
                )}
              </div>

              {/* CNAE Search */}
              <div className="space-y-2">
                <Label className="text-slate-300">Buscar CNAE</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      value={cnaeInput}
                      onChange={(e) => setCnaeInput(e.target.value)}
                      placeholder="Código CNAE o sector..."
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    onClick={() => addCnae(cnaeInput)}
                    disabled={!cnaeInput || selectedCnaes.includes(cnaeInput)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {cnaeInput && filteredCnaes.length > 0 && (
                  <ScrollArea className="h-48 border border-slate-700 rounded-lg bg-slate-900/50">
                    {filteredCnaes.slice(0, 15).map(cnae => (
                      <div
                        key={cnae.cnae_code}
                        className="flex items-center justify-between p-3 hover:bg-slate-800 cursor-pointer border-b border-slate-700/50 last:border-0"
                        onClick={() => addCnae(cnae.cnae_code)}
                      >
                        <div className="flex-1">
                          <span className="font-mono font-semibold text-white">{cnae.cnae_code}</span>
                          <span className="text-slate-400 ml-2 text-sm">
                            {cnae.sector_category}
                          </span>
                          <p className="text-xs text-slate-500 truncate max-w-xs">
                            {getCnaeDescription(cnae.cnae_code)}
                          </p>
                        </div>
                        <Badge className={`${getComplexityTierColor(cnae.complexity_tier)} ml-2`}>
                          {cnae.base_price.toLocaleString()}€
                        </Badge>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </div>

              {/* Selected CNAEs */}
              {selectedCnaes.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-slate-300">CNAEs Seleccionados ({selectedCnaes.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCnaes.map(cnae => (
                      <Badge
                        key={cnae}
                        variant="secondary"
                        className="gap-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1"
                      >
                        {cnae}
                        <button
                          onClick={() => removeCnae(cnae)}
                          className="ml-1 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Results */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-slate-400">Calculando precio...</p>
                </div>
              ) : showResults && pricingResult ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-4 border-t border-slate-700"
                >
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-slate-700/50 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="text-sm text-slate-400">Precio Base</div>
                        <div className="text-2xl font-bold text-white">
                          {pricingResult.summary.total_base_price.toLocaleString()}€
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 border-emerald-500/30">
                      <CardContent className="pt-4">
                        <div className="text-sm text-emerald-300">Precio Final</div>
                        <div className="text-2xl font-bold text-emerald-400">
                          {pricingResult.summary.total_final_price.toLocaleString()}€
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Savings */}
                  {pricingResult.summary.total_savings > 0 && (
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <TrendingDown className="h-5 w-5 text-green-400" />
                      <span className="text-green-300">
                        ¡Ahorras {pricingResult.summary.total_savings.toLocaleString()}€
                        ({pricingResult.summary.savings_percentage}%)!
                      </span>
                    </div>
                  )}

                  {/* Bundle Applied */}
                  {pricingResult.summary.bundle_applied && (
                    <div className="flex items-center gap-2 p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <Package className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-300">
                        {pricingResult.summary.bundle_applied.name}:
                        -{pricingResult.summary.bundle_applied.discount}% descuento
                      </span>
                    </div>
                  )}

                  {/* Price Details */}
                  <div className="space-y-2">
                    <Label className="text-slate-300">Detalle por CNAE</Label>
                    <ScrollArea className="h-32">
                      {pricingResult.details.map((detail: CNAEPriceDetail) => (
                        <div
                          key={detail.cnae_code}
                          className="flex items-center justify-between py-2 border-b border-slate-700/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white">{detail.cnae_code}</span>
                            <Badge
                              className={getComplexityTierColor(detail.complexity_tier)}
                              variant="outline"
                            >
                              {detail.complexity_tier}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-white">
                              {detail.final_price.toLocaleString()}€
                            </div>
                            {detail.volume_discount_pct > 0 && (
                              <div className="text-xs text-green-400">
                                -{detail.volume_discount_pct}%
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>

                  {/* Recommendations */}
                  {pricingResult.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-slate-300">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        Recomendaciones
                      </Label>
                      <ul className="space-y-1 text-sm text-slate-400">
                        {pricingResult.recommendations.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : selectedCnaes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Euro className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">Busca y selecciona tu código CNAE</p>
                  <p className="text-sm mt-2">para calcular el precio de tu licencia</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CNAEPricingSearch;
