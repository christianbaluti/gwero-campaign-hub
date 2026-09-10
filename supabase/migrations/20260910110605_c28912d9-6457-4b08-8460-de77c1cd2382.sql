CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text,
  email text,
  phone text,
  website text,
  industry text,
  status text NOT NULL DEFAULT 'active',
  address text,
  notes text,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO anon, authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  stage text NOT NULL DEFAULT 'new',
  probability integer NOT NULL DEFAULT 20,
  expected_close_date date,
  owner text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO anon, authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace deals" ON public.deals FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  agreement_type text NOT NULL DEFAULT 'contract',
  status text NOT NULL DEFAULT 'active',
  start_date date,
  end_date date,
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  response_time_hours integer,
  resolution_time_hours integer,
  coverage_hours text,
  auto_renew boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agreements TO anon, authenticated;
GRANT ALL ON public.agreements TO service_role;
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace agreements" ON public.agreements FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.agreement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id uuid NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agreement_items TO anon, authenticated;
GRANT ALL ON public.agreement_items TO service_role;
ALTER TABLE public.agreement_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace agreement items" ON public.agreement_items FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  activity_type text NOT NULL DEFAULT 'note',
  body text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Shared workspace activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_deals_client ON public.deals(client_id);
CREATE INDEX idx_agreements_client ON public.agreements(client_id);
CREATE INDEX idx_agreement_items_agreement ON public.agreement_items(agreement_id);
CREATE INDEX idx_activities_entity ON public.activities(entity_type, entity_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agreements_updated BEFORE UPDATE ON public.agreements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_agreement_items_updated BEFORE UPDATE ON public.agreement_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_activities_updated BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();