"use client";

import { LeadsTable } from "@/components/leads-table";
import { CreateLeadSheet } from "@/components/create-lead-sheet";

export default function LeadsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track your lead pipeline
          </p>
        </div>
      </div>
      <LeadsTable />
      <CreateLeadSheet />
    </div>
  );
}
