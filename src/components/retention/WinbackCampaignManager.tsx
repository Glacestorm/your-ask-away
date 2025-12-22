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
  DollarSign,
  Target,
  Zap,
  Play,
  Pause,
  RefreshCw,
  Send,
  ArrowUpRight,
  Percent
} from "lucide-react";
import { useWinbackCampaigns, WinbackCampaign } from "@/hooks/useWinbackCampaigns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function WinbackCampaignManager() {
  const { 
    campaigns, 
    isLoading, 
    createCampaign, 
    updateCampaign,
    isCreating 
  } = useWinbackCampaigns();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<WinbackCampaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    offer_type: 'discount' as 'discount' | 'free_trial' | 'feature_unlock' | 'custom',
    offer_value: '',
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
        offer_details: { value: parseFloat(newCampaign.offer_value), description: newCampaign.email_subject },
        target_segment: { type: newCampaign.target_segment },
        status: 'draft',
        is_ab_test: false
      });
      
      toast.success("Campaign created successfully");
      setIsCreateDialogOpen(false);
      setNewCampaign({
        name: '',
        description: '',
        offer_type: 'discount',
        offer_value: '',
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
      await updateCampaign({ id: campaign.id, status: newStatus });
      toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error("Failed to update campaign status");
    }
  };

  const getOfferIcon = (offerType: string) => {
    switch (offerType) {
      case 'discount': return <Percent className="h-4 w-4" />;
      case 'free_trial': return <Gift className="h-4 w-4" />;
      case 'feature_unlock': return <ArrowUpRight className="h-4 w-4" />;
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
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-3xl font-bold text-green-600">{totalConverted}</p>
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
                      onValueChange={(value) => setNewCampaign({ ...newCampaign, offer_type: value as 'discount' | 'free_trial' | 'feature_unlock' | 'custom' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Discount (%)</SelectItem>
                        <SelectItem value="free_trial">Free Trial</SelectItem>
                        <SelectItem value="feature_unlock">Feature Unlock</SelectItem>
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
                                  {campaign.description || `${campaign.offer_type}: ${(campaign.offer_details as any)?.value || ''}`}
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
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Conversion Progress</span>
                              <span className="font-medium">
                                {campaign.participants_count > 0 
                                  ? ((campaign.conversions_count || 0) / campaign.participants_count * 100).toFixed(1)
                                  : 0}%
                              </span>
                            </div>
                            <Progress 
                              value={campaign.participants_count > 0 
                                ? ((campaign.conversions_count || 0) / campaign.participants_count * 100)
                                : 0
                              } 
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

            <TabsContent value="active" className="space-y-4">
              {campaigns?.filter(c => c.status === 'active').length === 0 ? (
                <div className="text-center py-12">
                  <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No active campaigns</h3>
                  <p className="text-muted-foreground">Activate a campaign to start recovering churned customers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns?.filter(c => c.status === 'active').map((campaign) => (
                    <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              {getOfferIcon(campaign.offer_type)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{campaign.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {campaign.participants_count || 0} participants • {campaign.conversions_count || 0} conversions
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleCampaignStatus(campaign)}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {campaigns?.slice(0, 5).map((campaign) => (
                        <div key={campaign.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="font-medium truncate flex-1">{campaign.name}</span>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Conversion</p>
                              <p className="font-semibold">
                                {campaign.participants_count > 0 
                                  ? ((campaign.conversions_count || 0) / campaign.participants_count * 100).toFixed(1)
                                  : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Offer Type Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4" />
                          <span>Discount Offers</span>
                        </div>
                        <span className="font-semibold">
                          {campaigns?.filter(c => c.offer_type === 'discount').reduce((sum, c) => sum + (c.conversions_count || 0), 0) || 0} conversions
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Gift className="h-4 w-4" />
                          <span>Free Trial Offers</span>
                        </div>
                        <span className="font-semibold">
                          {campaigns?.filter(c => c.offer_type === 'free_trial').reduce((sum, c) => sum + (c.conversions_count || 0), 0) || 0} conversions
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="h-4 w-4" />
                          <span>Feature Unlock Offers</span>
                        </div>
                        <span className="font-semibold">
                          {campaigns?.filter(c => c.offer_type === 'feature_unlock').reduce((sum, c) => sum + (c.conversions_count || 0), 0) || 0} conversions
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
