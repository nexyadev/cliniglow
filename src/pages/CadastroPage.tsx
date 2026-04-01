import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/layout/AppSidebar";
import { toast } from "sonner";
import { Check, Mail } from "lucide-react";

export default function CadastroPage() {
  const [name, setName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register } = useAuth();

  const formatWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Digite seu nome");
    if (!clinicName.trim()) return toast.error("Digite o nome da clínica");
    const whatsappDigits = whatsapp.replace(/\D/g, "");
    if (whatsappDigits.length < 10) return toast.error("WhatsApp inválido");
    if (!email.includes("@")) return toast.error("E-mail inválido");
    if (password.length < 6)
      return toast.error("A senha deve ter pelo menos 6 caracteres");

    setLoading(true);

    try {
      await register(name, email, password, clinicName, whatsappDigits);
      setEmailSent(true);
      toast.success("Conta criada! Verifique seu e-mail.");
    } catch (err: any) {
      console.error(err);

      if (err.message?.includes("already registered")) {
        toast.error("Esse e-mail já está cadastrado.");
      } else {
        toast.error("Erro ao criar conta. Tente novamente.");
      }
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
            Comece gratuitamente
          </h2>

          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">7 dias grátis</span>
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">Sem cartão de crédito</span>
            </li>
            <li className="flex items-center gap-3 text-white/90">
              <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-base">Cancele quando quiser</span>
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
            {emailSent ? (
              <>
                <div className="mx-auto mb-2 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="font-display text-2xl">
                  Verifique seu e-mail
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Enviamos um link de confirmação para
                </p>
                <p className="text-sm font-semibold text-foreground">{email}</p>
              </>
            ) : (
              <>
                <CardTitle className="font-display text-2xl">
                  Criar Conta
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comece com 7 dias grátis
                </p>
              </>
            )}
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Clique no link do e-mail para ativar sua conta. Depois volte aqui e faça login.
                </p>
                <Link to="/login">
                  <Button className="w-full gradient-primary border-0 text-primary-foreground">
                    Ir para Login
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground">
                  Não recebeu? Verifique sua caixa de spam.
                </p>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Nome da Clínica</Label>
                    <Input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="Nome da sua clínica"
                      className="rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>WhatsApp da Clínica</Label>
                    <Input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className="rounded-lg"
                    />
                  </div>

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
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary border-0 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? "Criando..." : "Criar Conta Grátis"}
                  </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Já tem conta?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Entrar
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
