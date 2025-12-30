// Vertical Accounting - Crypto/Web3
// Fase 12 - Módulo Disruptivo: Contabilidad Crypto y Blockchain

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bitcoin,
  Wallet,
  ArrowUpDown,
  TrendingUp,
  Shield,
  FileText,
  Coins,
  Network,
  Zap,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Database,
  RefreshCw,
  ExternalLink,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { VerticalHelpButton, VerticalAIAgentPanel } from './shared';

interface CryptoWallet {
  id: string;
  name: string;
  address: string;
  chain: string;
  balance: number;
  balanceUSD: number;
  lastSync: string;
  type: 'hot' | 'cold' | 'custodial' | 'defi';
}

interface CryptoTransaction {
  id: string;
  txHash: string;
  type: 'buy' | 'sell' | 'transfer' | 'swap' | 'stake' | 'unstake' | 'yield' | 'airdrop' | 'nft';
  asset: string;
  amount: number;
  amountUSD: number;
  fee: number;
  feeUSD: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  taxEvent: boolean;
  costBasis?: number;
  gainLoss?: number;
}

interface DeFiPosition {
  id: string;
  protocol: string;
  chain: string;
  type: 'lending' | 'borrowing' | 'liquidity' | 'staking' | 'farming';
  deposited: number;
  depositedUSD: number;
  rewards: number;
  rewardsUSD: number;
  apy: number;
  impermanentLoss?: number;
  healthFactor?: number;
}

interface NFTAsset {
  id: string;
  collection: string;
  tokenId: string;
  name: string;
  acquiredDate: string;
  costBasis: number;
  currentValue: number;
  chain: string;
  royalties?: number;
}

