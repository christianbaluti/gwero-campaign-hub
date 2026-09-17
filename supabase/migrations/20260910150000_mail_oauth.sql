ALTER TABLE public.mailboxes ADD CONSTRAINT mailboxes_from_email_key UNIQUE (from_email);
ALTER TABLE public.mailbox_secrets
  ADD COLUMN oauth_access_token text,
  ADD COLUMN oauth_refresh_token text,
  ADD COLUMN oauth_expires_at timestamptz;
