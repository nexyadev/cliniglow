import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { exportClinicPdf } from "@/lib/exportPdf";
import { toast } from "sonner";

export default function RelatoriosPage() {
  const { clinicId, clinic } = useAuth();
  const [clientGrowth, setClientGrowth] = useState<any[]>([]);
  const [procedureStats, setProcedureStats] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => { if (clinicId) loadData(); }, [clinicId]);

  const loadData = async () => {
    // Client growth by month
    const { data: clients } = await supabase.from("clients").select("created_at").eq("clinic_id", clinicId!);
    const monthMap: Record<string, number> = {};
    (clients || []).forEach(c => {
      const m = new Date(c.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    let cumulative = 0;
    const growth = Object.entries(monthMap).map(([month, count]) => {
      cumulative += count;
      return { month, total: cumulative };
    });
    setClientGrowth(growth);

    // Procedure stats
    const { data: appts } = await supabase.from("appointments").select("procedures(name, price)").eq("clinic_id", clinicId!).not("procedure_id", "is", null);
    const procMap: Record<string, { name: string; count: number; revenue: number }> = {};
    (appts || []).forEach((a: any) => {
      const name = a.procedures?.name;
      const price = Number(a.procedures?.price) || 0;
      if (name) {
        if (!procMap[name]) procMap[name] = { name, count: 0, revenue: 0 };
        procMap[name].count++;
        procMap[name].revenue += price;
      }
    });
    setProcedureStats(Object.values(procMap).sort((a, b) => b.count - a.count));

    // Financial records for export
    const { data: fin } = await supabase.from("financial_records").select("*").eq("clinic_id", clinicId!).order("created_at", { ascending: false });
    setRecords(fin || []);
  };

  const handleExportPdf = async () => {
    if (!clinicId) return;
    setExportingPdf(true);
    try {
      await exportClinicPdf(clinicId, clinic?.name || "Clínica");
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + (err?.message || "Erro desconhecido"));
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Relatórios</h1>
            <p className="text-muted-foreground">Análises detalhadas da sua clínica</p>
          </div>
          <Button variant="outline" className="gap-1" onClick={handleExportPdf} disabled={exportingPdf}>
            {exportingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportingPdf ? "Gerando..." : "Exportar PDF"}
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">Crescimento de Clientes</CardTitle></CardHeader>
            <CardContent>
              {clientGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={clientGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 90%)" />
                    <XAxis dataKey="month" stroke="hsl(215, 14%, 46%)" fontSize={12} />
                    <YAxis stroke="hsl(215, 14%, 46%)" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="hsl(243, 80%, 62%)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm py-10 text-center">Sem dados ainda.</p>}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display text-lg">Procedimentos por Volume</CardTitle></CardHeader>
            <CardContent>
              {procedureStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={procedureStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 90%)" />
                    <XAxis type="number" stroke="hsl(215, 14%, 46%)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="hsl(215, 14%, 46%)" fontSize={11} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(243, 80%, 62%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-muted-foreground text-sm py-10 text-center">Sem dados ainda.</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display text-lg">Receita por Procedimento</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead><tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Procedimento</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Qtd</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Receita</th>
                <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ticket Médio</th>
              </tr></thead>
              <tbody>
                {procedureStats.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="p-4 text-sm font-medium">{p.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{p.count}</td>
                    <td className="p-4 text-sm font-medium text-right">R$ {p.revenue.toLocaleString()}</td>
                    <td className="p-4 text-sm text-muted-foreground text-right">R$ {Math.round(p.revenue / p.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
