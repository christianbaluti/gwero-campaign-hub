
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text,
  last_name text,
  company text,
  job_title text,
  phone text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_file text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX prospects_email_key ON public.prospects (lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prospects TO anon, authenticated;
GRANT ALL ON public.prospects TO service_role;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace prospects" ON public.prospects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.mailboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  from_email text NOT NULL,
  from_name text,
  provider text NOT NULL DEFAULT 'smtp',
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_secure boolean NOT NULL DEFAULT false,
  smtp_username text,
  imap_host text,
  imap_port integer DEFAULT 993,
  imap_username text,
  is_default boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  last_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mailboxes TO anon, authenticated;
GRANT ALL ON public.mailboxes TO service_role;
ALTER TABLE public.mailboxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace mailboxes" ON public.mailboxes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.mailbox_secrets (
  mailbox_id uuid PRIMARY KEY REFERENCES public.mailboxes(id) ON DELETE CASCADE,
  smtp_password text,
  imap_password text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.mailbox_secrets TO service_role;
ALTER TABLE public.mailbox_secrets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  mailbox_id uuid REFERENCES public.mailboxes(id) ON DELETE SET NULL,
  cc text[] NOT NULL DEFAULT '{}',
  bcc text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  track_opens boolean NOT NULL DEFAULT true,
  track_clicks boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO anon, authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace campaigns" ON public.campaigns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  error text,
  message_id text,
  sent_at timestamptz,
  opened_at timestamptz,
  open_count integer NOT NULL DEFAULT 0,
  clicked_at timestamptz,
  click_count integer NOT NULL DEFAULT 0,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, prospect_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO anon, authenticated;
GRANT ALL ON public.campaign_recipients TO service_role;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace recipients" ON public.campaign_recipients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mailbox_id uuid REFERENCES public.mailboxes(id) ON DELETE SET NULL,
  prospect_id uuid REFERENCES public.prospects(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  from_email text NOT NULL,
  subject text,
  snippet text,
  received_at timestamptz NOT NULL DEFAULT now(),
  external_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.replies TO anon, authenticated;
GRANT ALL ON public.replies TO service_role;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared workspace replies" ON public.replies FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX campaign_recipients_campaign_idx ON public.campaign_recipients (campaign_id);
CREATE INDEX replies_prospect_idx ON public.replies (prospect_id);
