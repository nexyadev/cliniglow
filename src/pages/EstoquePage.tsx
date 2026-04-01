import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle, Package, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function EstoquePage() {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", quantity: "", min_quantity: "5" });

  useEffect(() => { if (clinicId) load(); }, [clinicId]);

  const load = async () => {
    const { data } = await supabase.from("products").select("*").eq("clinic_id", clinicId!).order("name");
    setItems(data || []);
  };

  const handleSave = async () => {
    if (!form.name || !clinicId) return;
    const payload = { name: form.name, price: Number(form.price) || 0, quantity: Number(form.quantity) || 0, min_quantity: Number(form.min_quantity) || 5, clinic_id: clinicId };
    if (editId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editId).eq("clinic_id", clinicId!);
      if (error) { toast.error("Erro ao salvar produto."); return; }
      toast.success("Produto atualizado com sucesso!");
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Erro ao salvar produto."); return; }
      toast.success("Produto adicionado com sucesso!");
    }
    resetForm();
    load();
  };

  const handleSell = async (item: any) => {
    if (item.quantity <= 0) { toast.error("Sem estoque!"); return; }
    await supabase.from("products").update({ quantity: item.quantity - 1 }).eq("id", item.id).eq("clinic_id", clinicId!);
    // Register income
    await supabase.from("financial_records").insert({
      clinic_id: clinicId!,
      type: "income",
      amount: item.price,
      description: `Venda: ${item.name}`,
      category: "produto",
    });
    toast.success(`Venda registrada: ${item.name}`);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Produto excluído");
  };

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({ name: item.name, price: item.price.toString(), quantity: item.quantity.toString(), min_quantity: (item.min_quantity || 5).toString() });
    setOpen(true);
  };

  const resetForm = () => { setForm({ name: "", price: "", quantity: "", min_quantity: "5" }); setEditId(null); setOpen(false); };

  const lowStock = items.filter(i => i.quantity <= (i.min_quantity || 5));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Estoque</h1>
            <p className="text-muted-foreground">{items.length} produtos</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo Produto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Produto</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" /></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Quantidade</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Estoque Mínimo</Label><Input type="number" value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} /></div>
                </div>
                <Button onClick={handleSave} className="w-full gradient-primary border-0 text-primary-foreground">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lowStock.length > 0 && (
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground text-sm">Estoque Baixo</p>
                <p className="text-xs text-muted-foreground">{lowStock.map(i => i.name).join(", ")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className={`shadow-card hover:shadow-card-hover transition-shadow ${item.quantity <= (item.min_quantity || 5) ? "border-warning/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h3 className="font-medium text-foreground">{item.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">R$ {Number(item.price).toLocaleString()}</span>
                  <span className={`font-semibold ${item.quantity <= (item.min_quantity || 5) ? "text-warning" : "text-foreground"}`}>
                    {item.quantity} un.
                  </span>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => handleSell(item)}>
                  <Minus className="h-3.5 w-3.5" /> Registrar Venda
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
