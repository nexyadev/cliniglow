import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Users, MessageCircle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function GrowthPage() {
  const { clinicId } = useAuth();
  const [inactiveClients, setInactiveClients] = useState<any[]>([]);
  const [ticketMedio, setTicketMedio] = useState(0);
  const [topProcedure, setTopProcedure] = useState("");
  const [inactiveCount, setInactiveCount] = useState(0);

  useEffect(() => { if (clinicId) loadInsights(); }, [clinicId]);

  const loadInsights = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: allClients } = await supabase.from("clients").select("id, name, phone").eq("clinic_id", clinicId!);
    const { data: recentAppts } = await supabase.from("appointments").select("client_id").eq("clinic_id", clinicId!).gte("date", thirtyDaysAgo);
    const recentClientIds = new Set((recentAppts || []).map(a => a.client_id));
    const inactive = (allClients || []).filter(c => !recentClientIds.has(c.id));
    setInactiveClients(inactive.slice(0, 10));
    setInactiveCount(inactive.length);

    const { data: income } = await supabase.from("financial_records").select("amount").eq("clinic_id", clinicId!).eq("type", "income");
    const totalIncome = (income || []).reduce((s, r) => s + Number(r.amount), 0);
    const clientCount = (allClients || []).length;
    setTicketMedio(clientCount > 0 ? Math.round(totalIncome / clientCount) : 0);

    const { data: appts } = await supabase.from("appointments").select("procedures(name)").eq("clinic_id", clinicId!).not("procedure_id", "is", null);
    const procCount: Record<string, number> = {};
    (appts || []).forEach((a: any) => {
      const name = a.procedures?.name;
      if (name) procCount[name] = (procCount[name] || 0) + 1;
    });
    const top = Object.entries(procCount).sort((a, b) => b[1] - a[1])[0];
    setTopProcedure(top ? top[0] : "—");
  };

  const sendWhatsApp = (phone: string, name: string) => {
    const msg = encodeURIComponent(`Olá, ${name}!\n\nSentimos sua falta na clínica.\n\nEstamos com novidades e horários disponíveis para você.\n\nGostaria de agendar um novo atendimento?`);
    const cleanPhone = (phone || "").replace(/\D/g, "");
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, "_blank");
  };

  const insights = [
    { icon: DollarSign, title: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString()}`, desc: "Por cliente ativo" },
    { icon: TrendingUp, title: "Procedimento Principal", value: topProcedure, desc: "O mais realizado da clínica" },
    { icon: Users, title: "Inativos (30d)", value: inactiveCount.toString(), desc: "Clientes sem retorno" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Crescimento</h1>
          <p className="text-muted-foreground text-sm">Insights e métricas para crescer sua clínica</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {insights.map((i) => (
            <Card key={i.title} className="shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{i.title}</p>
                  <i.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-display">{i.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <CardTitle className="font-display text-lg">Clientes para Retorno</CardTitle>
                <p className="text-xs text-muted-foreground">Sem visita nos últimos 30 dias</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {inactiveClients.length > 0 ? (
              <div className="space-y-2">
                {inactiveClients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.phone || "Sem telefone"}</p>
                      </div>
                    </div>
                    {c.phone && (
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => sendWhatsApp(c.phone, c.name.split(" ")[0])}>
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-sm">Todos ativos!</p>
                <p className="text-sm text-muted-foreground mt-1">Todos os clientes tiveram visitas recentes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}