import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const HOURS = Array.from({ length: 12 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

const statusConfig: Record<string, { label: string; color: string; border: string }> = {
  scheduled: { label: "Agendado", color: "bg-info/10 text-info", border: "border-l-info" },
  confirmed: { label: "Confirmado", color: "bg-primary/10 text-primary", border: "border-l-primary" },
  completed: { label: "Concluído", color: "bg-success/10 text-success", border: "border-l-success" },
  cancelled: { label: "Cancelado", color: "bg-destructive/10 text-destructive", border: "border-l-destructive" },
};

export default function AgendaPage() {
  const { clinicId } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week">("day");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", procedure_id: "", professional_id: "", date: "", time: "", status: "scheduled" });

  useEffect(() => { if (clinicId) loadAll(); }, [clinicId, currentDate]);

  const loadAll = async () => {
    const [{ data: appts }, { data: cl }, { data: pr }, { data: prof }] = await Promise.all([
      supabase.from("appointments").select("*, clients(name), procedures(name, duration), professionals(name)").eq("clinic_id", clinicId!).order("date"),
      supabase.from("clients").select("id, name").eq("clinic_id", clinicId!).order("name"),
      supabase.from("procedures").select("id, name, duration").eq("clinic_id", clinicId!).order("name"),
      supabase.from("professionals").select("id, name").eq("clinic_id", clinicId!).order("name"),
    ]);
    setAppointments(appts || []);
    setClients(cl || []);
    setProcedures(pr || []);
    setProfessionals(prof || []);
  };

  const dateStr = currentDate.toISOString().split("T")[0];
  const dayAppointments = appointments.filter((a) => a.date.startsWith(dateStr));

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === "week" ? dir * 7 : dir));
    setCurrentDate(d);
  };

  const getWeekDates = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const handleAdd = async () => {
    if (!form.client_id || !form.date || !form.time || !clinicId) return;
    const selectedProcedure = procedures.find(p => p.id === form.procedure_id);
    const duration = selectedProcedure?.duration || 60;
    const startTime = new Date(`${form.date}T${form.time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    if (form.professional_id) {
      const conflicts = appointments.filter(a => {
        if (a.professional_id !== form.professional_id) return false;
        const aStart = new Date(a.date);
        const aDuration = a.procedures?.duration || 60;
        const aEnd = new Date(aStart.getTime() + aDuration * 60000);
        return (startTime < aEnd && endTime > aStart);
      });
      if (conflicts.length > 0) {
        toast.error("Conflito de horário! Este profissional já tem atendimento neste horário.");
        return;
      }
    }

    const { error } = await supabase.from("appointments").insert({
      clinic_id: clinicId,
      client_id: form.client_id,
      procedure_id: form.procedure_id || null,
      professional_id: form.professional_id || null,
      date: startTime.toISOString(),
      status: form.status,
    });
    if (error) { toast.error("Erro ao criar atendimento."); return; }
    toast.success("Atendimento agendado!");
    setForm({ client_id: "", procedure_id: "", professional_id: "", date: "", time: "", status: "scheduled" });
    setOpen(false);
    loadAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Atendimento removido");
    loadAll();
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id).eq("clinic_id", clinicId!);
    loadAll();
  };

  const isToday = currentDate.toDateString() === new Date().toDateString();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">Agenda</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {dayAppointments.length} atendimento{dayAppointments.length !== 1 ? "s" : ""} hoje
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full bg-muted/50 p-0.5">
              <button
                onClick={() => setView("day")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${view === "day" ? "bg-primary text-white shadow-sm" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                Dia
              </button>
              <button
                onClick={() => setView("week")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${view === "week" ? "bg-primary text-white shadow-sm" : "bg-card text-muted-foreground hover:text-foreground"}`}
              >
                Semana
              </button>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary border-0 text-white gap-1.5 rounded-lg shadow-sm">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-lg">Novo Atendimento</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Cliente</Label>
                    <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Procedimento</Label>
                    <Select value={form.procedure_id} onValueChange={(v) => setForm({ ...form, procedure_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                      <SelectContent>{procedures.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Profissional</Label>
                    <Select value={form.professional_id} onValueChange={(v) => setForm({ ...form, professional_id: v })}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Selecione o profissional (opcional)" /></SelectTrigger>
                      <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Data</Label>
                      <Input type="date" className="h-10" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Hora</Label>
                      <Input type="time" className="h-10" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleAdd} className="w-full gradient-primary border-0 text-white h-10 rounded-lg font-medium shadow-sm">
                    Adicionar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="font-display font-semibold text-base capitalize text-foreground">
              {view === "day"
                ? currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })
                : `Semana de ${getWeekDates()[0].toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`}
            </p>
            {isToday && view === "day" && (
              <span className="text-xs text-primary font-medium">Hoje</span>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {view === "day" ? (
          <Card className="overflow-hidden border border-border/50 shadow-sm">
            <CardContent className="p-0 divide-y divide-border/50">
              {HOURS.map((hour) => {
                const appts = dayAppointments.filter((a) => {
                  const h = new Date(a.date).getHours().toString().padStart(2, "0");
                  return h === hour.split(":")[0];
                });
                return (
                  <div key={hour} className="flex min-h-[60px]">
                    <div className="w-16 shrink-0 py-3 pr-3 flex items-start justify-end">
                      <span className="text-muted-foreground font-mono text-sm">{hour}</span>
                    </div>
                    <div className="flex-1 py-2 px-2 space-y-1.5 border-l border-border/50">
                      {appts.length > 0 ? appts.map((a) => {
                        const sc = statusConfig[a.status] || statusConfig.scheduled;
                        const time = new Date(a.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <div
                            key={a.id}
                            className={`rounded-lg bg-card border border-border/60 border-l-2 ${sc.border} px-3 py-2 flex items-center justify-between group transition-colors hover:bg-muted/30`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div>
                                <p className="text-sm font-medium text-foreground truncate">{a.clients?.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {a.procedures?.name && (
                                    <span className="text-xs text-muted-foreground">{a.procedures.name}</span>
                                  )}
                                  <span className="text-xs text-muted-foreground/50">|</span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                  </span>
                                  {a.procedures?.duration && (
                                    <>
                                      <span className="text-xs text-muted-foreground/50">|</span>
                                      <span className="text-xs text-muted-foreground">{a.procedures.duration}min</span>
                                    </>
                                  )}
                                  {a.professionals?.name && (
                                    <>
                                      <span className="text-xs text-muted-foreground/50">|</span>
                                      <span className="text-xs text-muted-foreground">{a.professionals.name}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              <Select value={a.status} onValueChange={(v) => handleStatusChange(a.id, v)}>
                                <SelectTrigger className={`h-auto text-xs border-0 rounded-full px-2 py-0.5 w-auto gap-1 ${sc.color}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                      <SelectItem value="scheduled">Agendado</SelectItem>
                                  <SelectItem value="confirmed">Confirmado</SelectItem>
                                  <SelectItem value="completed">Concluído</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(a.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="h-full min-h-[36px]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-x-auto border border-border/50 shadow-sm">
            <CardContent className="p-0">
              <div className="grid grid-cols-8 min-w-[720px]">
                <div className="border-b border-r border-border/50 p-2" />
                {getWeekDates().map((d) => {
                  const isTodayCol = d.toDateString() === new Date().toDateString();
                  return (
                    <div
                      key={d.toISOString()}
                      className={`border-b border-r border-border/50 last:border-r-0 p-2 text-center ${isTodayCol ? "bg-primary/5" : ""}`}
                    >
                      <p className="text-xs text-muted-foreground capitalize font-medium">
                        {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                      </p>
                      <p className={`text-sm font-semibold mt-0.5 ${isTodayCol ? "text-primary" : "text-foreground"}`}>
                        {d.getDate()}
                      </p>
                    </div>
                  );
                })}
                {HOURS.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="border-b border-r border-border/50 p-2 flex items-start justify-end pr-3">
                      <span className="text-muted-foreground font-mono text-sm">{hour}</span>
                    </div>
                    {getWeekDates().map((d) => {
                      const ds = d.toISOString().split("T")[0];
                      const isTodayCol = d.toDateString() === new Date().toDateString();
                      const appts = appointments.filter((a) =>
                        a.date.startsWith(ds) && new Date(a.date).getHours().toString().padStart(2, "0") === hour.split(":")[0]
                      );
                      return (
                        <div
                          key={ds + hour}
                          className={`border-b border-r last:border-r-0 border-border/50 p-1 min-h-[48px] ${isTodayCol ? "bg-primary/[0.02]" : ""}`}
                        >
                          {appts.map((a) => {
                            const sc = statusConfig[a.status] || statusConfig.scheduled;
                            return (
                              <div
                                key={a.id}
                                className={`rounded-md bg-card border border-border/60 border-l-2 ${sc.border} text-xs px-1.5 py-1 mb-1`}
                              >
                                <p className="font-medium text-foreground truncate">{a.clients?.name}</p>
                                {a.procedures?.name && (
                                  <p className="text-muted-foreground truncate">{a.procedures.name}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
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
