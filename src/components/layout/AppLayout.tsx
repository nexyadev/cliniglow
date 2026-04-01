import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, Clock, CreditCard, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agenda": "Agenda",
  "/clientes": "Clientes",
  "/procedimentos": "Procedimentos",
  "/profissionais": "Profissionais",
  "/sessoes": "Sessões",
  "/antes-depois": "Antes & Depois",
  "/estoque": "Estoque",
  "/financeiro": "Financeiro",
  "/growth": "Crescimento",
  "/relatorios": "Relatórios",
  "/billing": "Assinatura",
  "/admin": "Painel Admin",
};

function SubscriptionBanner() {
  const { clinic, isPlatformAdmin } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (isPlatformAdmin || !clinic || location.pathname === "/billing" || dismissed) return null;

  const now = new Date();

  if (clinic.subscription_status === "trial" && clinic.trial_end) {
    const daysLeft = Math.ceil((new Date(clinic.trial_end).getTime() - now.getTime()) / 86400000);

    if (daysLeft <= 0) return null;

    if (daysLeft <= 1) {
      return (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-orange-500" />
          <div className="relative px-4 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Seu teste gratuito expira hoje!
                </p>
                <p className="text-xs text-white/80">
                  Assine agora para não perder seus dados e continuar usando o sistema.
                </p>
              </div>
            </div>
            <Link to="/billing">
              <Button size="sm" className="bg-white text-red-600 hover:bg-white/90 border-0 font-bold shrink-0 shadow-lg rounded-lg px-5">
                Assinar Agora
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    if (daysLeft <= 3) {
      return (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          <div className="relative px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Faltam {daysLeft} dia{daysLeft > 1 ? "s" : ""} para o fim do teste gratuito
                </p>
                <p className="text-xs text-white/80">
                  Garanta seu acesso ao sistema assinando o plano.
                </p>
              </div>
            </div>
            <Link to="/billing">
              <Button size="sm" className="bg-white text-orange-600 hover:bg-white/90 border-0 font-semibold shrink-0 shadow-md rounded-lg px-4">
                Ver Planos
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10 px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-sm text-primary">
            Você está no <span className="font-semibold">período de teste</span> — {daysLeft} dia{daysLeft > 1 ? "s" : ""} restante{daysLeft > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/billing">
            <Button size="sm" variant="outline" className="text-xs shrink-0 rounded-lg border-primary/20 text-primary hover:bg-primary/5">
              Assinar
            </Button>
          </Link>
          <button onClick={() => setDismissed(true)} className="text-primary/40 hover:text-primary/60 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (clinic.subscription_status === "active" && clinic.plan_expires_at) {
    const daysLeft = Math.ceil((new Date(clinic.plan_expires_at).getTime() - now.getTime()) / 86400000);

    if (daysLeft <= 0) return null;

    if (daysLeft <= 3) {
      return (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
          <div className="relative px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Sua assinatura vence em {daysLeft} dia{daysLeft > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-white/80">
                  Renove para continuar usando o sistema sem interrupção.
                </p>
              </div>
            </div>
            <Link to="/billing">
              <Button size="sm" className="bg-white text-orange-600 hover:bg-white/90 border-0 font-semibold shrink-0 shadow-md rounded-lg px-4">
                Renovar Agora
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    if (daysLeft <= 5) {
      return (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-50 border-b border-amber-200/60 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-md bg-amber-100 flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <p className="text-sm text-amber-800">
              Sua assinatura vence em <span className="font-semibold">{daysLeft} dias</span>. Renove para não perder o acesso.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/billing">
              <Button size="sm" variant="outline" className="text-xs shrink-0 rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50">
                Renovar
              </Button>
            </Link>
            <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      );
    }
  }

  return null;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { clinic } = useAuth();
  const pageName = pageNames[location.pathname] || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <SubscriptionBanner />
          <header className="h-14 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              {pageName && (
                <span className="text-sm font-medium text-foreground">{pageName}</span>
              )}
            </div>
            {clinic && (
              <span className="text-xs text-muted-foreground font-medium">
                {clinic.name}
              </span>
            )}
          </header>
          <main className="flex-1 p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
