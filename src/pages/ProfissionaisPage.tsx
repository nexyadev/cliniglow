import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ProfissionaisPage() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", specialty: "", phone: "", email: "" });

  useEffect(() => { if (clinicId) load(); }, [clinicId]);

  const load = async () => {
    const { data } = await supabase.from("professionals").select("*").eq("clinic_id", clinicId!).order("name");
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.name || !clinicId) return;
    const payload = { ...form, clinic_id: clinicId };
    if (editId) {
      const { error } = await supabase.from("professionals").update(payload).eq("id", editId).eq("clinic_id", clinicId!);
      if (error) { toast.error("Erro ao salvar profissional."); return; }
      toast.success("Profissional atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("professionals").insert(payload);
      if (error) { toast.error("Erro ao salvar profissional."); return; }
      toast.success("Profissional adicionado com sucesso!");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este profissional?")) return;
    await supabase.from("professionals").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Profissional excluído");
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ name: item.name, specialty: item.specialty || "", phone: item.phone || "", email: item.email || "" });
    setOpen(true);
  };

  const resetForm = () => { setForm({ name: "", specialty: "", phone: "", email: "" }); setEditId(null); setOpen(false); };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Profissionais</h1>
            <p className="text-muted-foreground">{items.length === 1 ? "1 profissional" : `${items.length} profissionais`}</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Profissional</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" /></div>
                <div className="space-y-2"><Label>Especialidade</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Dermatologia" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary border-0 text-primary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                    {item.specialty && <p className="text-xs text-primary">{item.specialty}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {item.phone && <div className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{item.phone}</div>}
                  {item.email && <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{item.email}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
