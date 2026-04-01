import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ProcedimentosPage() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "", commission: "" });

  useEffect(() => { if (clinicId) load(); }, [clinicId]);

  const load = async () => {
    const { data } = await supabase.from("procedures").select("*").eq("clinic_id", clinicId!).order("name");
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.name || !clinicId) return;
    const payload = { name: form.name, price: Number(form.price) || 0, duration: Number(form.duration) || 60, commission: Number(form.commission) || 0, clinic_id: clinicId };
    if (editId) {
      const { error } = await supabase.from("procedures").update(payload).eq("id", editId).eq("clinic_id", clinicId!);
      if (error) { toast.error("Erro ao salvar procedimento."); return; }
      toast.success("Procedimento atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("procedures").insert(payload);
      if (error) { toast.error("Erro ao salvar procedimento."); return; }
      toast.success("Procedimento criado com sucesso!");
    }
    resetForm();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este procedimento?")) return;
    await supabase.from("procedures").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Procedimento excluído");
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ name: item.name, price: item.price.toString(), duration: item.duration.toString(), commission: (item.commission || 0).toString() });
    setOpen(true);
  };

  const resetForm = () => {
    setForm({ name: "", price: "", duration: "", commission: "" });
    setEditId(null);
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Procedimentos</h1>
            <p className="text-muted-foreground">{items.length} procedimentos cadastrados</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Procedimento</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Limpeza de Pele" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Duração (min)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} /></div>
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
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-foreground">{item.name}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />R$ {Number(item.price).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.duration} min</span>
                </div>
                {item.commission > 0 && <p className="text-xs text-muted-foreground mt-1">Comissão: {item.commission}%</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