export function VerticalAccountingCrypto() {
  const [activeTab, setActiveTab] = useState('portfolio');

  // Mock data - Wallets
  const wallets: CryptoWallet[] = [
    {
      id: '1',
      name: 'Treasury Main',
      address: '0x742d...f44e',
      chain: 'Ethereum',
      balance: 45.5,
      balanceUSD: 156750,
      lastSync: '2024-01-15T10:30:00Z',
      type: 'cold'
    },
    {
      id: '2',
      name: 'Operations Hot',
      address: '0x1a2b...c3d4',
      chain: 'Ethereum',
      balance: 12.3,
      balanceUSD: 42435,
      lastSync: '2024-01-15T10:30:00Z',
      type: 'hot'
    },
    {
      id: '3',
      name: 'DeFi Vault',
      address: '0xdefi...v4u1',
      chain: 'Arbitrum',
      balance: 85000,
      balanceUSD: 85000,
      lastSync: '2024-01-15T10:25:00Z',
      type: 'defi'
    }
  ];

  // Mock data - Recent Transactions
  const transactions: CryptoTransaction[] = [
    {
      id: '1',
      txHash: '0xabc123...def456',
      type: 'swap',
      asset: 'ETH → USDC',
      amount: 5,
      amountUSD: 17250,
      fee: 0.002,
      feeUSD: 6.9,
      timestamp: '2024-01-15T09:00:00Z',
      status: 'confirmed',
      taxEvent: true,
      costBasis: 15000,
      gainLoss: 2250
    },
    {
      id: '2',
      txHash: '0x789abc...123def',
      type: 'stake',
      asset: 'ETH',
      amount: 10,
      amountUSD: 34500,
      fee: 0.001,
      feeUSD: 3.45,
      timestamp: '2024-01-14T15:30:00Z',
      status: 'confirmed',
      taxEvent: false
    },
    {
      id: '3',
      txHash: '0xnft001...mint99',
      type: 'nft',
      asset: 'CryptoPunk #1234',
      amount: 1,
      amountUSD: 125000,
      fee: 0.05,
      feeUSD: 172.5,
      timestamp: '2024-01-13T12:00:00Z',
      status: 'confirmed',
      taxEvent: true,
      costBasis: 125000
    }
  ];

  // Mock data - DeFi Positions
  const defiPositions: DeFiPosition[] = [
    {
      id: '1',
      protocol: 'Aave V3',
      chain: 'Ethereum',
      type: 'lending',
      deposited: 50000,
      depositedUSD: 50000,
      rewards: 1250,
      rewardsUSD: 1250,
      apy: 4.5
    },
    {
      id: '2',
      protocol: 'Uniswap V3',
      chain: 'Arbitrum',
      type: 'liquidity',
      deposited: 35000,
      depositedUSD: 35000,
      rewards: 2800,
      rewardsUSD: 2800,
      apy: 12.3,
      impermanentLoss: -450
    },
    {
      id: '3',
      protocol: 'Lido',
      chain: 'Ethereum',
      type: 'staking',
      deposited: 34500,
      depositedUSD: 34500,
      rewards: 890,
      rewardsUSD: 890,
      apy: 3.8
    }
  ];

  // Mock data - NFTs
  const nftAssets: NFTAsset[] = [
    {
      id: '1',
      collection: 'CryptoPunks',
      tokenId: '1234',
      name: 'CryptoPunk #1234',
      acquiredDate: '2024-01-13',
      costBasis: 125000,
      currentValue: 145000,
      chain: 'Ethereum',
      royalties: 2.5
    },
    {
      id: '2',
      collection: 'Bored Ape Yacht Club',
      tokenId: '5678',
      name: 'BAYC #5678',
      acquiredDate: '2023-11-20',
      costBasis: 85000,
      currentValue: 72000,
      chain: 'Ethereum',
      royalties: 2.5
    }
  ];

  const totalPortfolioValue = wallets.reduce((sum, w) => sum + w.balanceUSD, 0) +
    defiPositions.reduce((sum, p) => sum + p.depositedUSD + p.rewardsUSD, 0) +
    nftAssets.reduce((sum, n) => sum + n.currentValue, 0);

  const totalDeFiRewards = defiPositions.reduce((sum, p) => sum + p.rewardsUSD, 0);
  const totalUnrealizedGains = nftAssets.reduce((sum, n) => sum + (n.currentValue - n.costBasis), 0);

  const getTransactionTypeIcon = (type: CryptoTransaction['type']) => {
    switch (type) {
      case 'buy': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'sell': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'swap': return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
      case 'stake': return <Lock className="h-4 w-4 text-purple-500" />;
      case 'unstake': return <Lock className="h-4 w-4 text-orange-500" />;
      case 'yield': return <Coins className="h-4 w-4 text-yellow-500" />;
      case 'airdrop': return <Zap className="h-4 w-4 text-pink-500" />;
      case 'nft': return <Layers className="h-4 w-4 text-indigo-500" />;
      default: return <ArrowUpDown className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 shadow-lg">
            <Bitcoin className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Contabilidad Crypto & Web3</h1>
            <p className="text-muted-foreground">
              Portfolio tracking, DeFi, NFTs y cumplimiento fiscal blockchain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Wallets
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-orange-500 to-yellow-500">
            <Database className="h-4 w-4 mr-2" />
            Import Transactions
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Total</p>
                <p className="text-2xl font-bold">${totalPortfolioValue.toLocaleString()}</p>
                <p className="text-xs text-green-600">+12.5% vs mes anterior</p>
              </div>
              <Wallet className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DeFi Rewards YTD</p>
                <p className="text-2xl font-bold">${totalDeFiRewards.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Across {defiPositions.length} protocols</p>
              </div>
              <Coins className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${totalUnrealizedGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalUnrealizedGains >= 0 ? '+' : ''}${totalUnrealizedGains.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">NFTs + Tokens</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tax Liability Est.</p>
                <p className="text-2xl font-bold">$4,250</p>
                <p className="text-xs text-muted-foreground">Q1 2024 Estimated</p>
              </div>
              <FileText className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full max-w-4xl">
          <TabsTrigger value="portfolio" className="flex items-center gap-1">
            <Wallet className="h-4 w-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4" />
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="defi" className="flex items-center gap-1">
            <Network className="h-4 w-4" />
            DeFi
          </TabsTrigger>
          <TabsTrigger value="nfts" className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            NFTs
          </TabsTrigger>
          <TabsTrigger value="tax" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            Fiscal
          </TabsTrigger>
          <TabsTrigger value="compliance" className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Wallets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallets Conectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {wallets.map((wallet) => (
                      <div key={wallet.id} className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {wallet.chain}
                            </Badge>
                            <span className="font-medium">{wallet.name}</span>
                          </div>
                          <Badge variant={wallet.type === 'cold' ? 'default' : 'secondary'}>
                            {wallet.type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <code className="text-xs text-muted-foreground">{wallet.address}</code>
                          <span className="font-bold">${wallet.balanceUSD.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución por Chain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Ethereum</span>
                      <span className="font-medium">65%</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Arbitrum</span>
                      <span className="font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Polygon</span>
                      <span className="font-medium">10%</span>
                    </div>
                    <Progress value={10} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Otros</span>
                      <span className="font-medium">5%</span>
                    </div>
                    <Progress value={5} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Historial de Transacciones
                </span>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {getTransactionTypeIcon(tx.type)}
                          <div>
                            <p className="font-medium capitalize">{tx.type}</p>
                            <p className="text-sm text-muted-foreground">{tx.asset}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${tx.amountUSD.toLocaleString()}</p>
                          {tx.gainLoss !== undefined && (
                            <p className={`text-sm ${tx.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.gainLoss >= 0 ? '+' : ''}${tx.gainLoss.toLocaleString()} P&L
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <code>{tx.txHash}</code>
                          {tx.taxEvent && (
                            <Badge variant="destructive" className="text-[10px]">
                              Tax Event
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Fee: ${tx.feeUSD.toFixed(2)}</span>
                          <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DeFi Tab */}
        <TabsContent value="defi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Posiciones DeFi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {defiPositions.map((position) => (
                  <div key={position.id} className="p-4 rounded-lg border bg-gradient-to-r from-purple-500/5 to-blue-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Globe className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium">{position.protocol}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{position.chain}</Badge>
                            <Badge variant="secondary" className="text-xs capitalize">{position.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">${position.depositedUSD.toLocaleString()}</p>
                        <p className="text-sm text-green-600">APY: {position.apy}%</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Rewards</p>
                        <p className="font-medium text-green-600">+${position.rewardsUSD.toLocaleString()}</p>
                      </div>
                      {position.impermanentLoss !== undefined && (
                        <div>
                          <p className="text-muted-foreground">IL</p>
                          <p className="font-medium text-red-600">${position.impermanentLoss}</p>
                        </div>
                      )}
                      {position.healthFactor !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Health Factor</p>
                          <p className="font-medium">{position.healthFactor}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFTs Tab */}
        <TabsContent value="nfts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Inventario NFT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nftAssets.map((nft) => (
                  <div key={nft.id} className="p-4 rounded-lg border bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Layers className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{nft.name}</p>
                        <p className="text-sm text-muted-foreground">{nft.collection}</p>
                        <Badge variant="outline" className="text-xs mt-1">{nft.chain}</Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Cost Basis</p>
                        <p className="font-medium">${nft.costBasis.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Value</p>
                        <p className="font-medium">${nft.currentValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">P&L</p>
                        <p className={`font-medium ${nft.currentValue - nft.costBasis >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {nft.currentValue - nft.costBasis >= 0 ? '+' : ''}
                          ${(nft.currentValue - nft.costBasis).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Royalties</p>
                        <p className="font-medium">{nft.royalties}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Tab */}
        <TabsContent value="tax" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumen Fiscal 2024
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-muted-foreground">Ganancias Realizadas</p>
                    <p className="text-2xl font-bold text-green-600">+$12,450</p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-muted-foreground">Pérdidas Realizadas</p>
                    <p className="text-2xl font-bold text-red-600">-$3,200</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm text-muted-foreground">Ingreso DeFi (Staking/Yield)</p>
                    <p className="text-2xl font-bold text-blue-600">$4,940</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm text-muted-foreground">Airdrops Recibidos</p>
                    <p className="text-2xl font-bold text-orange-600">$850</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métodos de Cálculo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">FIFO</span>
                      <Badge>Activo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">First In, First Out - Método predeterminado</p>
                  </div>
                  <div className="p-3 rounded-lg border opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">LIFO</span>
                      <Badge variant="outline">Disponible</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Last In, First Out</p>
                  </div>
                  <div className="p-3 rounded-lg border opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">HIFO</span>
                      <Badge variant="outline">Disponible</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Highest In, First Out - Minimiza impuestos</p>
                  </div>
                  <div className="p-3 rounded-lg border opacity-60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Specific ID</span>
                      <Badge variant="outline">Disponible</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Selección manual de lotes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Cumplimiento Regulatorio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>MiCA (EU) Compliance</span>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>FATF Travel Rule</span>
                    </div>
                    <Badge variant="default">Compliant</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      <span>DAC8 Reporting</span>
                    </div>
                    <Badge variant="secondary">Pending 2025</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <span>Form 8949 (IRS)</span>
                    </div>
                    <Badge variant="outline">Q1 Filing</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Wallet Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Risk Score</span>
                      <span className="text-2xl font-bold text-green-600">92/100</span>
                    </div>
                    <Progress value={92} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      Bajo riesgo - No se detectaron interacciones con direcciones sancionadas
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg border">
                      <p className="text-muted-foreground">OFAC Check</p>
                      <p className="font-medium text-green-600">✓ Clear</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-muted-foreground">Mixer Detection</p>
                      <p className="font-medium text-green-600">✓ None</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-muted-foreground">Darknet Links</p>
                      <p className="font-medium text-green-600">✓ None</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-muted-foreground">Last Scan</p>
                      <p className="font-medium">Today 10:30</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Help Button & AI Agent Panel */}
      <VerticalHelpButton verticalType="crypto" />
      <VerticalAIAgentPanel verticalType="crypto" />
    </div>
  );
}

export default VerticalAccountingCrypto;
