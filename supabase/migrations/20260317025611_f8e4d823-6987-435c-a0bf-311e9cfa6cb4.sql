
-- Fix overly permissive INSERT policy on clinics
DROP POLICY "Anyone can create clinic" ON public.clinics;
CREATE POLICY "Authenticated users can create clinic" ON public.clinics FOR INSERT WITH CHECK (auth.uid() = owner_id);
