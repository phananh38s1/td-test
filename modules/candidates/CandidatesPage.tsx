"use client";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useRealtimeCandidates } from "@/hooks/use-realtime-candidates";
import { Candidate } from "@/types/candidates";
import { ColumnDef } from "@tanstack/react-table";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { DialogAddCandidate } from "./components/DialogAddCandidate";
import DialogDeleteCandidate from "./components/DialogDeleteCandidate";
import { DialogUpdateCandidate } from "./components/DialogUpdateCandidate";

export const dynamic = "force-dynamic";

export default function CandidatesPage() {
  const { data } = useRealtimeCandidates();

  const columns: ColumnDef<Candidate>[] = [
    { accessorKey: "full_name", header: "Full Name" },
    { accessorKey: "applied_position", header: "Position" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "resume_url",
      header: "Resume",
      cell: ({ getValue }) => {
        const url = getValue<string>();
        if (!url) return null;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-55 truncate text-blue-500 underline block"
            title={url}
          >
            {url}
          </a>
        );
      },
    },
    { accessorKey: "created_at", header: "Created At" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const candidate = row.original;
        return (
          <div className="flex gap-2">
            <DialogUpdateCandidate candidate={candidate} />
            <DialogDeleteCandidate
              candidateId={candidate.id}
              candidateName={candidate.full_name}
            />
          </div>
        );
      },
    },
  ];

  const { table } = useDataTable({
    data,
    columns,
    pageCount: 1,
  });

  return (
    <>
      <AnalyticsDashboard />

      <DialogAddCandidate showTrigger />

      <div className="w-full max-w-7xl">
        <DataTable table={table} />
      </div>
    </>
  );
}
