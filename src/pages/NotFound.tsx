import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/layout/AppSidebar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6">
        <LogoMark size="small" />
      </div>
      <h1 className="font-display text-6xl font-extrabold text-foreground mb-2">404</h1>
      <p className="text-xl font-medium text-foreground mb-2">Página não encontrada</p>
      <p className="text-muted-foreground mb-8 max-w-sm">A página que você está procurando não existe ou foi movida.</p>
      <Button asChild className="gradient-primary border-0 text-white px-8">
        <a href="/">Voltar ao início</a>
      </Button>
    </div>
  );
};

export default NotFound;
