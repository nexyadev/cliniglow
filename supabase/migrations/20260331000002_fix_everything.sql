-- =============================================
-- CLINIGLOW - MIGRATION COMPLETA DE CORRECAO
-- Limpa policies duplicadas, configura RLS correto
-- =============================================

-- 1. HANDLE NEW USER - melhorar trigger para ja associar clinic_id se existir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. LIMPAR POLICIES DUPLICADAS EM CLINICS
DROP POLICY IF EXISTS "allow_all_clinics" ON clinics;
DROP POLICY IF EXISTS "clinic_owner" ON clinics;
DROP POLICY IF EXISTS "insert clinic" ON clinics;
DROP POLICY IF EXISTS "Authenticated users can create clinic" ON clinics;
DROP POLICY IF EXISTS "Users can read own clinic" ON clinics;
DROP POLICY IF EXISTS "Users can update own clinic" ON clinics;

CREATE POLICY "clinics_select" ON clinics FOR SELECT
  USING (owner_id = auth.uid() OR is_platform_admin(auth.uid()));

CREATE POLICY "clinics_insert" ON clinics FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "clinics_update" ON clinics FOR UPDATE
  USING (owner_id = auth.uid() OR is_platform_admin(auth.uid()));

CREATE POLICY "clinics_delete" ON clinics FOR DELETE
  USING (is_platform_admin(auth.uid()));

-- 3. LIMPAR POLICIES DUPLICADAS EM PROFILES
DROP POLICY IF EXISTS "allow_all_profiles" ON profiles;
DROP POLICY IF EXISTS "profile_own" ON profiles;
DROP POLICY IF EXISTS "insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow insert on signup" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_platform_admin(auth.uid()));

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid() OR is_platform_admin(auth.uid()));

-- 4. LIMPAR POLICIES DUPLICADAS EM CLIENTS
DROP POLICY IF EXISTS "allow_all_clients" ON clients;
DROP POLICY IF EXISTS "clients_isolation" ON clients;

CREATE POLICY "clients_policy" ON clients FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 5. LIMPAR POLICIES DUPLICADAS EM APPOINTMENTS
DROP POLICY IF EXISTS "appointments_isolation" ON appointments;
DROP POLICY IF EXISTS "appointments access" ON appointments;

CREATE POLICY "appointments_policy" ON appointments FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 6. LIMPAR POLICIES DUPLICADAS EM FINANCIAL_RECORDS
DROP POLICY IF EXISTS "financial_isolation" ON financial_records;
DROP POLICY IF EXISTS "financial access" ON financial_records;

CREATE POLICY "financial_records_policy" ON financial_records FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 7. LIMPAR POLICIES DUPLICADAS EM SESSIONS
DROP POLICY IF EXISTS "sessions_isolation" ON sessions;
DROP POLICY IF EXISTS "sessions access" ON sessions;

CREATE POLICY "sessions_policy" ON sessions FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 8. PROCEDURES - ja ok, so adicionar admin check
DROP POLICY IF EXISTS "procedures access" ON procedures;

CREATE POLICY "procedures_policy" ON procedures FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 9. PROFESSIONALS
DROP POLICY IF EXISTS "professionals access" ON professionals;

CREATE POLICY "professionals_policy" ON professionals FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 10. PRODUCTS
DROP POLICY IF EXISTS "products access" ON products;

CREATE POLICY "products_policy" ON products FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 11. BEFORE_AFTER
DROP POLICY IF EXISTS "before_after access" ON before_after;

CREATE POLICY "before_after_policy" ON before_after FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 12. PAYMENTS
DROP POLICY IF EXISTS "payments access" ON payments;

CREATE POLICY "payments_policy" ON payments FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 13. SAAS_PAYMENTS - usuario pode ler os seus, admin pode tudo
DROP POLICY IF EXISTS "saas payments access" ON saas_payments;

CREATE POLICY "saas_payments_select" ON saas_payments FOR SELECT
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

CREATE POLICY "saas_payments_insert" ON saas_payments FOR INSERT
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

CREATE POLICY "saas_payments_update" ON saas_payments FOR UPDATE
  USING (is_platform_admin(auth.uid()));

-- 14. SUBSCRIPTIONS
DROP POLICY IF EXISTS "subscriptions access" ON subscriptions;

CREATE POLICY "subscriptions_policy" ON subscriptions FOR ALL
  USING (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()))
  WITH CHECK (clinic_id = get_user_clinic_id(auth.uid()) OR is_platform_admin(auth.uid()));

-- 15. ADMIN_FINANCIAL - somente admin
CREATE POLICY "admin_financial_policy" ON admin_financial FOR ALL
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

-- 16. SERVICE_ROLE GRANTS (para Edge Functions)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 17. ANON e AUTHENTICATED grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 18. STORAGE POLICIES para before-after
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'before_after_upload') THEN
    CREATE POLICY "before_after_upload" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'before-after' AND auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'before_after_select') THEN
    CREATE POLICY "before_after_select" ON storage.objects FOR SELECT
      USING (bucket_id = 'before-after');
  END IF;
END$$;

-- 19. INDICES para performance
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_clinics_owner_id ON clinics(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_date ON appointments(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_clients_clinic_id ON clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_clinic_id ON financial_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_saas_payments_clinic_status ON saas_payments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_saas_payments_mp_id ON saas_payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON clinics(subscription_status);
