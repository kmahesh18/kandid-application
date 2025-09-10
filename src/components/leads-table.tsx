"use client";

import { useState, useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
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
  Checkbox,
} from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadDetailSheet } from "@/components/lead-detail-sheet";
import { useFilterStore } from "@/store/filter-store";
import { usePaginationStore } from "@/store/pagination-store";
import { useUIStore } from "@/store/ui-store";
import {
  useInfiniteLeads,
  useDeleteLead,
  useBulkDeleteLeads,
  useBulkUpdateLeads,
} from "@/hooks/queries/leads";
import { useCampaigns } from "@/hooks/queries/campaigns";
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Filter,
  Download,
  Users,
  Mail,
  Building,
  Star,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Lead, LeadFilters, LeadStatus, LeadWithCampaignName } from "@/types/database";

interface LeadsTableProps {
  onCreateLead?: () => void;
  onEditLead?: (lead: LeadWithCampaignName) => void;
  onViewLead?: (lead: LeadWithCampaignName) => void;
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  contacted: { label: "Contacted", variant: "default" as const },
  responded: { label: "Responded", variant: "outline" as const },
  converted: { label: "Converted", variant: "destructive" as const },
};

export function LeadsTable({ onCreateLead, onEditLead, onViewLead }: LeadsTableProps) {
  const [sortBy, setSortBy] = useState<LeadFilters['sortBy']>('createdAt');
  const [sortOrder, setSortOrder] = useState<LeadFilters['sortOrder']>('desc');
  
  // Lead detail sheet state
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  
  // Store hooks
  const { 
    leadSearch, 
    setLeadSearch, 
    leadFilters,
    setLeadFilters,
    selectedLeads,
    setSelectedLeads,
    clearLeadSelection 
  } = useFilterStore();
  
  const { 
    leadPage, 
    leadPageSize, 
    setLeadPagination,
    isLoadingMore,
    setIsLoadingMore 
  } = usePaginationStore();
  
  const { setCreateLeadOpen } = useUIStore();

  // API hooks - Use infinite query for infinite scroll
  const filters: LeadFilters = {
    ...leadFilters,
    search: leadSearch,
    sortBy,
    sortOrder,
  };

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteLeads(filters, leadPageSize);
  
  const deleteLead = useDeleteLead();
  const bulkDeleteLeads = useBulkDeleteLeads();
  const bulkUpdateLeads = useBulkUpdateLeads();

  // Get campaigns for bulk assignment
  const { data: campaignsData } = useCampaigns({}, 1, 100);
  const campaigns = campaignsData?.data || [];

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

  // Flatten all pages of leads into a single array
  const leads = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.total || 0;

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  // Sorting
  const handleSort = (field: LeadFilters['sortBy']) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Actions
  const handleDeleteLead = (leadId: string) => {
    if (confirm("Are you sure you want to delete this lead? This action cannot be undone.")) {
      deleteLead.mutate(leadId);
    }
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}? This action cannot be undone.`)) {
      bulkDeleteLeads.mutate(selectedLeads);
      clearLeadSelection();
    }
  };

  const handleBulkStatusUpdate = (newStatus: LeadStatus) => {
    if (selectedLeads.length === 0) return;
    
    bulkUpdateLeads.mutate({
      ids: selectedLeads,
      data: { status: newStatus },
    });
    clearLeadSelection();
  };

  const handleBulkCampaignAssignment = (campaignId: string) => {
    if (selectedLeads.length === 0) return;
    
    bulkUpdateLeads.mutate({
      ids: selectedLeads,
      data: { campaignId: campaignId || undefined },
    });
    clearLeadSelection();
  };

  const handleStatusFilter = (status: string) => {
    if (status === "all") {
      setLeadFilters({ status: undefined });
    } else {
      setLeadFilters({ status: [status as LeadStatus] });
    }
  };

  const handleCampaignFilter = (campaignId: string) => {
    if (campaignId === "all") {
      setLeadFilters({ campaignId: undefined });
    } else if (campaignId === "none") {
      setLeadFilters({ campaignId: "none" });
    } else {
      setLeadFilters({ campaignId });
    }
  };

  // Lead detail sheet handlers
  const handleViewDetails = (leadId: string) => {
    setSelectedLeadId(leadId);
    setIsDetailSheetOpen(true);
  };

  const handleCloseDetailSheet = () => {
    setSelectedLeadId(null);
    setIsDetailSheetOpen(false);
  };

  const handleCreateLead = () => {
    if (onCreateLead) {
      onCreateLead();
    } else {
      setCreateLeadOpen(true);
    }
  };

  const handleViewLead = (lead: LeadWithCampaignName) => {
    if (onViewLead) {
      onViewLead(lead);
    }
  };

  const handleLoadMore = async () => {
    if (hasNextPage && !isFetchingNextPage) {
      setIsLoadingMore(true);
      await fetchNextPage();
      setIsLoadingMore(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load leads. Please try again.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card className="shadow-lg border-muted-foreground/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads ({totalCount})
          </CardTitle>
          <Button 
            onClick={handleCreateLead}
            className="shadow-md hover:shadow-lg transition-all duration-200 bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Lead
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search leads by name, email, company..."
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              className="pl-10 shadow-sm border-muted-foreground/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select 
              value={leadFilters.status?.[0] || "all"} 
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-40 shadow-sm border-muted-foreground/20">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            value={leadFilters.campaignId || "all"} 
            onValueChange={handleCampaignFilter}
          >
            <SelectTrigger className="w-48 shadow-sm border-muted-foreground/20">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              <SelectItem value="none">No Campaign</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedLeads.length > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('pending')}>
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('contacted')}>
                    Mark as Contacted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('responded')}>
                    Mark as Responded
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusUpdate('converted')}>
                    Mark as Converted
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Assign Campaign
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkCampaignAssignment('')}>
                    Remove from Campaign
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {campaigns.map((campaign) => (
                    <DropdownMenuItem 
                      key={campaign.id}
                      onClick={() => handleBulkCampaignAssignment(campaign.id)}
                    >
                      {campaign.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={bulkDeleteLeads.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Contact
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 hidden sm:table-cell"
                    onClick={() => handleSort('company')}
                  >
                    <div className="flex items-center gap-2">
                      Company
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Campaign</TableHead>
                  <TableHead className="hidden lg:table-cell">Score</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 hidden lg:table-cell"
                    onClick={() => handleSort('lastContactedAt')}
                  >
                    <div className="flex items-center gap-2">
                      Last Contact
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 hidden xl:table-cell"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Created
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Mail className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button variant="outline" onClick={handleCreateLead}>
                        Create your first lead
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <div className="font-medium truncate">
                          {lead.firstName || lead.lastName 
                            ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                            : 'No name'}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                        {lead.title && (
                          <div className="text-xs text-muted-foreground truncate">
                            {lead.title}
                          </div>
                        )}
                        {/* Mobile-only info */}
                        <div className="sm:hidden mt-1 space-y-1">
                          {lead.company && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          )}
                          <div className="md:hidden flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {lead.campaignName || "No campaign"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {lead.company ? (
                          <>
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">{lead.company}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">No company</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[lead.status].variant}>
                        {statusConfig[lead.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm text-muted-foreground truncate">
                        {lead.campaignName || "No campaign"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{lead.score || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {lead.lastContactedAt 
                          ? formatDistanceToNow(new Date(lead.lastContactedAt), { addSuffix: true })
                          : "Never"}
                      </span>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(lead.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedLeadId(lead.id);
                            setIsDetailSheetOpen(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteLead(lead.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* Load More Button for Infinite Scroll */}
        {hasNextPage && (
          <>
            <div ref={loadMoreRef} className="h-8" />
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage || isLoadingMore}
              >
                {isFetchingNextPage || isLoadingMore ? "Loading..." : "Load More"}
              </Button>
            </div>
          </>
        )}

        {/* Summary */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {leads.length} of {totalCount} leads
              {hasNextPage && " (scroll down or click Load More for more)"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Lead Detail Sheet */}
    <LeadDetailSheet
      leadId={selectedLeadId}
      isOpen={isDetailSheetOpen}
      onClose={handleCloseDetailSheet}
    />
    </>
  );
}
