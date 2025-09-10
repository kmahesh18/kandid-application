"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInfiniteLeads, useBulkUpdateLeads } from "@/hooks/queries/leads";
import { useFilterStore } from "@/store/filter-store";
import {
  Search,
  Filter,
  Users,
  Mail,
  Building,
  Star,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { LeadWithCampaignName, LeadStatus, LeadFilters } from "@/types/database";

interface AssignLeadsToCampaignSheetProps {
  campaignId: string | null;
  campaignName: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  pending: { label: "Pending", variant: "secondary" as const },
  contacted: { label: "Contacted", variant: "default" as const },
  responded: { label: "Responded", variant: "outline" as const },
  converted: { label: "Converted", variant: "destructive" as const },
};

export function AssignLeadsToCampaignSheet({ 
  campaignId, 
  campaignName, 
  isOpen, 
  onClose 
}: AssignLeadsToCampaignSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  // API hooks
  const filters: LeadFilters = {
    search: searchTerm,
    status: statusFilter === "all" ? undefined : [statusFilter],
    campaignId: "none", // Only show leads without campaigns
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  const { 
    data, 
    isLoading, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteLeads(filters, 10);

  const bulkUpdateLeads = useBulkUpdateLeads();

  // Flatten all pages of leads into a single array
  const leads = data?.pages.flatMap(page => page.data) || [];

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

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status as LeadStatus | "all");
  };

  const handleAssignLeads = () => {
    if (selectedLeads.length === 0 || !campaignId) return;
    
    bulkUpdateLeads.mutate({
      ids: selectedLeads,
      data: { campaignId },
    }, {
      onSuccess: () => {
        setSelectedLeads([]);
        onClose();
      }
    });
  };

  const handleLoadMore = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="min-w-full sm:min-w-[600px] lg:min-w-[700px] xl:w-[800px] 2xl:min-w-[900px] max-h-screen px-10 py-10">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Leads to {campaignName}
          </SheetTitle>
          <SheetDescription>
            Select leads to assign to this campaign. Only showing leads that are not currently assigned to any campaign.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search leads by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-40">
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
          </div>

          {/* Selected leads info */}
          {selectedLeads.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} selected
              </span>
              <Button 
                onClick={handleAssignLeads}
                disabled={bulkUpdateLeads.isPending}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign to Campaign
              </Button>
            </div>
          )}

          {/* Leads table */}
          <div className="rounded-md border max-h-[500px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No unassigned leads found
                        </p>
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
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {lead.firstName || lead.lastName 
                              ? `${lead.firstName || ''} ${lead.lastName || ''}`.trim()
                              : 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          {lead.title && (
                            <div className="text-xs text-muted-foreground">
                              {lead.title}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {lead.company ? (
                            <>
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{lead.company}</span>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lead.score || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Load more button */}
          {hasNextPage && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
