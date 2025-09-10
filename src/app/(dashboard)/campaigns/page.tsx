"use client";

import { CampaignsTable } from "@/components/campaigns-table";
import { CreateCampaignSheet } from "@/components/create-campaign-sheet";

export default function CampaignsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage your lead generation campaigns
          </p>
        </div>
      </div>
      <CampaignsTable />
      <CreateCampaignSheet />
    </div>
  );
}