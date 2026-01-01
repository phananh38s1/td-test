"use client";

import { DataTable } from "@/components/data-table/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { useRealtimeCandidates } from "@/hooks/use-realtime-candidates";
import { createClient } from "@/lib/supabase/client";
import { Candidate } from "@/types/candidates";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { DialogAddCandidate } from "./components/DialogAddCandidate";
import DialogDeleteCandidate from "./components/DialogDeleteCandidate";
import { DialogUpdateCandidate } from "./components/DialogUpdateCandidate";

export default function CandidatesPage() {
  const [supabase] = useState(() => createClient());
  const { data, isConnected } = useRealtimeCandidates(supabase);

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
      <div className="fixed top-20 right-4 z-50">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            isConnected
              ? "bg-green-100 text-green-800 border border-green-300"
              : "bg-yellow-100 text-yellow-800 border border-yellow-300"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
            }`}
          />
          {isConnected ? "Live Updates Active" : "Connecting..."}
        </div>
      </div>

      <AnalyticsDashboard supabase={supabase} />
      <DialogAddCandidate showTrigger supabase={supabase} />
      <div className="w-full max-w-7xl">
        <DataTable table={table} />
      </div>
    </>
  );
}
