import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Search,
  Plus,
  Trash2,
  BarChart3,
  Star,
  Globe
} from 'lucide-react';
import { useERPStockQuotes, type StockQuote, type MarketIndex } from '@/hooks/erp/useERPStockQuotes';
import { cn } from '@/lib/utils';

function IndexCard({ index }: { index: MarketIndex }) {
  const isPositive = index.change >= 0;
  
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium">{index.name}</span>
        <Badge variant="outline" className="text-xs">{index.currency}</Badge>
      </div>
      <p className="text-lg font-bold">{index.value.toLocaleString('es-ES')}</p>
      <div className={cn(
        "flex items-center gap-1 text-sm",
        isPositive ? "text-green-600" : "text-red-600"
      )}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>
          {isPositive ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

function StockRow({ 
  stock, 
  onRemove,
  showRemove = true 
}: { 
  stock: StockQuote; 
  onRemove?: (symbol: string) => void;
  showRemove?: boolean;
}) {
  const isPositive = stock.change >= 0;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          isPositive ? "bg-green-500/10" : "bg-red-500/10"
        )}>
          {isPositive ? (
            <TrendingUp className={cn("h-4 w-4", isPositive ? "text-green-600" : "text-red-600")} />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{stock.symbol}</span>
            <Badge variant="outline" className="text-xs">{stock.exchange}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="font-bold">
            {stock.price.toLocaleString('es-ES', { 
              style: 'currency', 
              currency: stock.currency 
            })}
          </p>
          <p className={cn(
            "text-sm flex items-center justify-end gap-1",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
          </p>
        </div>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(stock.symbol)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function StockWatchlistPanel() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    watchlistQuotes,
    marketSummary,
    isLoading,
    searchStocks,
    refetchWatchlist,
    addToWatchlist,
    removeFromWatchlist
  } = useERPStockQuotes();

  const handleSearch = useCallback(async () => {
    if (!searchInput || searchInput.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await searchStocks(searchInput);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  }, [searchInput, searchStocks]);

  const handleAddToWatchlist = async (stock: StockQuote) => {
    await addToWatchlist({
      symbol: stock.symbol,
      stock_name: stock.name,
      exchange: stock.exchange,
      currency: stock.currency
    });
    setSearchResults([]);
    setSearchInput('');
    setSearchOpen(false);
  };

  const handleRemoveFromWatchlist = async (symbol: string) => {
    await removeFromWatchlist(symbol);
  };

  return (
    <div className="space-y-4">
      {/* Market Indices Summary */}
      {marketSummary?.indices && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {marketSummary.indices.map((index) => (
            <IndexCard key={index.symbol} index={index} />
          ))}
        </div>
      )}

      {/* Watchlist */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Lista de Seguimiento
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchWatchlist()} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
              Actualizar
            </Button>
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir Valor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buscar Valor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar por símbolo, nombre o ISIN..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-[300px]">
                    {isSearching ? (
                      <div className="flex items-center justify-center h-32">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>Busca acciones para añadir a tu watchlist</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {searchResults.map((stock) => (
                          <div 
                            key={stock.symbol}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleAddToWatchlist(stock)}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{stock.symbol}</span>
                                <Badge variant="outline" className="text-xs">{stock.exchange}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{stock.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">
                                {stock.price.toLocaleString('es-ES', { 
                                  style: 'currency', 
                                  currency: stock.currency 
                                })}
                              </p>
                              <p className={cn(
                                "text-sm",
                                stock.change >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : watchlistQuotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <BarChart3 className="h-8 w-8 mb-2" />
                <p>No hay valores en seguimiento</p>
                <p className="text-sm">Añade acciones para seguir sus cotizaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlistQuotes.map((stock) => (
                  <StockRow 
                    key={stock.symbol} 
                    stock={stock} 
                    onRemove={handleRemoveFromWatchlist}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

export default StockWatchlistPanel;
