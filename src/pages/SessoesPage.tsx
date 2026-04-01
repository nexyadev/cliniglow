import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function SessoesPage() {
  const { clinicId } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", procedure_id: "", session_number: "1" });

  useEffect(() => { if (clinicId) load(); }, [clinicId]);

  const load = async () => {
    const [{ data: sess }, { data: cl }, { data: pr }] = await Promise.all([
      supabase.from("sessions").select("*, clients(name), procedures(name)").eq("clinic_id", clinicId!).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("clinic_id", clinicId!).order("name"),
      supabase.from("procedures").select("id, name").eq("clinic_id", clinicId!).order("name"),
    ]);
    setSessions(sess || []);
    setClients(cl || []);
    setProcedures(pr || []);
  };

  const handleAdd = async () => {
    if (!form.client_id || !clinicId) return;
    const { error } = await supabase.from("sessions").insert({
      clinic_id: clinicId,
      client_id: form.client_id,
      procedure_id: form.procedure_id || null,
      session_number: Number(form.session_number) || 1,
      status: "pending",
    });
    if (error) { toast.error("Erro ao criar sessão."); return; }
    toast.success("Sessão criada com sucesso!");
    setForm({ client_id: "", procedure_id: "", session_number: "1" });
    setOpen(false);
    load();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("sessions").update({ status }).eq("id", id).eq("clinic_id", clinicId!);
    load();
  };

  const statusColors: Record<string, string> = {
    pending: "text-primary bg-primary/10",
    completed: "text-success bg-success/10",
    cancelled: "text-destructive bg-destructive/10",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Sessões</h1>
            <p className="text-muted-foreground">Controle de sessões de tratamento</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Nova Sessão</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Sessão</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Procedimento</Label>
                  <Select value={form.procedure_id} onValueChange={(v) => setForm({ ...form, procedure_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                    <SelectContent>{procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Número da Sessão</Label><Input type="number" value={form.session_number} onChange={(e) => setForm({ ...form, session_number: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full gradient-primary border-0 text-primary-foreground">Adicionar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Procedimento</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Sessão #</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Data</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-4 text-sm font-medium">{s.clients?.name || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{s.procedures?.name || "—"}</td>
                      <td className="p-4 text-sm font-medium">#{s.session_number}</td>
                      <td className="p-4 text-sm text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-4">
                        <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                          <SelectTrigger className={`h-7 text-xs w-auto border-0 rounded-full px-3 ${statusColors[s.status] || ""}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
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
