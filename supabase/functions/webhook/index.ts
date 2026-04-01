import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const action = body.action || body.type;
    if (action !== "payment.updated" && action !== "payment") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "no payment id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpToken) {
      console.error("MP_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ error: "config error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });
    const payment = await mpRes.json();
    console.log("MP payment status:", payment.status, "external_reference:", payment.external_reference);

    if (payment.status !== "approved") {
      return new Response(JSON.stringify({ status: payment.status, message: "not approved yet" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const externalRef = payment.external_reference;
    if (!externalRef) {
      console.error("No external_reference in payment");
      return new Response(JSON.stringify({ error: "no reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: paymentRecord, error: findErr } = await sb
      .from("saas_payments")
      .select("id, clinic_id")
      .eq("mp_payment_id", externalRef)
      .maybeSingle();

    let clinicId: string | null = null;

    if (paymentRecord) {
      clinicId = paymentRecord.clinic_id;
      await sb
        .from("saas_payments")
        .update({
          status: "paid",
          payment_date: new Date().toISOString(),
          mp_payment_id: String(paymentId),
        })
        .eq("id", paymentRecord.id);
    } else {
      const { data: payByRef } = await sb
        .from("saas_payments")
        .select("id, clinic_id")
        .eq("id", externalRef)
        .maybeSingle();

      if (payByRef) {
        clinicId = payByRef.clinic_id;
        await sb
          .from("saas_payments")
          .update({
            status: "paid",
            payment_date: new Date().toISOString(),
            mp_payment_id: String(paymentId),
          })
          .eq("id", payByRef.id);
      }
    }

    if (clinicId) {
      const planExpires = new Date();
      planExpires.setDate(planExpires.getDate() + 30);

      await sb
        .from("clinics")
        .update({
          subscription_status: "active",
          plan_expires_at: planExpires.toISOString(),
        })
        .eq("id", clinicId);

      console.log("Clinic activated:", clinicId, "expires:", planExpires.toISOString());
    } else {
      console.warn("Could not find clinic for payment reference:", externalRef);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
