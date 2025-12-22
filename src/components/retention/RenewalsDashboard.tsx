import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  Target,
  Users,
  ArrowUpRight,
  BarChart3
} from "lucide-react";
import { useRenewalManagement, RenewalOpportunity } from "@/hooks/useRenewalManagement";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RenewalsDashboard() {
  const { renewals, dashboardData, isLoading, refetch, updateRenewal, addActivity, predictRenewal } = useRenewalManagement();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRenewal, setSelectedRenewal] = useState<RenewalOpportunity | null>(null);

  const filteredRenewals = renewals?.filter(renewal => {
    const companyName = renewal.company?.name || '';
    const matchesSearch = companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || renewal.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const getUrgencyColor = (daysToRenewal: number) => {
    if (daysToRenewal <= 7) return "text-red-500 bg-red-50";
    if (daysToRenewal <= 30) return "text-orange-500 bg-orange-50";
    if (daysToRenewal <= 60) return "text-yellow-500 bg-yellow-50";
    return "text-green-500 bg-green-50";
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-green-500";
    if (probability >= 60) return "text-yellow-500";
    if (probability >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const handlePredict = async (renewal: RenewalOpportunity) => {
    try {
      const prediction = await predictRenewal(renewal.company_id);
      if (prediction) {
        toast.success(`Prediction updated: ${prediction.predicted_outcome} (${prediction.confidence}% confidence)`);
        await updateRenewal({ 
          id: renewal.id,
          predicted_outcome: prediction.predicted_outcome,
          renewal_probability: prediction.probability
        });
      }
    } catch (error) {
      toast.error("Failed to generate prediction");
    }
  };

  const handleLogActivity = async (renewal: RenewalOpportunity, type: 'call' | 'email' | 'meeting' | 'demo' | 'proposal' | 'contract_sent' | 'negotiation') => {
    try {
      await addActivity({
        renewal_id: renewal.id,
        activity_type: type,
        notes: `${type} activity logged`,
        outcome: 'completed'
      });
      toast.success("Activity logged successfully");
    } catch (error) {
      toast.error("Failed to log activity");
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming (30 days)</p>
                <p className="text-3xl font-bold">{dashboardData.upcoming30?.length || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-3xl font-bold text-red-500">{dashboardData.atRisk?.length || 0}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR at Risk</p>
                <p className="text-3xl font-bold">{formatCurrency(dashboardData.totalMrrAtRisk)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Renewal Rate</p>
                <p className="text-3xl font-bold text-green-500">{dashboardData.renewalRate?.toFixed(1) || 0}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search renewals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="in_negotiation">In Negotiation</SelectItem>
                <SelectItem value="renewed">Renewed</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Renewals Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRenewals.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No renewals found</h3>
                <p className="text-muted-foreground">No renewals match your current filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredRenewals.map((renewal) => {
                const daysToRenewal = differenceInDays(new Date(renewal.renewal_date), new Date());
                const companyName = renewal.company?.name || 'Unknown Company';
                const probability = renewal.renewal_probability || 0;
                const mrr = renewal.current_mrr || 0;
                const assigneeName = renewal.assignee?.full_name || 'Unassigned';
                
                return (
                  <Card 
                    key={renewal.id} 
                    className={cn(
                      "hover:shadow-md transition-all cursor-pointer",
                      (renewal.predicted_outcome === 'churn' || renewal.predicted_outcome === 'downgrade') && "border-l-4 border-l-red-500"
                    )}
                    onClick={() => setSelectedRenewal(renewal)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{companyName}</h3>
                            <Badge variant={renewal.predicted_outcome === 'churn' ? 'destructive' : 'secondary'}>
                              {renewal.status}
                            </Badge>
                            {renewal.predicted_outcome && (
                              <Badge variant="outline">
                                AI: {renewal.predicted_outcome}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              <span className="font-medium text-foreground">
                                {formatCurrency(mrr)}/mo
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{assigneeName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Last contact: {renewal.last_contact_date 
                                ? format(new Date(renewal.last_contact_date), 'MMM d')
                                : 'Never'
                              }</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Probability */}
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Probability</p>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={probability} 
                                className="w-20 h-2"
                              />
                              <span className={cn("font-bold", getProbabilityColor(probability))}>
                                {probability}%
                              </span>
                            </div>
                          </div>

                          {/* Days to Renewal */}
                          <div className={cn(
                            "px-4 py-2 rounded-lg text-center",
                            getUrgencyColor(daysToRenewal)
                          )}>
                            <p className="text-2xl font-bold">{daysToRenewal}</p>
                            <p className="text-xs">days</p>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLogActivity(renewal, 'call');
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLogActivity(renewal, 'email');
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePredict(renewal);
                              }}
                            >
                              <Target className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Renewal Calendar</CardTitle>
              <CardDescription>Visual timeline of upcoming renewals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Timeline visualization */}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  {filteredRenewals
                    .sort((a, b) => new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime())
                    .slice(0, 10)
                    .map((renewal) => {
                      const daysToRenewal = differenceInDays(new Date(renewal.renewal_date), new Date());
                      const companyName = renewal.company?.name || 'Unknown Company';
                      const mrr = renewal.current_mrr || 0;
                      
                      return (
                        <div key={renewal.id} className="relative pl-10 pb-6">
                          <div className={cn(
                            "absolute left-2 w-5 h-5 rounded-full border-2 border-background",
                            daysToRenewal <= 7 ? 'bg-red-500' :
                            daysToRenewal <= 30 ? 'bg-orange-500' :
                            daysToRenewal <= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          )} />
                          <div className="bg-card p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{companyName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(renewal.renewal_date), 'MMMM d, yyyy')} 
                                  {' '}• {formatCurrency(mrr)}/mo
                                </p>
                              </div>
                              <Badge variant={(renewal.predicted_outcome === 'churn' || renewal.predicted_outcome === 'downgrade') ? 'destructive' : 'outline'}>
                                {daysToRenewal} days
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Renewal Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Q4 Renewals</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-24" />
                      <span className="font-semibold text-green-500">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Expansion Rate</span>
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                      <span className="font-semibold">+12%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Avg. Days to Close</span>
                    <span className="font-semibold">23 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  AI Predictions Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700">Likely to Renew</span>
                    <span className="font-semibold text-green-600">
                      {renewals?.filter(r => (r.renewal_probability || 0) >= 70).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-700">Uncertain</span>
                    <span className="font-semibold text-yellow-600">
                      {renewals?.filter(r => {
                        const prob = r.renewal_probability || 0;
                        return prob >= 40 && prob < 70;
                      }).length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-red-700">At Risk</span>
                    <span className="font-semibold text-red-600">
                      {renewals?.filter(r => (r.renewal_probability || 0) < 40).length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
