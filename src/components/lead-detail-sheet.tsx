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
import {
  useLead,
  useUpdateLead,
  useLeadInteractions,
  useAddLeadInteraction,
} from "@/hooks/queries/leads";
import { useCampaigns } from "@/hooks/queries/campaigns";
import {
  X,
  Mail,
  Phone,
  Building,
  User,
  Calendar,
  Star,
  Edit,
  Save,
  MessageSquare,
  Plus,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { 
  LeadWithCampaignName, 
  LeadStatus, 
  AccountInteraction,
  NewAccountInteraction 
} from "@/types/database";

interface LeadDetailSheetProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  contacted: { label: "Contacted", variant: "default" as const },
  responded: { label: "Responded", variant: "outline" as const },
  converted: { label: "Converted", variant: "destructive" as const },
};

const interactionTypeConfig = {
  email: { label: "Email", icon: Mail },
  call: { label: "Call", icon: Phone },
  meeting: { label: "Meeting", icon: Calendar },
  note: { label: "Note", icon: MessageSquare },
};

export function LeadDetailSheet({ leadId, isOpen, onClose }: LeadDetailSheetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<LeadWithCampaignName>>({});
  const [newInteraction, setNewInteraction] = useState<Partial<NewAccountInteraction>>({});
  const [showAddInteraction, setShowAddInteraction] = useState(false);

  // API hooks
  const { data: lead, isLoading: leadLoading, error: leadError } = useLead(leadId || '');
  const { data: interactions, isLoading: interactionsLoading } = useLeadInteractions(leadId || '');
  const { data: campaignsData } = useCampaigns({}, 1, 100); // Get campaigns for dropdown
  const updateLead = useUpdateLead();
  const addInteraction = useAddLeadInteraction();

  const campaigns = campaignsData?.data || [];

  // Initialize edit data when lead loads
  useEffect(() => {
    if (lead && !isEditing) {
      setEditData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        company: lead.company || '',
        title: lead.title || '',
        status: lead.status,
        notes: lead.notes || '',
        score: lead.score || 0,
        campaignId: lead.campaignId || undefined,
      });
    }
  }, [lead, isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form
      if (lead) {
        setEditData({
          firstName: lead.firstName || '',
          lastName: lead.lastName || '',
          email: lead.email || '',
          company: lead.company || '',
          title: lead.title || '',
          status: lead.status,
          notes: lead.notes || '',
          score: lead.score || 0,
          campaignId: lead.campaignId || undefined,
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    if (!lead || !leadId) return;
    
    updateLead.mutate({
      id: leadId,
      data: editData,
    }, {
      onSuccess: () => {
        setIsEditing(false);
      }
    });
  };

  const handleAddInteraction = () => {
    if (!leadId || !newInteraction.type || !newInteraction.content) return;
    
    addInteraction.mutate({
      leadId,
      data: {
        type: newInteraction.type,
        content: newInteraction.content,
        timestamp: new Date(),
      } as NewAccountInteraction,
    }, {
      onSuccess: () => {
        setNewInteraction({});
        setShowAddInteraction(false);
      }
    });
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditData({});
    setNewInteraction({});
    setShowAddInteraction(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="min-w-full sm:min-w-[600px] lg:min-w-[700px] xl:w-[800px] 2xl:min-w-[900px] max-h-screen overflow-y-auto px-10 py-10">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Lead Details
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleEditToggle}
                    disabled={updateLead.isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateLead.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateLead.isPending ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEditToggle}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </SheetTitle>
          <SheetDescription>
            View and manage lead information and interaction history
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6">
            {/* Loading State */}
            {leadLoading && (
              <div className="space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            {/* Error State */}
            {leadError && (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Failed to load lead details. Please try again.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lead Information */}
            {lead && (
              <>
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        {isEditing ? (
                          <Input
                            id="firstName"
                            value={editData.firstName || ''}
                            onChange={(e) => setEditData(prev => ({...prev, firstName: e.target.value}))}
                          />
                        ) : (
                          <p className="text-sm">{lead.firstName || 'Not provided'}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        {isEditing ? (
                          <Input
                            id="lastName"
                            value={editData.lastName || ''}
                            onChange={(e) => setEditData(prev => ({...prev, lastName: e.target.value}))}
                          />
                        ) : (
                          <p className="text-sm">{lead.lastName || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData(prev => ({...prev, email: e.target.value}))}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">
                            {lead.email}
                          </a>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        {isEditing ? (
                          <Input
                            id="company"
                            value={editData.company || ''}
                            onChange={(e) => setEditData(prev => ({...prev, company: e.target.value}))}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{lead.company || 'Not provided'}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        {isEditing ? (
                          <Input
                            id="title"
                            value={editData.title || ''}
                            onChange={(e) => setEditData(prev => ({...prev, title: e.target.value}))}
                          />
                        ) : (
                          <p className="text-sm">{lead.title || 'Not provided'}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Status and Campaign */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lead Status & Campaign</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        {isEditing ? (
                          <Select 
                            value={editData.status || lead.status} 
                            onValueChange={(value) => setEditData(prev => ({...prev, status: value as LeadStatus}))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="responded">Responded</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={statusConfig[lead.status].variant}>
                            {statusConfig[lead.status].label}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="score">Score</Label>
                        {isEditing ? (
                          <Input
                            id="score"
                            type="number"
                            min="0"
                            max="100"
                            value={editData.score || 0}
                            onChange={(e) => setEditData(prev => ({...prev, score: parseInt(e.target.value) || 0}))}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{lead.score || 0}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="campaign">Campaign</Label>
                      {isEditing ? (
                        <Select 
                          value={editData.campaignId || lead.campaignId || ''} 
                          onValueChange={(value) => setEditData(prev => ({...prev, campaignId: value === "none" ? undefined : value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No campaign</SelectItem>
                            {campaigns.map((campaign) => (
                              <SelectItem key={campaign.id} value={campaign.id}>
                                {campaign.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">
                          {(lead as { campaignName?: string }).campaignName || 'No campaign assigned'}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastContacted">Last Contacted</Label>
                      <p className="text-sm text-muted-foreground">
                        {lead.lastContactedAt 
                          ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true })
                          : 'Never contacted'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        placeholder="Add notes about this lead..."
                        value={editData.notes || ''}
                        onChange={(e) => setEditData(prev => ({...prev, notes: e.target.value}))}
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">
                        {lead.notes || 'No notes added yet.'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Interaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Interaction History
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowAddInteraction(!showAddInteraction)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Interaction
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add New Interaction Form */}
                    {showAddInteraction && (
                      <Card className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <Select 
                              value={newInteraction.type || ''} 
                              onValueChange={(value) => setNewInteraction(prev => ({...prev, type: value}))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select interaction type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="call">Call</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="note">Note</SelectItem>
                              </SelectContent>
                            </Select>
                            <Textarea
                              placeholder="Describe the interaction..."
                              value={newInteraction.content || ''}
                              onChange={(e) => setNewInteraction(prev => ({...prev, content: e.target.value}))}
                              rows={3}
                            />
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => setShowAddInteraction(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={handleAddInteraction}
                                disabled={!newInteraction.type || !newInteraction.content || addInteraction.isPending}
                              >
                                {addInteraction.isPending ? "Adding..." : "Add Interaction"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interactions List */}
                    {interactionsLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))}
                      </div>
                    ) : interactions && interactions.length > 0 ? (
                      <div className="space-y-3">
                        {interactions.map((interaction: AccountInteraction) => {
                          const InteractionIcon = interactionTypeConfig[interaction.type as keyof typeof interactionTypeConfig]?.icon || MessageSquare;
                          return (
                            <Card key={interaction.id} className="bg-muted/30">
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                  <InteractionIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline" className="text-xs">
                                        {interactionTypeConfig[interaction.type as keyof typeof interactionTypeConfig]?.label || interaction.type}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(interaction.timestamp), 'MMM d, yyyy h:mm a')}
                                      </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{interaction.content}</p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No interactions recorded yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{format(new Date(lead.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{format(new Date(lead.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
