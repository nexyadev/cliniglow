-- RPC confirm_payment (chamado pelo Admin Dashboard)
CREATE OR REPLACE FUNCTION public.confirm_payment(_payment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _clinic_id UUID;
BEGIN
  UPDATE saas_payments SET status = 'approved', payment_date = now()
  WHERE id = _payment_id
  RETURNING clinic_id INTO _clinic_id;

  IF _clinic_id IS NOT NULL THEN
    UPDATE clinics
    SET subscription_status = 'active',
        plan_expires_at = now() + interval '30 days'
    WHERE id = _clinic_id;
  END IF;
END;
$$;

-- Adicionar campos que as Edge Functions ja usam (caso nao existam)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_payments' AND column_name = 'pix_code') THEN
    ALTER TABLE public.saas_payments ADD COLUMN pix_code TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_payments' AND column_name = 'mp_payment_id') THEN
    ALTER TABLE public.saas_payments ADD COLUMN mp_payment_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saas_payments' AND column_name = 'payment_date') THEN
    ALTER TABLE public.saas_payments ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
  END IF;
END$$;

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_saas_payments_mp_id ON public.saas_payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_saas_payments_clinic_status ON public.saas_payments(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_clinics_status ON public.clinics(subscription_status);
