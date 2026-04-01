import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LogoMark } from "@/components/layout/AppSidebar";

const features = [
  "Dashboard completo",
  "Agenda inteligente",
  "Gestão de clientes",
  "Procedimentos & sessões",
  "Profissionais",
  "Fotos antes e depois",
  "Estoque",
  "Financeiro completo",
  "Relatórios e crescimento",
];

export default function BillingPage() {
  const { clinicId, clinic, user, refreshClinic } = useAuth();
  const navigate = useNavigate();

  const [pixCode, setPixCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isTrialActive =
    clinic?.subscription_status === "trial" &&
    clinic?.trial_end &&
    new Date(clinic.trial_end) > new Date();

  const isPlanActive =
    clinic?.subscription_status === "active" &&
    (!clinic?.plan_expires_at || new Date(clinic.plan_expires_at) > new Date());

  const trialDaysLeft = isTrialActive && clinic?.trial_end
    ? Math.max(0, Math.ceil((new Date(clinic.trial_end).getTime() - Date.now()) / 86400000))
    : 0;

  const generatePix = async () => {
    if (!clinicId || !user) {
      toast.error("Usuário ou clínica inválidos");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-pix`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinic_id: clinicId, email: user.email, value: 197, user_id: user.id }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erro ao gerar PIX");
      }

      const data = await res.json();
      const code = data.pix_code || data.qr_code;
      if (!code) throw new Error("QR Code não retornado");

      setPixCode(code);
      toast.success("PIX gerado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pixCode || !clinicId) return;

    let active = true;

    const poll = setInterval(async () => {
      try {
        const { data } = await supabase
          .from("clinics")
          .select("subscription_status")
          .eq("id", clinicId)
          .single();

        if (data?.subscription_status === "active" && active) {
          clearInterval(poll);
          await refreshClinic();
          toast.success("Pagamento confirmado! Bem-vindo ao CliniGlow Pro.");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
        }
      } catch (err) {
        console.error("Erro ao verificar pagamento:", err);
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(poll);
    };
  }, [pixCode, clinicId]);

  const copyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        <div>
          <h1 className="font-display text-2xl font-bold">Assinatura</h1>
          <p className="text-muted-foreground">
            {isPlanActive
              ? "Seu plano está ativo"
              : isTrialActive
              ? `Você está no período de teste (${trialDaysLeft} dias restantes)`
              : "Ative seu plano para continuar usando o sistema"}
          </p>
        </div>

        {isTrialActive && (
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Período de teste ativo — {trialDaysLeft} dias restantes</p>
                <p className="text-xs text-muted-foreground">
                  Você tem acesso completo ao sistema. Assine para não perder seus dados.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard")}
              >
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2 border-primary/20 shadow-card">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <LogoMark />
                <div>
                  <p className="font-display font-bold text-lg">CliniGlow Pro</p>
                  <p className="text-xs text-muted-foreground">Plano completo</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-display">R$197</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                    <p className="text-sm text-muted-foreground mt-1">Pagamento via PIX</p>
              </div>

              <ul className="space-y-2.5 mb-8">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isPlanActive ? (
                <div className="text-center py-3 rounded-lg bg-emerald-500/10 text-emerald-600 font-medium text-sm">
                  Plano ativo
                </div>
              ) : (
                <Button
                  onClick={generatePix}
                  disabled={loading || !!pixCode}
                  className="w-full gradient-primary border-0 text-white h-11"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando PIX...</>
                  ) : pixCode ? (
                    "PIX gerado com sucesso"
                  ) : (
                    "Gerar PIX para pagamento"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[480px]">
              {pixCode ? (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div className="text-center">
                    <p className="font-display font-bold text-lg">Escaneie o QR Code</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Após o pagamento, o acesso será liberado automaticamente
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
                    <QRCodeCanvas
                      value={pixCode}
                      size={220}
                      bgColor="#FFFFFF"
                      fgColor="#0A0A0F"
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <div className="w-full space-y-3">
                    <Button
                      variant="outline"
                      className="w-full h-10 gap-2"
                      onClick={copyPix}
                    >
                      {copied ? (
                        <><Check className="h-4 w-4 text-emerald-500" /> Copiado!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copiar código PIX</>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs py-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      <span>Aguardando confirmação do pagamento...</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto">
                    <LogoMark />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Pronto para assinar?</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Clique em "Gerar PIX" para iniciar o pagamento
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
