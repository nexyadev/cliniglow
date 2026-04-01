import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { clinicId, isProfileLoaded, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [clientCount, setClientCount] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [procedureData, setProcedureData] = useState<any[]>([]);

  useEffect(() => {
    if (!isProfileLoaded) return;
    if (!clinicId) { setLoading(false); return; }
    loadDashboard();
  }, [clinicId, isProfileLoaded]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const { count } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", clinicId);
      setClientCount(count || 0);

      const today = new Date().toISOString().split("T")[0];
      const { data: appts } = await supabase
        .from("appointments")
        .select("*, clients(name), procedures(name)")
        .eq("clinic_id", clinicId)
        .gte("date", today + "T00:00:00")
        .lte("date", today + "T23:59:59")
        .order("date");
      setTodayAppointments(appts || []);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data: income } = await supabase
        .from("financial_records")
        .select("amount")
        .eq("clinic_id", clinicId)
        .eq("type", "income")
        .gte("created_at", startOfMonth.toISOString());
      const total = (income || []).reduce((s, r) => s + Number(r.amount), 0);
      setMonthlyRevenue(total);

      const { data: procs } = await supabase
        .from("appointments")
        .select("procedure_id, procedures(name)")
        .eq("clinic_id", clinicId)
        .not("procedure_id", "is", null);
      const procMap: Record<string, { name: string; value: number }> = {};
      (procs || []).forEach((p: any) => {
        const name = p.procedures?.name || "Outro";
        if (!procMap[name]) procMap[name] = { name, value: 0 };
        procMap[name].value++;
      });
      setProcedureData(Object.values(procMap).slice(0, 5));

    } catch (err) {
      console.error("Erro ao carregar painel:", err);
    } finally {
      setLoading(false);
    }
  };

  const ticketMedio = clientCount > 0 ? Math.round(monthlyRevenue / clientCount) : 0;

  const stats = [
    { label: "Clientes", value: clientCount, icon: Users },
    { label: "Atendimentos Hoje", value: todayAppointments.length, icon: Calendar },
    { label: "Faturamento", value: `R$ ${monthlyRevenue.toLocaleString()}`, icon: DollarSign },
    { label: "Ticket Médio", value: `R$ ${ticketMedio.toLocaleString()}`, icon: TrendingUp },
  ];

  const formattedDate = new Date().toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  if (!isProfileLoaded) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
          Carregando...
        </div>
      </AppLayout>
    );
  }

  if (!clinicId) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
          Nenhuma clínica vinculada ainda
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
          Carregando painel...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">

        <div>
          <h1 className="font-display text-2xl font-bold">
            {greeting}, {profile?.full_name || "Usuário"}
          </h1>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="shadow-card hover:shadow-card-hover transition-all duration-200 border border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold font-display">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-card border border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Procedimentos mais realizados</CardTitle>
          </CardHeader>
          <CardContent>
            {procedureData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={procedureData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid hsl(214 32% 91%)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      fontSize: "12px",
                    }}
                    cursor={{ fill: "hsl(220 15% 95%)" }}
                  />
                  <Bar dataKey="value" fill="#7C5CFC" radius={[6, 6, 0, 0]} label={{ position: "top", fontSize: 11, fill: "#64748B" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Sem dados ainda</p>
                <p className="text-sm text-muted-foreground mt-1">Os procedimentos aparecerão aqui conforme os agendamentos forem criados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {todayAppointments.length > 0 && (
          <Card className="shadow-card border border-border">
            <CardHeader>
              <CardTitle className="font-display text-lg">Agendamentos de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {todayAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {a.clients?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.clients?.name}</p>
                        <p className="text-xs text-muted-foreground">{a.procedures?.name || "—"}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </AppLayout>
  );
}
