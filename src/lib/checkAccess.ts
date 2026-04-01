import { supabase } from "@/integrations/supabase/client";

export async function checkAccess(clinicId: string) {
if (!clinicId) return false;

// 🔎 busca na tabela correta (clinics)
const { data: clinic, error } = await supabase
.from("clinics")
.select("subscription_status, trial_end, plan_expires_at")
.eq("id", clinicId)
.single();

if (error || !clinic) return false;

const now = new Date();

// ✅ plano ativo
if (clinic.subscription_status === "active") {
if (!clinic.plan_expires_at) return true;

return new Date(clinic.plan_expires_at) > now;
}

// ✅ trial ativo
if (clinic.subscription_status === "trial") {
if (!clinic.trial_end) return false;

return new Date(clinic.trial_end) > now;
}

// ❌ bloqueado
return false;
}