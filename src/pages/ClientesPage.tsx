import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ClientesPage() {
  const { clinicId } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", birth_date: "", notes: "" });
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => { if (clinicId) loadClients(); }, [clinicId]);

  const loadClients = async () => {
    const { data } = await supabase.from("clients").select("*").eq("clinic_id", clinicId!).order("name");
    setClients(data || []);
  };

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error("Digite o nome do cliente");
    if (editId) {
      const { error } = await supabase.from("clients").update(form).eq("id", editId).eq("clinic_id", clinicId!);
      if (error) { toast.error("Erro ao salvar cliente."); return; }
      toast.success("Cliente atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("clients").insert({ ...form, clinic_id: clinicId });
      if (error) { toast.error("Erro ao salvar cliente."); return; }
      toast.success("Cliente adicionado com sucesso!");
    }
    setForm({ name: "", phone: "", email: "", birth_date: "", notes: "" });
    setEditId(null);
    setOpen(false);
    loadClients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await supabase.from("clients").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Cliente excluído com sucesso");
    loadClients();
  };

  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone || "", email: c.email || "", birth_date: c.birth_date || "", notes: c.notes || "" });
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">{clients.length} clientes cadastrados</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", phone: "", email: "", birth_date: "", notes: "" }); } }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" /></div>
                  <div className="space-y-2"><Label>Nascimento</Label><Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" /></div>
                <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Alergias, preferências..." /></div>
                <Button onClick={handleSave} className="w-full gradient-primary border-0 text-primary-foreground">{editId ? "Salvar" : "Adicionar"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 mb-3 cursor-pointer" onClick={() => setSelected(c)}>
                    <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      {c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                {c.phone && <div className="flex items-center gap-1 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" />{c.phone}</div>}
                {c.notes && <p className="mt-2 text-xs text-muted-foreground bg-muted rounded px-2 py-1">{c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
            {selected && (
              <div className="space-y-3 pt-2">
                {selected.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {selected.email}</div>}
                {selected.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {selected.phone}</div>}
                {selected.birth_date && <div className="text-sm text-muted-foreground">Nascimento: {new Date(selected.birth_date).toLocaleDateString("pt-BR")}</div>}
                {selected.notes && <div className="text-sm bg-muted rounded-lg p-3">{selected.notes}</div>}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
