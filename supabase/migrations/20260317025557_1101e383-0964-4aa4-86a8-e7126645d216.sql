
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============ CLINICS ============
CREATE TABLE public.clinics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_end TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ CLIENTS ============
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- ============ PROCEDURES ============
CREATE TABLE public.procedures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration INTEGER NOT NULL DEFAULT 60,
  commission NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- ============ PROFESSIONALS ============
CREATE TABLE public.professionals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

-- ============ APPOINTMENTS ============
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- ============ SESSIONS ============
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL,
  session_number INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ============ BEFORE_AFTER ============
CREATE TABLE public.before_after (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  image_before TEXT,
  image_after TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;

-- ============ FINANCIAL_RECORDS ============
CREATE TABLE public.financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;

-- ============ PRODUCTS (ESTOQUE) ============
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'pro',
  status TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============ SAAS_PAYMENTS ============
CREATE TABLE public.saas_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 97,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.saas_payments ENABLE ROW LEVEL SECURITY;

-- ============ ADMIN_FINANCIAL ============
CREATE TABLE public.admin_financial (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_financial ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER FUNCTION ============
CREATE OR REPLACE FUNCTION public.get_user_clinic_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = _user_id AND email = 'eduardograbowski10@gmail.com'
  );
$$;

-- ============ RLS POLICIES ============

-- Clinics: owner can see own clinic, admin sees all
CREATE POLICY "Users see own clinic" ON public.clinics FOR SELECT USING (
  owner_id = auth.uid() OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Users update own clinic" ON public.clinics FOR UPDATE USING (
  owner_id = auth.uid()
);
CREATE POLICY "Anyone can create clinic" ON public.clinics FOR INSERT WITH CHECK (true);

-- Profiles
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Clinic-scoped tables RLS macro
-- Clients
CREATE POLICY "Clinic isolation" ON public.clients FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.clients FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.clients FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.clients FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Procedures
CREATE POLICY "Clinic isolation" ON public.procedures FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.procedures FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.procedures FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.procedures FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Professionals
CREATE POLICY "Clinic isolation" ON public.professionals FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.professionals FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.professionals FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.professionals FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Appointments
CREATE POLICY "Clinic isolation" ON public.appointments FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.appointments FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.appointments FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.appointments FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Sessions
CREATE POLICY "Clinic isolation" ON public.sessions FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.sessions FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.sessions FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.sessions FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Before After
CREATE POLICY "Clinic isolation" ON public.before_after FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.before_after FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.before_after FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Financial Records
CREATE POLICY "Clinic isolation" ON public.financial_records FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.financial_records FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.financial_records FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.financial_records FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Products
CREATE POLICY "Clinic isolation" ON public.products FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.products FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.products FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic delete" ON public.products FOR DELETE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Payments
CREATE POLICY "Clinic isolation" ON public.payments FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.payments FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Subscriptions
CREATE POLICY "Clinic isolation" ON public.subscriptions FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.subscriptions FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);
CREATE POLICY "Clinic update" ON public.subscriptions FOR UPDATE USING (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Saas Payments
CREATE POLICY "Clinic isolation" ON public.saas_payments FOR SELECT USING (
  clinic_id = public.get_user_clinic_id(auth.uid()) OR public.is_platform_admin(auth.uid())
);
CREATE POLICY "Clinic insert" ON public.saas_payments FOR INSERT WITH CHECK (
  clinic_id = public.get_user_clinic_id(auth.uid())
);

-- Admin Financial - only platform admin
CREATE POLICY "Admin only" ON public.admin_financial FOR SELECT USING (
  public.is_platform_admin(auth.uid())
);
CREATE POLICY "Admin insert" ON public.admin_financial FOR INSERT WITH CHECK (
  public.is_platform_admin(auth.uid())
);
CREATE POLICY "Admin update" ON public.admin_financial FOR UPDATE USING (
  public.is_platform_admin(auth.uid())
);
CREATE POLICY "Admin delete" ON public.admin_financial FOR DELETE USING (
  public.is_platform_admin(auth.uid())
);

-- ============ TRIGGERS ============
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON public.clinics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professionals_updated_at BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('before-after', 'before-after', true);

CREATE POLICY "Anyone can view before-after images" ON storage.objects FOR SELECT USING (bucket_id = 'before-after');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'before-after' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'before-after' AND auth.uid()::text = (storage.foldername(name))[1]);
