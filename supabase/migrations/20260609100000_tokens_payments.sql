-- =========== TOKEN PACKAGES ===========
CREATE TABLE public.token_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tokens INT NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  description TEXT,
  badge TEXT, -- e.g. "Best Value"
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Token packages are public" ON public.token_packages FOR SELECT USING (true);
CREATE POLICY "Admins manage token packages" ON public.token_packages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =========== TOKEN TRANSACTIONS ===========
-- amount > 0 = credit (purchase/grant), amount < 0 = debit (usage)
CREATE TABLE public.token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL DEFAULT 'purchase' CHECK(type IN ('purchase','usage','grant','refund','admin_adjust')),
  description TEXT,
  package_id UUID REFERENCES public.token_packages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.token_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own transactions" ON public.token_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all transactions" ON public.token_transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins create transactions" ON public.token_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_token_tx_user ON public.token_transactions(user_id);

-- =========== TOKEN COST ON COURSES ===========
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS token_cost INT NOT NULL DEFAULT 0;

-- =========== SEED PACKAGES ===========
INSERT INTO public.token_packages (name, tokens, price_usd, description, badge) VALUES
  ('Starter',        50,   4.99,  'Try out premium courses',                  NULL),
  ('Basic',         150,  12.99,  'Great for a focused learning sprint',       NULL),
  ('Pro',           500,  34.99,  'For serious learners',                      'Best Value'),
  ('Unlimited Pass',2000, 99.99,  'Full platform access for power learners',   'Most Popular')
ON CONFLICT DO NOTHING;
