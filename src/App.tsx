import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute, AdminRoute } from "@/components/layout/ProtectedRoute";

// Páginas
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CadastroPage from "./pages/CadastroPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import DashboardPage from "./pages/DashboardPage";
import AgendaPage from "./pages/AgendaPage";
import ClientesPage from "./pages/ClientesPage";
import ProcedimentosPage from "./pages/ProcedimentosPage";
import ProfissionaisPage from "./pages/ProfissionaisPage";
import SessoesPage from "./pages/SessoesPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import GrowthPage from "./pages/GrowthPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import AntesDepoisPage from "./pages/AntesDepoisPage";
import EstoquePage from "./pages/EstoquePage";

import BillingPage from "./pages/BillingPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
const { user, isPlatformAdmin, isLoading } = useAuth();

if (isLoading) {
return (
<div className="flex min-h-screen items-center justify-center">
Carregando sistema...
</div>
);
}

return (
<Routes>

{/* ROOT */}
<Route
path="/"
element={
user
? <Navigate to={isPlatformAdmin ? "/admin" : "/dashboard"} replace />
: <LandingPage />
}
/>

{/* PUBLIC */}
<Route
path="/login"
element={
user
? <Navigate to={isPlatformAdmin ? "/admin" : "/dashboard"} replace />
: <LoginPage />
}
/>

<Route
path="/cadastro"
element={
user
? <Navigate to="/dashboard" replace />
: <CadastroPage />
}
/>

<Route path="/reset-password" element={<ResetPasswordPage />} />

{/* 🔥 BILLING (NÃO PROTEGIDO) */}
<Route
path="/billing"
element={
user
? <BillingPage />
: <Navigate to="/login" replace />
}
/>

{/* 🔒 PROTECTED */}
<Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
<Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
<Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
<Route path="/procedimentos" element={<ProtectedRoute><ProcedimentosPage /></ProtectedRoute>} />
<Route path="/profissionais" element={<ProtectedRoute><ProfissionaisPage /></ProtectedRoute>} />
<Route path="/sessoes" element={<ProtectedRoute><SessoesPage /></ProtectedRoute>} />
<Route path="/financeiro" element={<ProtectedRoute><FinanceiroPage /></ProtectedRoute>} />
<Route path="/growth" element={<ProtectedRoute><GrowthPage /></ProtectedRoute>} />
<Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
<Route path="/antes-depois" element={<ProtectedRoute><AntesDepoisPage /></ProtectedRoute>} />
<Route path="/estoque" element={<ProtectedRoute><EstoquePage /></ProtectedRoute>} />

{/* 🔐 ADMIN */}
<Route
path="/admin"
element={
<AdminRoute>
<AdminDashboardPage />
</AdminRoute>
}
/>

{/* FALLBACK */}
<Route path="*" element={<NotFound />} />

</Routes>
);
}

const App = () => {
return (
<QueryClientProvider client={queryClient}>
<TooltipProvider>
<Toaster />
<Sonner />
<BrowserRouter>
<AuthProvider>
<AppRoutes />
</AuthProvider>
</BrowserRouter>
</TooltipProvider>
</QueryClientProvider>
);
};

export default App;