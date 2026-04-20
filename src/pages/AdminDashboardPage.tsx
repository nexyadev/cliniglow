import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, Users, TrendingUp, Building2, Plus, Trash2, CheckCircle,
  Clock, TrendingDown, Download, Loader2, Upload, FileSpreadsheet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportClinicPdfByAdmin } from "@/lib/exportPdf";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

const COLORS = ["#7C5CFC", "#38BDF8", "#F97316", "#EF4444"];

export default function AdminDashboardPage() {
  const [clinics, setClinics] = useState<any[]>([]);
  const [adminFinancials, setAdminFinancials] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [openFin, setOpenFin] = useState(false);
  const [finForm, setFinForm] = useState({ type: "income" as "income" | "expense", amount: "", description: "" });
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [importingClinicId, setImportingClinicId] = useState<string | null>(null);
  const [clinicFilter, setClinicFilter] = useState<"all" | "trial" | "active" | "cancelled">("all");
  const [now, setNow] = useState(Date.now());

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const { data: cl } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
    setClinics(cl || []);
    const { data: fin } = await supabase.from("admin_financial").select("*").order("created_at", { ascending: false });
    setAdminFinancials(fin || []);
    const { data: pay } = await supabase.from("saas_payments").select("*, clinics(name)").eq("status", "pending").order("created_at", { ascending: false });
    setPayments(pay || []);
  };

  const confirmPayment = async (id: string) => {
    const { error } = await (supabase as any).rpc("confirm_payment", { _payment_id: id });
    if (error) { toast.error("Erro ao confirmar pagamento."); return; }
    toast.success("Pagamento confirmado!");
    loadData();
  };

  const handleAddFinancial = async () => {
    if (!finForm.description || !finForm.amount) return toast.error("Preencha todos os campos");
    const { error } = await supabase.from("admin_financial").insert({
      type: finForm.type,
      amount: Number(finForm.amount),
      description: finForm.description,
    });
    if (error) { toast.error("Erro ao registrar transação."); return; }
    toast.success("Registrado com sucesso!");
    setFinForm({ type: "income", amount: "", description: "" });
    setOpenFin(false);
    loadData();
  };

  const handleDeleteFinancial = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;
    await supabase.from("admin_financial").delete().eq("id", id);
    toast.success("Transação removida");
    loadData();
  };

  const handleExportClinicPdf = async (clinicId: string, clinicName: string) => {
    setExportingId(clinicId);
    try {
      await exportClinicPdfByAdmin(clinicId, clinicName);
      toast.success(`PDF de "${clinicName}" gerado com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + (err?.message || "Erro desconhecido"));
    } finally {
      setExportingId(null);
    }
  };

  const handleImportCSV = async (clinicId: string, file: File, table: string) => {
    setImportingClinicId(clinicId);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) { toast.error("Arquivo vazio ou sem dados."); return; }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""));
      const rows: Record<string, any>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/^["']|["']$/g, ""));
        if (values.length !== headers.length) continue;
        const row: Record<string, any> = { clinic_id: clinicId };
        headers.forEach((h, idx) => {
          if (h !== "id" && h !== "clinic_id" && h !== "created_at" && h !== "updated_at") {
            row[h] = values[idx] || null;
          }
        });
        rows.push(row);
      }

      if (rows.length === 0) { toast.error("Nenhum dado válido encontrado."); return; }

      const { error } = await supabase.from(table).insert(rows);
      if (error) throw error;

      toast.success(`${rows.length} registros importados com sucesso!`);
    } catch (err: any) {
      toast.error("Erro na importação: " + (err?.message || "Erro desconhecido"));
    } finally {
      setImportingClinicId(null);
    }
  };

  const activeCount = clinics.filter(c => c.subscription_status === "active").length;
  const trialCount = clinics.filter(c => c.subscription_status === "trial").length;
  const cancelledCount = clinics.filter(c => c.subscription_status === "cancelled" || c.subscription_status === "expired").length;
  const mrr = activeCount * 97;
  const arr = mrr * 12;
  const churnRate = clinics.length > 0 ? ((cancelledCount / clinics.length) * 100).toFixed(1) : "0";
  const adminIncome = adminFinancials.filter(f => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const adminExpense = adminFinancials.filter(f => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);

  const filteredClinics = clinicFilter === "all" ? clinics
    : clinicFilter === "cancelled" ? clinics.filter(c => c.subscription_status === "cancelled" || c.subscription_status === "expired")
    : clinics.filter(c => c.subscription_status === clinicFilter);

  const getTrialDaysLeft = (c: any) => {
    if (c.subscription_status !== "trial" || !c.trial_end) return null;
    const days = Math.ceil((new Date(c.trial_end).getTime() - now) / 86400000);
    return days;
  };
  const adminProfit = adminIncome - adminExpense;

  const statusData = [
    { name: "Ativas", value: activeCount },
    { name: "Em Teste", value: trialCount },
    { name: "Canceladas", value: cancelledCount },
  ].filter(d => d.value > 0);

  const growthData = (() => {
    if (clinics.length === 0) return [];
    const monthMap: Record<string, { novas: number }> = {};
    clinics.forEach((c) => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { novas: 0 };
      monthMap[key].novas += 1;
    });
    const sorted = Object.keys(monthMap).sort();
    let cumulative = 0;
    return sorted.map((key) => {
      cumulative += monthMap[key].novas;
      const [y, m] = key.split("-");
      return { month: `${m}/${y}`, novas: monthMap[key].novas, total: cumulative };
    });
  })();

  const revenueData = (() => {
    if (adminFinancials.length === 0) return [];
    const monthMap: Record<string, { receita: number; despesa: number }> = {};
    adminFinancials.forEach((f) => {
      const d = new Date(f.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) monthMap[key] = { receita: 0, despesa: 0 };
      if (f.type === "income") monthMap[key].receita += Number(f.amount);
      else monthMap[key].despesa += Number(f.amount);
    });
    const sorted = Object.keys(monthMap).sort();
    return sorted.map((key) => {
      const [y, m] = key.split("-");
      return { month: `${m}/${y}`, ...monthMap[key] };
    });
  })();

  return (
    <AdminLayout>
      <div className="space-y-6">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm mt-1">{clinics.length} clínicas cadastradas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MRR", value: `R$ ${mrr.toLocaleString("pt-BR")}`, icon: DollarSign, desc: "Receita mensal recorrente", color: "text-primary", bg: "bg-primary/10" },
            { label: "ARR", value: `R$ ${arr.toLocaleString("pt-BR")}`, icon: TrendingUp, desc: "Receita anual recorrente", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Clínicas Ativas", value: activeCount.toString(), icon: Building2, desc: `${trialCount} em teste`, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Taxa de Cancelamento", value: `${churnRate}%`, icon: Users, desc: `${cancelledCount} cancelada${cancelledCount !== 1 ? "s" : ""}`, color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map((s) => (
            <Card key={s.label} className="shadow-card hover:shadow-card-hover transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold font-display">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="visao-geral" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="clinicas">Clínicas</TabsTrigger>
            <TabsTrigger value="pagamentos">
              Pagamentos
              {payments.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-destructive text-white px-1.5 py-0.5 rounded-full">{payments.length}</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {growthData.length > 0 && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="font-display text-base">Crescimento de Clínicas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                          <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                          <Area type="monotone" dataKey="total" name="Total" stroke="#7C5CFC" fill="url(#colorTotal)" strokeWidth={2} />
                          <Bar dataKey="novas" name="Novas" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-base">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                            {statusData.map((_, idx) => (
                              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma clínica cadastrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Receitas", value: adminIncome, icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10", prefix: "+" },
                { label: "Despesas", value: adminExpense, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", prefix: "-" },
                { label: "Lucro", value: adminProfit, icon: DollarSign, color: adminProfit >= 0 ? "text-emerald-500" : "text-destructive", bg: adminProfit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10", prefix: "" },
              ].map((s) => (
                <Card key={s.label} className="shadow-card">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                        <s.icon className={`h-5 w-5 ${s.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{s.label}</p>
                        <p className={`text-2xl font-bold font-display ${s.color}`}>
                          {s.prefix}R$ {Math.abs(s.value).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {revenueData.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-display text-base">Receitas x Despesas por Mês</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip contentStyle={{ borderRadius: "0.75rem", fontSize: "0.8rem", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                        <Legend />
                        <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="despesa" name="Despesa" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">Histórico Financeiro</CardTitle>
                  <Dialog open={openFin} onOpenChange={setOpenFin}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gradient-primary border-0 text-white gap-1">
                        <Plus className="h-4 w-4" /> Nova Transação
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle className="font-display">Nova Transação</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div className="flex gap-2">
                          <Button variant={finForm.type === "income" ? "default" : "outline"} onClick={() => setFinForm({ ...finForm, type: "income" })} className={finForm.type === "income" ? "gradient-primary border-0 text-white flex-1" : "flex-1"}>Receita</Button>
                          <Button variant={finForm.type === "expense" ? "default" : "outline"} onClick={() => setFinForm({ ...finForm, type: "expense" })} className={finForm.type === "expense" ? "bg-destructive text-white border-0 flex-1" : "flex-1"}>Despesa</Button>
                        </div>
                        <div className="space-y-2"><Label>Descrição</Label><Input value={finForm.description} onChange={(e) => setFinForm({ ...finForm, description: e.target.value })} placeholder="Ex: Servidor, Marketing..." /></div>
                        <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" value={finForm.amount} onChange={(e) => setFinForm({ ...finForm, amount: e.target.value })} placeholder="0,00" /></div>
                        <Button onClick={handleAddFinancial} className="w-full gradient-primary border-0 text-white">Adicionar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {adminFinancials.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma transação registrada</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Descrição</th>
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</th>
                          <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                          <th className="p-4 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminFinancials.map((f) => (
                          <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-4 text-sm font-medium">{f.description}</td>
                            <td className="p-4">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${f.type === "income" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"}`}>
                                {f.type === "income" ? "Receita" : "Despesa"}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString("pt-BR")}</td>
                            <td className={`p-4 text-sm font-semibold text-right ${f.type === "income" ? "text-emerald-500" : "text-destructive"}`}>
                              {f.type === "income" ? "+" : "-"}R$ {Number(f.amount).toLocaleString("pt-BR")}
                            </td>
                            <td className="p-4">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteFinancial(f.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinicas" className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { value: "all", label: "Todas", count: clinics.length },
                { value: "trial", label: "Em Teste", count: trialCount },
                { value: "active", label: "Ativas", count: activeCount },
                { value: "cancelled", label: "Canceladas", count: cancelledCount },
              ] as const).map((f) => (
                <Button
                  key={f.value}
                  variant={clinicFilter === f.value ? "default" : "outline"}
                  size="sm"
                  className={clinicFilter === f.value ? "gradient-primary border-0 text-white" : ""}
                  onClick={() => setClinicFilter(f.value)}
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-base">Clínicas Cadastradas</CardTitle>
                  <span className="text-xs text-muted-foreground">{filteredClinics.length} de {clinics.length}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredClinics.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma clínica neste filtro</p>
                  </div>
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Clínica</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">WhatsApp</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Cadastro</th>
                        <th className="text-right p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClinics.map((c) => {
                        const trialDays = getTrialDaysLeft(c);
                        return (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <p className="text-sm font-medium">{c.name}</p>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {c.whatsapp ? (
                              <a href={`https://wa.me/55${c.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                {c.whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")}
                              </a>
                            ) : "-"}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                                c.subscription_status === "active" ? "bg-emerald-500/10 text-emerald-500"
                                : c.subscription_status === "trial" ? "bg-primary/10 text-primary"
                                : "bg-destructive/10 text-destructive"
                              }`}>
                                {c.subscription_status === "active" ? "Ativa" : c.subscription_status === "trial" ? "Em Teste" : "Cancelada"}
                              </span>
                              {trialDays !== null && (
                                <span className={`text-[10px] font-medium ${trialDays <= 2 ? "text-destructive" : "text-muted-foreground"}`}>
                                  {trialDays > 0 ? `${trialDays}d restantes` : "Expirado"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <ImportCSVButton clinicId={c.id} clinicName={c.name} onImport={handleImportCSV} importing={importingClinicId === c.id} />
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs"
                                disabled={exportingId === c.id}
                                onClick={() => handleExportClinicPdf(c.id, c.name)}
                              >
                                {exportingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-4">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="font-display text-base">Pagamentos Pendentes</CardTitle>
                  {payments.length > 0 && (
                    <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                      {payments.length}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="font-medium">Tudo em dia!</p>
                    <p className="text-sm text-muted-foreground mt-1">Nenhum pagamento pendente.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
                        <div>
                          <p className="font-medium text-foreground text-sm">{p.clinics?.name || "Clínica"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">R$ {Number(p.amount).toLocaleString("pt-BR")} &bull; {new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <Button size="sm" onClick={() => confirmPayment(p.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 gap-1 text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Confirmar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </AdminLayout>
  );
}

function ImportCSVButton({ clinicId, clinicName, onImport, importing }: {
  clinicId: string;
  clinicName: string;
  onImport: (clinicId: string, file: File, table: string) => Promise<void>;
  importing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [table, setTable] = useState("clients");
  const [file, setFile] = useState<File | null>(null);

  const tables = [
    { value: "clients", label: "Clientes" },
    { value: "procedures", label: "Procedimentos" },
    { value: "professionals", label: "Profissionais" },
    { value: "products", label: "Estoque" },
    { value: "financial_records", label: "Financeiro" },
  ];

  const handleImport = async () => {
    if (!file) { toast.error("Selecione um arquivo CSV."); return; }
    await onImport(clinicId, file, table);
    setFile(null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 text-xs">
          <Upload className="h-3.5 w-3.5" /> Importar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Importar dados — {clinicName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Tabela de destino</Label>
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {tables.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              {file && <p className="text-xs text-muted-foreground mt-2">{file.name}</p>}
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              O CSV deve ter cabeçalhos na primeira linha com os nomes das colunas.
              As colunas <strong>id</strong>, <strong>clinic_id</strong>, <strong>created_at</strong> e <strong>updated_at</strong> são ignoradas automaticamente.
            </p>
          </div>
          <Button onClick={handleImport} className="w-full gradient-primary border-0 text-white gap-2" disabled={importing || !file}>
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {importing ? "Importando..." : "Importar Dados"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
