"use client";

import { Candidate } from "@/types/candidates";
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import { useEffect, useState, useRef, useCallback } from "react";

export function useRealtimeCandidates(supabase: SupabaseClient) {
  const [data, setData] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: candidates, error } = await supabase
          .from("candidates")
          .select(
            "id, full_name, applied_position, status, resume_url, created_at"
          )
          .order("created_at", { ascending: false });

        if (!error && candidates) {
          setData(candidates);
        } else if (error) {
          console.error("fetch lỗi: ", error);
        }
      } catch (err) {
        console.error("lỗi gì đó: ", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    setIsConnected(false);

    const channelName = `candidates-${Date.now()}`;

    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        (payload: RealtimePostgresChangesPayload<Candidate>) => {
          if (payload.eventType === "INSERT") {
            const newRecord: Candidate = {
              id: payload.new.id,
              full_name: payload.new.full_name,
              applied_position: payload.new.applied_position,
              status: payload.new.status,
              resume_url: payload.new.resume_url,
              created_at: payload.new.created_at,
            };

            setData((prev) => {
              const exists = prev.some((item) => item.id === newRecord.id);
              if (exists) {
                return prev;
              }
              return [newRecord, ...prev];
            });
          }

          if (payload.eventType === "UPDATE") {
            const updatedRecord: Candidate = {
              id: payload.new.id,
              full_name: payload.new.full_name,
              applied_position: payload.new.applied_position,
              status: payload.new.status,
              resume_url: payload.new.resume_url,
              created_at: payload.new.created_at,
            };

            setData((prev) =>
              prev.map((row) =>
                row.id === updatedRecord.id ? updatedRecord : row
              )
            );
          }

          if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            setData((prev) => prev.filter((row) => row.id !== deletedId));
          }
        }
      )
      .subscribe((status, err) => {
        console.log("status kết nối:", status, err);

        if (status === "SUBSCRIBED") {
          console.log("subscribed thành công");
          setIsConnected(true);

          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
        }

        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("đang failed, thử kết nội lại sau 3s...");
          setIsConnected(false);

          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("đang kết nối lại...");
            setupRealtimeSubscription();
          }, 3000);
        }

        if (status === "CLOSED") {
          console.log("đã đóng realtime");
          setIsConnected(false);
        }
      });

    channelRef.current = channel;
  }, [supabase]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setupRealtimeSubscription();
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setupRealtimeSubscription]);

  return { data, setData, isLoading, isConnected };
}
