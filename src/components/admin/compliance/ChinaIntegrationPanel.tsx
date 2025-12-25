import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  RefreshCw, 
  MessageCircle, 
  Wallet, 
  FileText,
  Server,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings2
} from 'lucide-react';
import { useChinaIntegration } from '@/hooks/admin/compliance';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ChinaIntegrationPanel() {
  const [activeTab, setActiveTab] = useState('wechat');

  const {
    isLoading,
    config,
    error,
    fetchConfig,
    updateConfig,
    getWeChatAuthUrl,
    createWeChatPayment,
    createAlipayPayment,
    generateFapiao,
  } = useChinaIntegration();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleTestWeChatAuth = async () => {
    const result = await getWeChatAuthUrl('test-redirect');
    if (result) {
      toast.success('WeChat Auth URL generada');
    }
  };

  const handleTestPayment = async (type: 'wechat' | 'alipay') => {
    const result = type === 'wechat' 
      ? await createWeChatPayment(100, 'Test', 'test-order-1')
      : await createAlipayPayment(100, 'Test', 'test-order-1');
    if (result) {
      toast.success(`${type === 'wechat' ? 'WeChat' : 'Alipay'} payment created`);
    }
  };

  const handleTestFapiao = async () => {
    const result = await generateFapiao({
      buyerName: 'Test Company',
      amount: 1000,
      items: [{ name: 'Service', quantity: 1, price: 1000 }]
    });
    if (result) {
      toast.success('Fapiao generado');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <span className="text-xl">🇨🇳</span>
            </div>
            <div>
              <CardTitle className="text-lg">China Integration Suite</CardTitle>
              <p className="text-xs text-muted-foreground">
                WeChat, Alipay, Golden Tax, DingTalk
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => fetchConfig()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="wechat" className="text-xs">
              <MessageCircle className="h-3 w-3 mr-1" />
              WeChat
            </TabsTrigger>
            <TabsTrigger value="alipay" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" />
              Alipay
            </TabsTrigger>
            <TabsTrigger value="goldentax" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Golden Tax
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[450px] pr-4">
            <TabsContent value="wechat" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Conectado
                  </Badge>
                  <span className="text-sm">WeChat Official Account</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleTestWeChatAuth}>
                  Test Auth
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input placeholder="wx1234567890abcdef" />
                </div>
                <div className="space-y-2">
                  <Label>App Secret</Label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Merchant ID (Pay)</Label>
                  <Input placeholder="1234567890" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">WeChat Mini Programs</p>
                    <p className="text-xs text-muted-foreground">CRM accesible desde WeChat</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">WeChat Pay</p>
                    <p className="text-xs text-muted-foreground">Pagos móviles integrados</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button variant="outline" className="w-full" onClick={() => handleTestPayment('wechat')}>
                  Test WeChat Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="alipay" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activo
                  </Badge>
                  <span className="text-sm">Alipay Business</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleTestPayment('alipay')}>
                  Test Pay
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input placeholder="2021000000000000" />
                </div>
                <div className="space-y-2">
                  <Label>Private Key</Label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Alipay Public Key</Label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Alipay Mini Programs</p>
                    <p className="text-xs text-muted-foreground">Apps dentro de Alipay</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Face Pay</p>
                    <p className="text-xs text-muted-foreground">Pago por reconocimiento facial</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="goldentax" className="mt-0 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                  <span className="text-sm">Golden Tax System</span>
                </div>
                <Button size="sm" variant="outline" onClick={handleTestFapiao}>
                  Test Fapiao
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tax ID (统一社会信用代码)</Label>
                  <Input placeholder="91110000000000000X" />
                </div>
                <div className="space-y-2">
                  <Label>Disk Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Certificate Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">Fapiao Electrónico</p>
                    <p className="text-xs text-muted-foreground">Factura electrónica obligatoria</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">VAT Special Invoice</p>
                    <p className="text-xs text-muted-foreground">增值税专用发票</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enterprise" className="mt-0 space-y-4">
              <div className="grid gap-4">
                {/* DingTalk */}
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-blue-500/10">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">DingTalk (钉钉)</p>
                        <p className="text-xs text-muted-foreground">Alibaba Enterprise</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Corp ID</Label>
                    <Input placeholder="dingxxxxxxxx" className="h-8 text-sm" />
                  </div>
                </div>

                {/* Feishu */}
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-purple-500/10">
                        <MessageCircle className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Feishu (飞书)</p>
                        <p className="text-xs text-muted-foreground">ByteDance Enterprise</p>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">App ID</Label>
                    <Input placeholder="cli_xxxxxxxx" className="h-8 text-sm" />
                  </div>
                </div>

                {/* ICP & Hosting */}
                <div className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-red-500/10">
                        <Server className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">ICP License & Hosting</p>
                        <p className="text-xs text-muted-foreground">Requisito legal China</p>
                      </div>
                    </div>
                    <Badge variant="outline">Requerido</Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">ICP Number</Label>
                    <Input placeholder="京ICP备XXXXXXXX号" className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button className="flex-1" onClick={() => updateConfig(activeTab, {})}>
              <Settings2 className="h-4 w-4 mr-2" />
              Guardar Configuración
            </Button>
          </div>
        </Tabs>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ChinaIntegrationPanel;
