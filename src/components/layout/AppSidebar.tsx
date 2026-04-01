import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Calendar, Users, Scissors, DollarSign, BarChart3,
  CreditCard, Camera, TrendingUp, LogOut, Stethoscope, UserCheck, Package,
  MessageCircle, KeyRound,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const mainMenu = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Clientes", url: "/clientes", icon: Users },
];

const managementMenu = [
  { title: "Procedimentos", url: "/procedimentos", icon: Stethoscope },
  { title: "Profissionais", url: "/profissionais", icon: UserCheck },
  { title: "Sessões", url: "/sessoes", icon: Scissors },
  { title: "Antes & Depois", url: "/antes-depois", icon: Camera },
  { title: "Estoque", url: "/estoque", icon: Package },
];

const financeMenu = [
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Crescimento", url: "/growth", icon: TrendingUp },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Assinatura", url: "/billing", icon: CreditCard },
];

function LogoMark({ size = "default" }: { size?: "default" | "small" }) {
  const s = size === "small" ? "h-8 w-8" : "h-9 w-9";
  return (
    <img src="/logo.png" alt="CliniGlow" className={`${s} flex-shrink-0`} />
  );
}

function MenuGroup({ label, items, collapsed }: { label: string; items: typeof mainMenu; collapsed: boolean }) {
  const location = useLocation();
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.url} className={isActive ? "border-l-2 border-primary" : ""}>
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ChangePasswordDialog({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Mínimo 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    } catch {
      toast.error("Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <KeyRound className="h-4 w-4" strokeWidth={1.5} />
          {!collapsed && <span className="ml-2 text-sm">Alterar Senha</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required className="rounded-lg" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar Senha</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha" required className="rounded-lg" />
          </div>
          <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const { user, profile, logout, isPlatformAdmin } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-3">
        <LogoMark />
        {!collapsed && (
          <span className="font-display font-bold text-base text-sidebar-accent-foreground">
            CliniGlow
          </span>
        )}
      </div>

      <SidebarContent className="px-1">
        {isPlatformAdmin && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/admin"}>
                    <Link to="/admin" className={location.pathname === "/admin" ? "border-l-2 border-primary" : ""}>
                      <LayoutDashboard className="h-4 w-4" strokeWidth={1.5} />
                      {!collapsed && <span className="text-sm">Painel Admin</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <MenuGroup label="Principal" items={mainMenu} collapsed={collapsed} />
        <MenuGroup label="Gestão" items={managementMenu} collapsed={collapsed} />
        <MenuGroup label="Finanças" items={financeMenu} collapsed={collapsed} />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold px-3">
            Suporte
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a
                    href="https://wa.me/5541997830046"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                    {!collapsed && <span className="text-sm">WhatsApp</span>}
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {profile?.full_name || "Usuário"}
              </p>
              <p className="text-[11px] text-sidebar-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <div className="space-y-1">
          <ChangePasswordDialog collapsed={collapsed} />
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            className="w-full justify-start text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            {!collapsed && <span className="ml-2 text-sm">Sair</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { LogoMark };
