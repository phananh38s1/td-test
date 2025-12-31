import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Candidate } from "@/types/candidates";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const supabase = createClient();

export function useRealtimeCandidates() {
  const [data, setData] = useState<Candidate[] | []>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: candidates, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && candidates) setData(candidates);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("candidates-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        (payload: RealtimePostgresChangesPayload<Candidate>) => {
          switch (payload.eventType) {
            case "INSERT": {
              const newRecord = payload.new as Candidate;
              setData((prev) => [newRecord, ...prev]);
              break;
            }
            case "UPDATE": {
              const updatedRecord = payload.new as Candidate;
              setData((prev) =>
                prev.map((row) =>
                  row.id === updatedRecord.id ? updatedRecord : row
                )
              );
              break;
            }
            case "DELETE": {
              const deletedId = payload.old.id;
              setData((prev) => prev.filter((row) => row.id !== deletedId));
              break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, setData };
}
