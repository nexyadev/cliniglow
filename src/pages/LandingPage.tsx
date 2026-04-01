import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/AppSidebar";
import {
  Calendar,
  Users,
  BarChart3,
  CreditCard,
  ChevronRight,
  Star,
  Package,
  Stethoscope,
  Check,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    desc: "Gestão completa de horários com controle de conflitos automático.",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    desc: "Cadastro completo com histórico de procedimentos e sessões.",
  },
  {
    icon: Stethoscope,
    title: "Procedimentos & Sessões",
    desc: "Controle total de tratamentos, durações e comissões.",
  },
  {
    icon: BarChart3,
    title: "Relatórios & Crescimento",
    desc: "Insights automáticos, métricas de crescimento e exportação em PDF.",
  },
  {
    icon: CreditCard,
    title: "Financeiro Completo",
    desc: "Receitas, despesas, lucro e pagamento via PIX integrado.",
  },
  {
    icon: Package,
    title: "Estoque",
    desc: "Controle de produtos com alerta automático de estoque baixo.",
  },
];

const pricingFeatures = [
  "Dashboard completo",
  "Agenda inteligente",
  "Gestão de clientes",
  "Procedimentos & sessões",
  "Profissionais",
  "Fotos antes e depois",
  "Estoque",
  "Financeiro completo",
  "Relatórios e crescimento",
  "Pagamento via PIX",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display font-bold text-xl text-foreground">
              CliniGlow
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              className="gradient-primary border-0 text-primary-foreground hover:opacity-90"
            >
              <Link to="/cadastro">Criar Conta</Link>
            </Button>
          </div>
        </div>
      </nav>

      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              <Star className="h-3.5 w-3.5" /> 7 dias grátis
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-3xl mx-auto">
              Gestão completa para sua
101|              <span className="text-gradient"> clínica de estética</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Agenda, clientes, financeiro, estoque, fotos antes e depois e
105|              muito mais. Tudo em um só lugar, com a simplicidade que você
106|              merece.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                asChild
                className="gradient-primary border-0 text-primary-foreground hover:opacity-90 text-base px-8 h-12"
              >
                <Link to="/cadastro">
                  Começar gratuitamente{" "}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base h-12"
              >
                <Link to="/login">Já tenho conta</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center mb-4">
            Tudo que sua clínica precisa
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Funcionalidades pensadas para clínicas de estética que querem
139|            crescer.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-xl border border-border bg-background p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <div className="h-11 w-11 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Plano simples e transparente
          </h2>
          <p className="text-muted-foreground mb-12">
            Sem surpresas. Comece com 7 dias grátis.
          </p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto rounded-2xl border-2 border-primary/20 bg-background p-8 shadow-elevated"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              Mais popular
            </div>
            <h3 className="font-display text-2xl font-bold mb-1">
              CliniGlow Pro
            </h3>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-4xl font-extrabold text-foreground">
                R$197
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-3 mb-8 text-left">
              {pricingFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              asChild
              className="w-full gradient-primary border-0 text-primary-foreground hover:opacity-90"
            >
              <Link to="/cadastro">Começar 7 dias grátis</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CliniGlow. Todos os direitos
          reservados.
        </div>
      </footer>

      <a
        href="https://wa.me/5541997830046"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-elevated hover:scale-110 transition-transform"
        style={{ backgroundColor: "#25D366" }}
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </a>
    </div>
  );
}
