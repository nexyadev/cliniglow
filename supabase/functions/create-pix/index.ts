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
    const { clinic_id } = await req.json();
    if (!clinic_id) {
      return new Response(JSON.stringify({ error: "clinic_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mpToken = Deno.env.get("MP_ACCESS_TOKEN");
    if (!mpToken) {
      return new Response(JSON.stringify({ error: "MP_ACCESS_TOKEN not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: existingPending } = await sb
      .from("saas_payments")
      .select("id, pix_code, mp_payment_id")
      .eq("clinic_id", clinic_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPending?.pix_code) {
      const checkRes = await fetch(
        `https://api.mercadopago.com/v1/payments/${existingPending.mp_payment_id}`,
        { headers: { Authorization: `Bearer ${mpToken}` } }
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.status !== "expired" && checkData.status !== "cancelled") {
          return new Response(
            JSON.stringify({
              payment_id: existingPending.id,
              pix_code: existingPending.pix_code,
              mp_payment_id: existingPending.mp_payment_id,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    const { data: payment, error: insertErr } = await sb
      .from("saas_payments")
      .insert({
        clinic_id,
        amount: 197,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", JSON.stringify(insertErr));
      throw new Error(insertErr.message || JSON.stringify(insertErr));
    }

    const mpBody = {
      transaction_amount: 197,
      description: "CliniGlow - Plano Mensal",
      payment_method_id: "pix",
      payer: { email: "cliente@cliniglow.com" },
      external_reference: payment.id,
      notification_url: `${supabaseUrl}/functions/v1/webhook`,
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": payment.id,
      },
      body: JSON.stringify(mpBody),
    });

    const mpData = await mpRes.json();
    console.log("MP create-pix response:", JSON.stringify(mpData));

    if (!mpRes.ok) {
      await sb.from("saas_payments").update({ status: "failed" }).eq("id", payment.id);
      return new Response(
        JSON.stringify({ error: mpData.message || "MP error", details: mpData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pixCode =
      mpData.point_of_interaction?.transaction_data?.qr_code ||
      mpData.point_of_interaction?.transaction_data?.qr_code_base64 ||
      "";

    const mpPaymentId = String(mpData.id);

    await sb
      .from("saas_payments")
      .update({ pix_code: pixCode, mp_payment_id: mpPaymentId })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({
        payment_id: payment.id,
        pix_code: pixCode,
        qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        mp_payment_id: mpPaymentId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    const msg = err?.message || err?.details || JSON.stringify(err) || "Unknown error";
    console.error("create-pix error:", msg, err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
