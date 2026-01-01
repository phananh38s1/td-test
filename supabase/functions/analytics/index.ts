import { createClient } from "npm:@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid token");
    const userId = user.id;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, statusRes, topRes, recentRes] = await Promise.all([
      adminClient.from("candidates").select("*", { count: "exact", head: true }).eq("user_id", userId),
      adminClient.from("candidates").select("status").eq("user_id", userId),
      adminClient.rpc("get_top_positions", { p_user_id: userId }), 
      adminClient.from("candidates")
        .select("*")
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false })
    ]);

    const totalCount = totalRes.count ?? 0;

    const statusDistribution = statusRes.data?.reduce((acc: Record<string, unknown>, cur) => {
      const s = cur.status || "unknown";
      if (!acc[s]) acc[s] = { count: 0, percentage: 0 };
      acc[s].count += 1;
      return acc;
    }, {});

    if (statusDistribution && totalCount > 0) {
      Object.keys(statusDistribution).forEach(k => {
        statusDistribution[k].percentage = Number(((statusDistribution[k].count / totalCount) * 100).toFixed(1));
      });
    }

    return new Response(
      JSON.stringify({
        total_candidates: totalCount,
        status_distribution: statusDistribution ?? {},
        top_positions: topRes.data ?? [],
        recent_candidates: recentRes.data ?? [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});