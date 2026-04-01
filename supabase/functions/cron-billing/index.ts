import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const now = new Date().toISOString();

    const { data: expiredTrials } = await sb
      .from("clinics")
      .select("id")
      .eq("subscription_status", "trial")
      .lt("trial_end", now);

    if (expiredTrials?.length) {
      const ids = expiredTrials.map((c) => c.id);
      await sb
        .from("clinics")
        .update({ subscription_status: "expired" })
        .in("id", ids);
      console.log("Expired trials:", ids.length);
    }

    const { data: expiredPlans } = await sb
      .from("clinics")
      .select("id")
      .eq("subscription_status", "active")
      .lt("plan_expires_at", now);

    if (expiredPlans?.length) {
      const ids = expiredPlans.map((c) => c.id);
      await sb
        .from("clinics")
        .update({ subscription_status: "expired" })
        .in("id", ids);
      console.log("Expired plans:", ids.length);
    }

    return new Response(
      JSON.stringify({
        expired_trials: expiredTrials?.length || 0,
        expired_plans: expiredPlans?.length || 0,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cron-billing error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
