"use client";

import { useCreateCampaign } from "@/hooks/queries";
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
import { Target, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import type { CampaignStatus } from "@/types/database";

export function CreateCampaignSheet() {
  const { isCreateCampaignOpen, setCreateCampaignOpen } = useUIStore();
  const createCampaign = useCreateCampaign();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as CampaignStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Campaign name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Campaign name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Campaign name must be less than 100 characters";
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await createCampaign.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        status: formData.status,
      });
      
      // Reset form
      setFormData({ name: "", description: "", status: "draft" });
      setErrors({});
      setCreateCampaignOpen(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", status: "draft" });
    setErrors({});
    setCreateCampaignOpen(false);
  };

  const statusConfig = {
    draft: { label: "Draft", description: "Save for later editing", color: "bg-yellow-100 text-yellow-800" },
    active: { label: "Active", description: "Start campaign immediately", color: "bg-green-100 text-green-800" },
    paused: { label: "Paused", description: "Create but keep inactive", color: "bg-orange-100 text-orange-800" },
    completed: { label: "Completed", description: "Archive this campaign", color: "bg-blue-100 text-blue-800" },
  };

  return (
    <Sheet open={isCreateCampaignOpen} onOpenChange={setCreateCampaignOpen}>
      <SheetContent className="min-w-full sm:min-w-[600px] lg:min-w-[700px] xl:w-[800px] 2xl:min-w-[900px] max-h-screen overflow-y-auto px-10 py-10">
        <SheetHeader className="pb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-xl">Create New Campaign</SheetTitle>
              <SheetDescription className="text-sm">
                Set up a new lead generation campaign with detailed information.
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
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-blue-700 space-y-1">
              <p>• Use descriptive names to easily identify campaigns</p>
              <p>• Include target audience and goals in description</p>
              <p>• Start with &quot;Draft&quot; status to review before activation</p>
            </CardContent>
          </Card>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                Campaign Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Q1 Lead Generation - Tech Startups"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`h-11 ${errors.name ? 'border-destructive focus:border-destructive' : ''}`}
              />
              {errors.name && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.name}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formData.name.length}/100 characters
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
                <span className="text-muted-foreground font-normal"> (Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your campaign goals, target audience, and strategy...&#10;&#10;Example:&#10;• Target: B2B SaaS companies (50-200 employees)&#10;• Goal: Generate 100 qualified leads&#10;• Focus: Decision makers in tech departments"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`resize-none ${errors.description ? 'border-destructive focus:border-destructive' : ''}`}
              />
              {errors.description && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {errors.description}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </div>
            </div>

            <Separator />

            {/* Initial Status */}
            <div className="space-y-3">
              <Label htmlFor="status" className="text-sm font-medium">
                Initial Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: CampaignStatus) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select initial status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(statusConfig).map(([value, config]) => (
                    <SelectItem key={value} value={value} className="py-3">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-sm">{config.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                You can change this status later from the campaigns page
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createCampaign.isPending}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCampaign.isPending || !formData.name.trim()}
                className="flex-1 h-11"
              >
                {createCampaign.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Create Campaign
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
