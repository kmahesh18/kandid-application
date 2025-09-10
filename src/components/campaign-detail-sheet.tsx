"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Button
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Label,
} from "@/components/ui/label";
import {
  Textarea,
} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge,
} from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Separator,
} from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AssignLeadsToCampaignSheet } from "@/components/assign-leads-to-campaign-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  useCampaign,
  useUpdateCampaign,
} from "@/hooks/queries/campaigns";
import { useUpdateLead } from "@/hooks/queries/leads";
import {
  X,
  Target,
  Users,
  Calendar,
  TrendingUp,
  Edit,
  Save,
  Play,
  Pause,
  BarChart3,
  Mail,
  Phone,
  MessageSquare,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  UserMinus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { 
  CampaignWithLeads, 
  CampaignStatus, 
  Lead,
  LeadStatus 
} from "@/types/database";

interface CampaignDetailSheetProps {
  campaignId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Edit },
  active: { label: "Active", variant: "default" as const, icon: Play },
  paused: { label: "Paused", variant: "outline" as const, icon: Pause },
  completed: { label: "Completed", variant: "destructive" as const, icon: CheckCircle },
  deleted: { label: "Deleted", variant: "secondary" as const, icon: X },
};

const leadStatusConfig = {
  pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
  contacted: { label: "Contacted", variant: "default" as const, icon: Mail },
  responded: { label: "Responded", variant: "outline" as const, icon: MessageSquare },
  converted: { label: "Converted", variant: "destructive" as const, icon: Award },
};

