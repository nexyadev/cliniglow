import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/layout/AppSidebar";
import { toast } from "sonner";
import { Lock, Check } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Digite seu e-mail");
    if (!password.trim()) return toast.error("Digite sua senha");

    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login realizado com sucesso!");
    } catch (err: any) {
      toast.error("E-mail ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return toast.error("Digite seu e-mail");

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("E-mail de recuperação enviado!");
      setForgotPassword(false);
    } catch (err: any) {
      toast.error("Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-1/2 gradient-primary min-h-screen items-center justify-center p-12">
        <div className="max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CliniGlow" className="h-11 w-11 flex-shrink-0" />
            <span className="font-display font-bold text-2xl text-white">CliniGlow</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-white leading-tight">
            Gestão completa para sua clínica
          </h2>

          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">Agenda inteligente</span>
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">Financeiro completo</span>
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">Relatórios automáticos</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md shadow-elevated border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4">
              <LogoMark />
            </div>
            <CardTitle className="font-display text-2xl">
              {forgotPassword ? "Recuperar Senha" : "Entrar"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {forgotPassword
                ? "Digite seu e-mail para receber o link"
                : "Acesse sua conta"}
            </p>
          </CardHeader>

          <CardContent>
            {forgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary border-0 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Enviar link"}
                </Button>

                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="w-full text-sm text-primary hover:underline"
                >
                  Voltar ao login
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="rounded-lg pr-10"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary border-0 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>

                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="w-full text-sm text-primary hover:underline mt-3"
                >
                  Esqueci minha senha
                </button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Não tem conta?{" "}
                  <Link to="/cadastro" className="text-primary font-medium hover:underline">
                    Criar conta
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
