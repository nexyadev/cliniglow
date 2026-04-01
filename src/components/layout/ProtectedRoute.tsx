import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { user, clinic, isLoading, isProfileLoaded, isPlatformAdmin, clinicId } = useAuth();
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setWaitedTooLong(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isPlatformAdmin) {
    return <>{children}</>;
  }

  if (!isProfileLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando perfil...
      </div>
    );
  }

  if (!clinic) {
    if (waitedTooLong) {
      return <Navigate to="/billing" replace />;
    }
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando dados da clínica...
      </div>
    );
  }

  const now = new Date();

  const hasAccess =
    (clinic.subscription_status === "active" &&
      (!clinic.plan_expires_at || new Date(clinic.plan_expires_at) > now)) ||
    (clinic.subscription_status === "trial" &&
      clinic.trial_end &&
      new Date(clinic.trial_end) > now);

  if (!hasAccess) {
    return <Navigate to="/billing" replace />;
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: Props) {
  const { user, isLoading, isPlatformAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
