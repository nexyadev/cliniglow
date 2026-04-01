import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function FinanceiroPage() {
  const { clinicId } = useAuth();

  const [records, setRecords] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    description: "",
    amount: "",
    category: "",
  });

  useEffect(() => {
    if (clinicId) load();
  }, [clinicId]);

  const load = async () => {
    const { data } = await supabase
      .from("financial_records")
      .select("*")
      .eq("clinic_id", clinicId!)
      .order("created_at", { ascending: false });

    setRecords(data || []);
  };

  const totalIncome = records
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + Number(r.amount), 0);

  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + Number(r.amount), 0);

  const profit = totalIncome - totalExpense;

  const handleAdd = async () => {
    if (!form.description || !form.amount || !clinicId) return;

    const { error } = await supabase.from("financial_records").insert({
      clinic_id: clinicId,
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
      category: form.category || null,
    });

    if (error) {
      toast.error("Erro ao registrar transação.");
      return;
    }

    toast.success("Transação registrada!");
    setForm({ type: "income", description: "", amount: "", category: "" });
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    await supabase.from("financial_records").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Removido");
    load();
  };

  const monthlyData = (() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    records.forEach((r) => {
      const date = new Date(r.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!map[key]) map[key] = { month: label, income: 0, expense: 0 };
      if (r.type === "income") map[key].income += Number(r.amount);
      if (r.type === "expense") map[key].expense += Number(r.amount);
    });
    return Object.keys(map)
      .sort()
      .map((k) => map[k]);
  })();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              Financeiro
            </h1>
            <p className="text-sm text-muted-foreground">
              Controle de receitas e despesas da clínica
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Nova Transação
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={
                      form.type === "income"
                        ? "bg-success text-white hover:bg-success/90 border-success"
                        : ""
                    }
                    onClick={() => setForm({ ...form, type: "income" })}
                  >
                    Receita
                  </Button>
                  <Button
                    variant="outline"
                    className={
                      form.type === "expense"
                        ? "bg-destructive text-white hover:bg-destructive/90 border-destructive"
                        : ""
                    }
                    onClick={() => setForm({ ...form, type: "expense" })}
                  >
                    Despesa
                  </Button>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setForm({ ...form, amount: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Input
                      value={form.category}
                      onChange={(e) =>
                        setForm({ ...form, category: e.target.value })
                      }
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAdd}
                  className="w-full gradient-primary border-0 text-primary-foreground"
                >
                  Adicionar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card border border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receitas</p>
                <p className="text-xl font-bold text-success">
                  R$ {Number(totalIncome).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Despesas</p>
                <p className="text-xl font-bold text-destructive">
                  R$ {Number(totalExpense).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lucro</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {Number(profit).toLocaleString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border border-border">
          <CardHeader>
            <CardTitle>Visão Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border border-border">
          <CardHeader>
            <CardTitle>Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Descrição</th>
                    <th className="pb-3 font-medium">Categoria</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium text-right">Valor</th>
                    <th className="pb-3 font-medium text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{t.description}</td>
                      <td className="py-3 text-muted-foreground">
                        {t.category || "Sem categoria"}
                      </td>
                      <td className="py-3">
                        {t.type === "income" ? (
                          <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                            Receita
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                            Despesa
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 text-right font-medium ${
                          t.type === "income" ? "text-success" : "text-destructive"
                        }`}
                      >
                        R$ {Number(t.amount).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
