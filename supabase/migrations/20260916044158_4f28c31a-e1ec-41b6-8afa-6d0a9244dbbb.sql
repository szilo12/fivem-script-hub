-- CFX account linking
CREATE TABLE public.cfx_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cfx_id text NOT NULL,
  forum_name text,
  status text NOT NULL DEFAULT 'pending',
  verification_code text NOT NULL DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  is_seller boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cfx_accounts TO authenticated;
GRANT ALL ON public.cfx_accounts TO service_role;
ALTER TABLE public.cfx_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own cfx account select" ON public.cfx_accounts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own cfx account insert" ON public.cfx_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own cfx account update" ON public.cfx_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own cfx account delete" ON public.cfx_accounts FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage cfx accounts" ON public.cfx_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER cfx_accounts_updated_at BEFORE UPDATE ON public.cfx_accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seller escrow assets (imported from Keymaster)
CREATE TABLE public.cfx_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_name text NOT NULL,
  display_name text,
  version text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, asset_name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cfx_assets TO authenticated;
GRANT ALL ON public.cfx_assets TO service_role;
ALTER TABLE public.cfx_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins manage cfx assets" ON public.cfx_assets FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER cfx_assets_updated_at BEFORE UPDATE ON public.cfx_assets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Grant queue: which asset must be added to which buyer CFX id
CREATE TABLE public.asset_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id uuid REFERENCES public.licenses(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  cfx_id text,
  asset_name text,
  status text NOT NULL DEFAULT 'pending',
  note text,
  granted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (license_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_grants TO authenticated;
GRANT ALL ON public.asset_grants TO service_role;
ALTER TABLE public.asset_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own asset grants select" ON public.asset_grants FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage asset grants" ON public.asset_grants FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER asset_grants_updated_at BEFORE UPDATE ON public.asset_grants FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();