export function CampaignDetailSheet({ campaignId, isOpen, onClose }: CampaignDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAssignLeadsOpen, setIsAssignLeadsOpen] = useState(false);
  const [editData, setEditData] = useState<Partial<CampaignWithLeads>>({});
  const [activeTab, setActiveTab] = useState("overview");

  // API hooks
  const { data: campaign, isLoading } = useCampaign(campaignId || '');
  const updateCampaign = useUpdateCampaign();
  const updateLead = useUpdateLead();  // Initialize edit data when campaign loads
  useEffect(() => {
    if (campaign && !isEditing) {
      setEditData({
        name: campaign.name || '',
        description: campaign.description || '',
        status: campaign.status,
      });
    }
  }, [campaign, isEditing]);

  // Calculate campaign analytics
  const campaignAnalytics = {
    totalLeads: campaign?.leads?.length || 0,
    pendingLeads: campaign?.leads?.filter(l => l.status === 'pending').length || 0,
    contactedLeads: campaign?.leads?.filter(l => l.status === 'contacted').length || 0,
    respondedLeads: campaign?.leads?.filter(l => l.status === 'responded').length || 0,
    convertedLeads: campaign?.leads?.filter(l => l.status === 'converted').length || 0,
    conversionRate: 0,
    responseRate: 0,
    avgScore: 0,
  };

  if (campaignAnalytics.totalLeads > 0) {
    campaignAnalytics.conversionRate = (campaignAnalytics.convertedLeads / campaignAnalytics.totalLeads) * 100;
    campaignAnalytics.responseRate = (campaignAnalytics.respondedLeads / campaignAnalytics.totalLeads) * 100;
    const totalScore = campaign?.leads?.reduce((sum, lead) => sum + (lead.score || 0), 0) || 0;
    campaignAnalytics.avgScore = totalScore / campaignAnalytics.totalLeads;
  }

  const handleSave = () => {
    if (!campaignId || !editData.name) return;

    updateCampaign.mutate(
      {
        id: campaignId,
        data: {
          name: editData.name,
          description: editData.description,
          status: editData.status,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (campaign) {
      setEditData({
        name: campaign.name || '',
        description: campaign.description || '',
        status: campaign.status,
      });
    }
  };

  const handleRemoveLeadFromCampaign = (leadId: string) => {
    if (confirm("Are you sure you want to remove this lead from the campaign?")) {
      updateLead.mutate({
        id: leadId,
        data: { campaignId: undefined }
      });
    }
  };

  const handleStatusChange = (newStatus: CampaignStatus) => {
    if (!campaignId) return;
    
    updateCampaign.mutate({
      id: campaignId,
      data: { status: newStatus },
    });
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="min-w-full sm:min-w-[600px] lg:min-w-[700px] xl:w-[800px] 2xl:min-w-[900px] max-h-screen overflow-y-auto px-10 py-10">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <SheetTitle>Campaign Details</SheetTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : !campaign ? (
            <div className="text-destructive">Failed to load campaign details</div>
          ) : campaign && (
            <div className="space-y-4">
              {/* Campaign Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  {isEditing ? (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="campaign-name">Campaign Name</Label>
                        <Input
                          id="campaign-name"
                          value={editData.name || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter campaign name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaign-description">Description</Label>
                        <Textarea
                          id="campaign-description"
                          value={editData.description || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter campaign description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="campaign-status">Status</Label>
                        <Select 
                          value={editData.status} 
                          onValueChange={(value) => setEditData(prev => ({ ...prev, status: value as CampaignStatus }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">{campaign.name}</h2>
                        <Badge variant={statusConfig[campaign.status]?.variant || "secondary"} className="gap-1">
                          {(() => {
                            const StatusIcon = statusConfig[campaign.status]?.icon;
                            return StatusIcon ? <StatusIcon className="h-3 w-3" /> : null;
                          })()}
                          {statusConfig[campaign.status]?.label || campaign.status}
                        </Badge>
                      </div>
                      {campaign.description && (
                        <p className="text-muted-foreground">{campaign.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Updated {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSave}
                        disabled={updateCampaign.isPending || !editData.name}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateCampaign.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Campaign
                    </Button>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              {!isEditing && (
                <div className="flex gap-2">
                  {campaign.status === 'draft' && (
                    <Button size="sm" onClick={() => handleStatusChange('active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Activate Campaign
                    </Button>
                  )}
                  {campaign.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('paused')}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Campaign
                    </Button>
                  )}
                  {campaign.status === 'paused' && (
                    <Button size="sm" onClick={() => handleStatusChange('active')}>
                      <Play className="h-4 w-4 mr-2" />
                      Resume Campaign
                    </Button>
                  )}
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange('completed')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetHeader>

        {campaign && !isEditing && (
          <div className="mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="leads">Leads ({campaignAnalytics.totalLeads})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Leads</p>
                          <p className="text-2xl font-bold">{campaignAnalytics.totalLeads}</p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversions</p>
                          <p className="text-2xl font-bold text-green-600">{campaignAnalytics.convertedLeads}</p>
                        </div>
                        <Award className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                          <p className="text-2xl font-bold text-blue-600">{campaignAnalytics.conversionRate.toFixed(1)}%</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Score</p>
                          <p className="text-2xl font-bold">{campaignAnalytics.avgScore.toFixed(1)}</p>
                        </div>
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Lead Status Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Lead Status Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Pending</span>
                          <Badge variant="secondary">{campaignAnalytics.pendingLeads}</Badge>
                        </div>
                        <Progress 
                          value={campaignAnalytics.totalLeads > 0 ? (campaignAnalytics.pendingLeads / campaignAnalytics.totalLeads) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Contacted</span>
                          <Badge variant="default">{campaignAnalytics.contactedLeads}</Badge>
                        </div>
                        <Progress 
                          value={campaignAnalytics.totalLeads > 0 ? (campaignAnalytics.contactedLeads / campaignAnalytics.totalLeads) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Responded</span>
                          <Badge variant="outline">{campaignAnalytics.respondedLeads}</Badge>
                        </div>
                        <Progress 
                          value={campaignAnalytics.totalLeads > 0 ? (campaignAnalytics.respondedLeads / campaignAnalytics.totalLeads) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Converted</span>
                          <Badge variant="destructive">{campaignAnalytics.convertedLeads}</Badge>
                        </div>
                        <Progress 
                          value={campaignAnalytics.totalLeads > 0 ? (campaignAnalytics.convertedLeads / campaignAnalytics.totalLeads) * 100 : 0} 
                          className="h-2" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Performance Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Response Rate</span>
                          <span className="text-sm text-muted-foreground">{campaignAnalytics.responseRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={campaignAnalytics.responseRate} className="h-3" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Conversion Rate</span>
                          <span className="text-sm text-muted-foreground">{campaignAnalytics.conversionRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={campaignAnalytics.conversionRate} className="h-3" />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Lead Quality Distribution</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {campaign.leads?.filter(l => (l.score || 0) >= 80).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">High Quality (80+)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {campaign.leads?.filter(l => (l.score || 0) >= 50 && (l.score || 0) < 80).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Medium Quality (50-79)</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {campaign.leads?.filter(l => (l.score || 0) < 50).length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Low Quality (&lt;50)</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leads" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Campaign Leads
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsAssignLeadsOpen(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Assign Leads
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {campaign.leads && campaign.leads.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {campaign.leads.map((lead: Lead) => (
                            <TableRow key={lead.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {lead.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={leadStatusConfig[lead.status]?.variant || "secondary"} className="gap-1">
                                  {(() => {
                                    const LeadStatusIcon = leadStatusConfig[lead.status]?.icon;
                                    return LeadStatusIcon ? <LeadStatusIcon className="h-3 w-3" /> : null;
                                  })()}
                                  {leadStatusConfig[lead.status]?.label || lead.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={lead.score || 0} className="w-16 h-2" />
                                  <span className="text-sm font-medium">{lead.score || 0}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {lead.company || 'N/A'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm text-muted-foreground">
                                  {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveLeadFromCampaign(lead.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <UserMinus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No leads assigned</h3>
                        <p className="text-muted-foreground mb-4">
                          This campaign does not have any leads assigned yet.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => setIsAssignLeadsOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Leads
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>

      {/* Assign Leads Sheet */}
      <AssignLeadsToCampaignSheet
        campaignId={campaignId}
        campaignName={campaign?.name || null}
        isOpen={isAssignLeadsOpen}
        onClose={() => setIsAssignLeadsOpen(false)}
      />
    </Sheet>
  );
}
