"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useInfiniteCampaigns, useDeleteCampaign, useBulkDeleteCampaigns, useBulkUpdateCampaigns } from "@/hooks/queries/campaigns";
import { CampaignDetailSheet } from "@/components/campaign-detail-sheet";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Edit,
  Play,
  Pause,
  Check,
  Trash2,
  X,
  Target,
  Users,
  TrendingUp,
  Eye,
  Copy,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Campaign, CampaignStatus } from "@/types/database";

// Status configuration for consistent styling
const statusConfig = {
  draft: { label: "Draft", variant: "secondary" as const, icon: Edit },
  active: { label: "Active", variant: "default" as const, icon: Play },
  paused: { label: "Paused", variant: "outline" as const, icon: Pause },
  completed: { label: "Completed", variant: "destructive" as const, icon: Check },
  deleted: { label: "Deleted", variant: "secondary" as const, icon: Trash2 },
};

interface CampaignsTableProps {
  onEditCampaign?: (campaign: Campaign) => void;
  onViewCampaign?: (campaign: Campaign) => void;
}

export function CampaignsTable({ onEditCampaign, onViewCampaign }: CampaignsTableProps) {
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "name">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // State for bulk operations
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<"" | "update-status" | "delete">("");
  const [bulkStatus, setBulkStatus] = useState<CampaignStatus>("draft");

  // State for campaign detail sheet (when we build it)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  // UI Store
  const { setCreateCampaignOpen } = useUIStore();

  // API hooks
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCampaigns({
    search: searchTerm,
    status: statusFilter === "all" ? undefined : statusFilter,
    sortBy,
    sortOrder,
  });

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const bulkUpdate = useBulkUpdateCampaigns();
  const bulkDelete = useBulkDeleteCampaigns();
  const deleteCampaign = useDeleteCampaign();

  // Flatten all pages of data
  const allCampaigns = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.data || []);
  }, [data]);

  // Calculate campaign statistics
  const campaignStats = useMemo(() => {
    return allCampaigns.reduce((stats, campaign) => {
      stats.total++;
      stats[campaign.status]++;
      if (campaign.status === 'active') {
        stats.totalLeads += (campaign as { leadCount?: number }).leadCount || 0;
        stats.totalConversions += (campaign as { conversionCount?: number }).conversionCount || 0;
      }
      return stats;
    }, {
      total: 0,
      draft: 0,
      active: 0,
      paused: 0,
      completed: 0,
      deleted: 0,
      totalLeads: 0,
      totalConversions: 0,
    });
  }, [allCampaigns]);

  // Bulk operations handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(allCampaigns.map(campaign => campaign.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  const handleBulkAction = () => {
    if (selectedCampaigns.length === 0) return;

    if (bulkAction === "update-status") {
      bulkUpdate.mutate(
        {
          ids: selectedCampaigns,
          data: { status: bulkStatus },
        },
        {
          onSuccess: () => {
            setSelectedCampaigns([]);
            setBulkAction("");
          },
        }
      );
    } else if (bulkAction === "delete") {
      bulkDelete.mutate(selectedCampaigns, {
        onSuccess: () => {
          setSelectedCampaigns([]);
          setBulkAction("");
        },
      });
    }
  };

  // Campaign detail handlers
  const handleViewDetails = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsDetailSheetOpen(true);
  };

  const handleCloseDetailSheet = () => {
    setSelectedCampaignId(null);
    setIsDetailSheetOpen(false);
  };

  // Sort handler
  const handleSort = (column: "createdAt" | "updatedAt" | "name") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Campaign action handlers
  const handleDuplicateCampaign = (campaign: Campaign) => {
    // TODO: Implement campaign duplication
    console.log("Duplicating campaign:", campaign.name);
  };

  const handlePauseCampaign = (campaignId: string) => {
    bulkUpdate.mutate({
      ids: [campaignId],
      data: { status: "paused" },
    });
  };

  const handleActivateCampaign = (campaignId: string) => {
    bulkUpdate.mutate({
      ids: [campaignId],
      data: { status: "active" },
    });
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm("Are you sure you want to delete this campaign? This action cannot be undone.")) {
      deleteCampaign.mutate(campaignId);
    }
  };

  const isAllSelected = selectedCampaigns.length === allCampaigns.length && allCampaigns.length > 0;
  const isSomeSelected = selectedCampaigns.length > 0 && selectedCampaigns.length < allCampaigns.length;

  return (
    <div className="space-y-6">
      {/* Campaign Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-2xl font-bold">{campaignStats.total}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-600">{campaignStats.active}</p>
              </div>
              <Play className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold">{campaignStats.totalLeads}</p>
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
                <p className="text-2xl font-bold text-blue-600">{campaignStats.totalConversions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Management
            </div>
            <Button onClick={() => setCreateCampaignOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search campaigns by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CampaignStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-') as [typeof sortBy, typeof sortOrder];
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="updatedAt-desc">Recently Updated</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedCampaigns.length} campaign{selectedCampaigns.length === 1 ? '' : 's'} selected
                </span>
                <Select value={bulkAction} onValueChange={(value) => setBulkAction(value as typeof bulkAction)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Bulk action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="update-status">Update Status</SelectItem>
                    <SelectItem value="delete">Delete Campaigns</SelectItem>
                  </SelectContent>
                </Select>
                {bulkAction === "update-status" && (
                  <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as CampaignStatus)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedCampaigns([])}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Selection
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleBulkAction}
                  disabled={!bulkAction || bulkUpdate.isPending || bulkDelete.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {bulkUpdate.isPending || bulkDelete.isPending ? "Processing..." : "Apply"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all campaigns"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer" 
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Campaign
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Performance</TableHead>
                <TableHead className="hidden md:table-cell">Leads</TableHead>
                <TableHead className="hidden lg:table-cell">Start Date</TableHead>
                <TableHead 
                  className="cursor-pointer hidden xl:table-cell" 
                  onClick={() => handleSort("updatedAt")}
                >
                  <div className="flex items-center gap-1">
                    Last Updated
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Failed to load campaigns. Please try again.
                  </div>
                </TableCell>
              </TableRow>
            ) : allCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm || statusFilter !== "all" 
                      ? "No campaigns match your filters." 
                      : "No campaigns found. Create your first campaign to get started."}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              allCampaigns.map((campaign: Campaign) => {
                const StatusIcon = statusConfig[campaign.status]?.icon || Edit;
                const campaignWithMetrics = campaign as Campaign & { leadCount?: number; conversionCount?: number };
                const conversionRate = campaignWithMetrics.leadCount && campaignWithMetrics.leadCount > 0 
                  ? ((campaignWithMetrics.conversionCount || 0) / campaignWithMetrics.leadCount) * 100 
                  : 0;
                
                return (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCampaigns.includes(campaign.id)}
                        onCheckedChange={(checked) => handleSelectCampaign(campaign.id, checked as boolean)}
                        aria-label={`Select campaign ${campaign.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{campaign.name}</div>
                        {campaign.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {campaign.description}
                          </div>
                        )}
                        {/* Mobile-only info */}
                        <div className="sm:hidden mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <Progress value={conversionRate} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">
                              {conversionRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="md:hidden flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{campaignWithMetrics.leadCount || 0} leads</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[campaign.status]?.variant || "secondary"} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[campaign.status]?.label || campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress value={conversionRate} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">
                            {conversionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {campaignWithMetrics.conversionCount || 0} conversions
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {campaignWithMetrics.leadCount || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {(campaignWithMetrics as unknown as { startDate?: string }).startDate 
                          ? format(new Date((campaignWithMetrics as unknown as { startDate: string }).startDate), 'MMM d, yyyy')
                          : 'Not set'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(campaign.updatedAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(campaign.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditCampaign?.(campaign)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateCampaign(campaign)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {campaign.status === 'active' ? (
                            <DropdownMenuItem onClick={() => handlePauseCampaign(campaign.id)}>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause Campaign
                            </DropdownMenuItem>
                          ) : campaign.status === 'paused' && (
                            <DropdownMenuItem onClick={() => handleActivateCampaign(campaign.id)}>
                              <Play className="mr-2 h-4 w-4" />
                              Activate Campaign
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>

        {/* Load More Button */}
          {hasNextPage && (
            <>
              <div ref={loadMoreRef} className="h-8" />
              <div className="p-4 text-center border-t">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading..." : "Load More Campaigns"}
                </Button>
              </div>
            </>
          )}
      </Card>

      {/* Campaign Detail Sheet */}
      <CampaignDetailSheet
        campaignId={selectedCampaignId}
        isOpen={isDetailSheetOpen}
        onClose={handleCloseDetailSheet}
      />
    </div>
  );
}
