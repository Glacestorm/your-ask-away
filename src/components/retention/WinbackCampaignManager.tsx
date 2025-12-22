import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  Plus,
  Users,
  Mail,
  Gift,
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ChevronRight,
  Send,
  MessageSquare,
  ArrowUpRight,
  Percent
} from "lucide-react";
import { useWinbackCampaigns, WinbackCampaign } from "@/hooks/useWinbackCampaigns";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function WinbackCampaignManager() {
  const { 
    campaigns, 
    isLoading, 
    refetch, 
    createCampaign, 
    updateCampaign,
    findChurnedCompanies,
    getCampaignStats,
    getABTestResults,
    isCreating 
  } = useWinbackCampaigns();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WinbackCampaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    offer_type: 'discount',
    offer_value: '',
    offer_description: '',
    target_segment: 'all_churned',
    email_subject: '',
    email_body: ''
  });

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.offer_value) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await createCampaign({
        name: newCampaign.name,
        description: newCampaign.description,
        offer_type: newCampaign.offer_type,
        offer_value: parseFloat(newCampaign.offer_value),
        offer_description: newCampaign.offer_description,
        target_segment: newCampaign.target_segment,
        email_subject: newCampaign.email_subject,
        email_body: newCampaign.email_body,
        status: 'draft',
        ab_test_enabled: false
      });
      
      toast.success("Campaign created successfully");
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        offer_type: 'discount',
        offer_value: '',
        offer_description: '',
        target_segment: 'all_churned',
        email_subject: '',
        email_body: ''
      });
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const handleToggleCampaignStatus = async (campaign: WinbackCampaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    try {
      await updateCampaign(campaign.id, { status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error("Failed to update campaign status");
    }
  };

  const getOfferIcon = (offerType: string) => {
    switch (offerType) {
      case 'discount': return <Percent className="h-4 w-4" />;
      case 'free_months': return <Gift className="h-4 w-4" />;
      case 'upgrade': return <ArrowUpRight className="h-4 w-4" />;
      case 'custom': return <Zap className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Calculate totals from campaigns
  const totalRecovered = campaigns?.reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0;
  const totalParticipants = campaigns?.reduce((sum, c) => sum + (c.participants_count || 0), 0) || 0;
  const totalConverted = campaigns?.reduce((sum, c) => sum + (c.conversions_count || 0), 0) || 0;
  const avgConversionRate = totalParticipants > 0 ? (totalConverted / totalParticipants) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-3xl font-bold">
                  {campaigns?.filter(c => c.status === 'active').length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reached</p>
                <p className="text-3xl font-bold">{totalParticipants}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold text-green-500">{avgConversionRate.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR Recovered</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalRecovered)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Winback Campaigns</CardTitle>
            <CardDescription>Manage campaigns to recover churned customers</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Winback Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                      placeholder="Q4 Winback Campaign"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target">Target Segment</Label>
                    <Select 
                      value={newCampaign.target_segment}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, target_segment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_churned">All Churned</SelectItem>
                        <SelectItem value="recent_churn">Recent Churn (90 days)</SelectItem>
                        <SelectItem value="high_value">High Value Churned</SelectItem>
                        <SelectItem value="voluntary">Voluntary Churn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    placeholder="Campaign description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offer_type">Offer Type</Label>
                    <Select 
                      value={newCampaign.offer_type}
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, offer_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount (%)</SelectItem>
                        <SelectItem value="free_months">Free Months</SelectItem>
                        <SelectItem value="upgrade">Free Upgrade</SelectItem>
                        <SelectItem value="custom">Custom Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="offer_value">Offer Value *</Label>
                    <Input
                      id="offer_value"
                      type="number"
                      value={newCampaign.offer_value}
                      onChange={(e) => setNewCampaign({ ...newCampaign, offer_value: e.target.value })}
                      placeholder={newCampaign.offer_type === 'discount' ? '20' : '2'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offer_description">Offer Description</Label>
                  <Input
                    id="offer_description"
                    value={newCampaign.offer_description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, offer_description: e.target.value })}
                    placeholder="Get 20% off for 3 months when you return!"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_subject">Email Subject</Label>
                  <Input
                    id="email_subject"
                    value={newCampaign.email_subject}
                    onChange={(e) => setNewCampaign({ ...newCampaign, email_subject: e.target.value })}
                    placeholder="We miss you! Here's a special offer..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_body">Email Body</Label>
                  <Textarea
                    id="email_body"
                    value={newCampaign.email_body}
                    onChange={(e) => setNewCampaign({ ...newCampaign, email_body: e.target.value })}
                    placeholder="Email content..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Campaigns</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns?.length === 0 ? (
                <div className="text-center py-12">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No campaigns yet</h3>
                  <p className="text-muted-foreground mb-4">Create your first winback campaign to recover churned customers.</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns?.map((campaign) => (
                    <Card 
                      key={campaign.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCampaign(campaign)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                {getOfferIcon(campaign.offer_type)}
                              </div>
                              <div>
                                <h3 className="font-semibold">{campaign.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {campaign.offer_description || `${campaign.offer_type}: ${campaign.offer_value}`}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Participants</p>
                              <p className="font-semibold">{campaign.participants_count || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Conversions</p>
                              <p className="font-semibold text-green-600">{campaign.conversions_count || 0}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Recovered</p>
                              <p className="font-semibold text-green-600">
                                {formatCurrency(campaign.recovered_mrr || 0)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(campaign.status)}>
                              {campaign.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCampaignStatus(campaign);
                              }}
                            >
                              {campaign.status === 'active' ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Progress bar for active campaigns */}
                        {campaign.status === 'active' && campaign.participants_count > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Conversion Progress</span>
                              <span className="font-medium">
                                {((campaign.conversions_count || 0) / campaign.participants_count * 100).toFixed(1)}%
                              </span>
                            </div>
                            <Progress 
                              value={(campaign.conversions_count || 0) / campaign.participants_count * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active">
              <div className="space-y-4">
                {campaigns?.filter(c => c.status === 'active').length === 0 ? (
                  <div className="text-center py-12">
                    <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">No active campaigns</h3>
                    <p className="text-muted-foreground">Activate a campaign to start recovering customers.</p>
                  </div>
                ) : (
                  campaigns?.filter(c => c.status === 'active').map((campaign) => (
                    <Card key={campaign.id} className="border-l-4 border-l-green-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Running since {campaign.start_date ? format(new Date(campaign.start_date), 'MMM d, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Live Performance</p>
                              <p className="text-lg font-bold text-green-600">
                                {formatCurrency(campaign.recovered_mrr || 0)} recovered
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns?.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <Progress 
                              value={campaign.participants_count ? 
                                (campaign.conversions_count || 0) / campaign.participants_count * 100 : 0
                              } 
                              className="h-2 mt-1"
                            />
                          </div>
                          <span className="text-sm font-semibold">
                            {campaign.participants_count ? 
                              ((campaign.conversions_count || 0) / campaign.participants_count * 100).toFixed(0) : 0
                            }%
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recovery by Offer Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-blue-500" />
                          <span>Discount Offers</span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(
                            campaigns?.filter(c => c.offer_type === 'discount')
                              .reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4 text-purple-500" />
                          <span>Free Months</span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(
                            campaigns?.filter(c => c.offer_type === 'free_months')
                              .reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                          <span>Upgrades</span>
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(
                            campaigns?.filter(c => c.offer_type === 'upgrade')
                              .reduce((sum, c) => sum + (c.recovered_mrr || 0), 0) || 0
                          )}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
