import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Camera, MessageCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AntesDepoisPage() {
  const { clinicId, user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: "", notes: "" });
  const [fileBefore, setFileBefore] = useState<File | null>(null);
  const [fileAfter, setFileAfter] = useState<File | null>(null);
  const [previewBefore, setPreviewBefore] = useState("");
  const [previewAfter, setPreviewAfter] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (clinicId) load(); }, [clinicId]);

  const load = async () => {
    const [{ data: recs }, { data: cl }] = await Promise.all([
      supabase.from("before_after").select("*, clients(name)").eq("clinic_id", clinicId!).order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name").eq("clinic_id", clinicId!).order("name"),
    ]);
    setRecords(recs || []);
    setClients(cl || []);
  };

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user?.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("before-after").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("before-after").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async () => {
    if (!form.client_id || !clinicId) return;
    setUploading(true);
    try {
      let imageBefore = null;
      let imageAfter = null;
      if (fileBefore) imageBefore = await uploadFile(fileBefore, "before");
      if (fileAfter) imageAfter = await uploadFile(fileAfter, "after");

      const { error } = await supabase.from("before_after").insert({
        clinic_id: clinicId,
        client_id: form.client_id,
        image_before: imageBefore,
        image_after: imageAfter,
        notes: form.notes || null,
      });
      if (error) throw error;
      toast.success("Registro salvo!");
      resetForm();
      load();
    } catch (err: any) {
      toast.error("Erro ao salvar registro.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    await supabase.from("before_after").delete().eq("id", id).eq("clinic_id", clinicId!);
    toast.success("Removido");
    load();
  };

  const resetForm = () => {
    setForm({ client_id: "", notes: "" });
    setFileBefore(null);
    setFileAfter(null);
    setPreviewBefore("");
    setPreviewAfter("");
    setOpen(false);
  };

  const handleFileChange = (file: File | null, type: "before" | "after") => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === "before") { setFileBefore(file); setPreviewBefore(url); }
    else { setFileAfter(file); setPreviewAfter(url); }
  };

  const sendWhatsApp = (clientName: string) => {
    const msg = encodeURIComponent(`Olá ${clientName}! Confira o resultado do seu tratamento na CliniGlow! 🌟`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Antes & Depois</h1>
            <p className="text-muted-foreground">Registre a evolução dos seus clientes</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary border-0 text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Novo Registro</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Novo Registro</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Foto Antes</Label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      {previewBefore ? <img src={previewBefore} className="h-full w-full object-cover rounded-lg" /> : <><Camera className="h-8 w-8 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Enviar foto</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null, "before")} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Foto Depois</Label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                      {previewAfter ? <img src={previewAfter} className="h-full w-full object-cover rounded-lg" /> : <><Camera className="h-8 w-8 text-muted-foreground mb-1" /><span className="text-xs text-muted-foreground">Enviar foto</span></>}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files?.[0] || null, "after")} />
                    </label>
                  </div>
                </div>
                <Button onClick={handleAdd} disabled={uploading} className="w-full gradient-primary border-0 text-primary-foreground">
                  {uploading ? "Enviando..." : "Salvar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((r) => (
            <Card key={r.id} className="shadow-card overflow-hidden">
              <div className="grid grid-cols-2">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {r.image_before ? <img src={r.image_before} className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
                  <span className="absolute top-2 left-2 bg-foreground/70 text-background text-xs px-2 py-0.5 rounded">Antes</span>
                </div>
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  {r.image_after ? <img src={r.image_after} className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
                  <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">Depois</span>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="font-medium text-foreground">{r.clients?.name || "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => sendWhatsApp(r.clients?.name || "")}>
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
