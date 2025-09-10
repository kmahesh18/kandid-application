"use client";

import { useCreateLead } from "@/hooks/queries";
import { useCampaigns } from "@/hooks/queries/campaigns";
import { useUIStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { Users, AlertCircle, CheckCircle, Star, Building, Mail, User, Target, Lightbulb } from "lucide-react";
import type { LeadStatus } from "@/types/database";

// Type for creating lead from frontend (without userId)
type CreateLeadData = {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  title?: string;
  status?: LeadStatus;
  notes?: string;
  campaignId?: string;
};

export function CreateLeadSheet() {
  const { isCreateLeadOpen, setCreateLeadOpen } = useUIStore();
  const createLead = useCreateLead();
  const { data: campaignsData } = useCampaigns({}, 1, 50);
  const campaigns = campaignsData?.data || [];

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    title: "",
    status: "pending" as LeadStatus,
    notes: "",
    score: 0,
    campaignId: "none",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }
    
    if (formData.lastName && formData.lastName.length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }
    
    if (formData.company && formData.company.length < 2) {
      newErrors.company = "Company name must be at least 2 characters";
    }
    
    if (formData.score < 0 || formData.score > 100) {
      newErrors.score = "Lead score must be between 0 and 100";
    }
    
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = "Notes must be less than 500 characters";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await createLead.mutateAsync({
        email: formData.email.trim(),
        firstName: formData.firstName.trim() || undefined,
        lastName: formData.lastName.trim() || undefined,
        company: formData.company.trim() || undefined,
        title: formData.title.trim() || undefined,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        campaignId: formData.campaignId === "none" ? undefined : formData.campaignId,
      });
      
      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        title: "",
        status: "pending",
        notes: "",
        score: 0,
        campaignId: "none",
      });
      setErrors({});
      setCreateLeadOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      title: "",
      status: "pending",
      notes: "",
      score: 0,
      campaignId: "none",
    });
    setErrors({});
    setCreateLeadOpen(false);
  };

  const statusConfig = {
    pending: { label: "Pending", description: "New lead, not yet contacted", color: "bg-yellow-100 text-yellow-800", icon: User },
    contacted: { label: "Contacted", description: "Initial outreach completed", color: "bg-blue-100 text-blue-800", icon: Mail },
    responded: { label: "Responded", description: "Lead has engaged back", color: "bg-purple-100 text-purple-800", icon: CheckCircle },
    converted: { label: "Converted", description: "Successfully converted to customer", color: "bg-green-100 text-green-800", icon: Target },
  };

  return (
    <Sheet open={isCreateLeadOpen} onOpenChange={setCreateLeadOpen}>
      <SheetContent className="min-w-full sm:min-w-[600px] lg:min-w-[700px] xl:w-[800px] 2xl:min-w-[900px] max-h-screen overflow-y-auto px-10 py-10">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <SheetTitle className="text-xl">Add New Lead</SheetTitle>
              <SheetDescription className="text-sm">
                Enter lead details to add them to your pipeline and start tracking.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Quick Tips Card */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-700 space-y-1">
              <p>• Verify email addresses to ensure deliverability</p>
              <p>• Include company and title for better lead scoring</p>
              <p>• Add detailed notes about lead source and context</p>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g., John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`h-10 ${errors.firstName ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.firstName && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="e.g., Smith"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`h-10 ${errors.lastName ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.lastName && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.smith@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`h-10 pl-10 ${errors.email ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                </div>
                {errors.email && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Professional Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Professional Information</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium">
                    Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="e.g., Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className={`h-10 ${errors.company ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.company && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.company}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Job Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Marketing Director"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Lead Management */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Lead Management</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: LeadStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([value, config]) => {
                        const IconComponent = config.icon;
                        return (
                          <SelectItem key={value} value={value} className="py-3">
                            <div className="flex items-center gap-3">
                              <IconComponent className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span className="font-medium">{config.label}</span>
                                <span className="text-xs text-muted-foreground">{config.description}</span>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score" className="text-sm font-medium flex items-center gap-2">
                    Lead Score
                    <Star className="h-3 w-3 text-yellow-500" />
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    value={formData.score || ""}
                    onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                    className={`h-10 ${errors.score ? 'border-destructive focus:border-destructive' : ''}`}
                  />
                  {errors.score && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {errors.score}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Score from 0 (low quality) to 100 (high quality)
                  </div>
                </div>
              </div>

              {/* Campaign Assignment */}
              {campaigns.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="campaign" className="text-sm font-medium">
                    Assign to Campaign
                    <span className="text-muted-foreground font-normal"> (Optional)</span>
                  </Label>
                  <Select 
                    value={formData.campaignId} 
                    onValueChange={(value) => setFormData({ ...formData, campaignId: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No campaign</SelectItem>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{campaign.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {campaign.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes
                  <span className="text-muted-foreground font-normal"> (Optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes about this lead...&#10;&#10;Examples:&#10;• Lead source (LinkedIn, referral, website)&#10;• Specific interests or pain points&#10;• Best time to contact&#10;• Previous interactions"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`resize-none ${errors.notes ? 'border-destructive focus:border-destructive' : ''}`}
                />
                {errors.notes && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.notes}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {formData.notes.length}/500 characters
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createLead.isPending}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLead.isPending || !formData.email.trim() || !formData.firstName.trim()}
                className="flex-1 h-11"
              >
                {createLead.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Adding Lead...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Add Lead
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
