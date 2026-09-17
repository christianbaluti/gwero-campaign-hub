export type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

export interface Prospect {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  job_title: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
  extra: Record<string, unknown>;
  source_file: string | null;
  created_at: string;
  updated_at: string;
}
export interface Client {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  status: string;
  address: string | null;
  notes: string | null;
  prospect_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface Mailbox {
  id: string;
  name: string;
  from_email: string;
  from_name: string | null;
  provider: string;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_secure: boolean;
  smtp_username: string | null;
  imap_host: string | null;
  imap_port: number | null;
  imap_username: string | null;
  is_default: boolean;
  last_sync_at: string | null;
  last_status: string | null;
  created_at: string;
}
export interface MailboxSecret {
  mailbox_id: string;
  smtp_password: string | null;
  imap_password: string | null;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_expires_at: string | null;
  updated_at: string;
}
export interface Campaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  mailbox_id: string | null;
  cc: string[];
  bcc: string[];
  attachments: Json;
  track_opens: boolean;
  track_clicks: boolean;
  status: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  prospect_id: string;
  status: string;
  error: string | null;
  message_id: string | null;
  sent_at: string | null;
  opened_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  replied_at: string | null;
  created_at: string;
}
export interface Deal {
  id: string;
  title: string;
  client_id: string | null;
  prospect_id: string | null;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  owner: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface Agreement {
  id: string;
  client_id: string;
  deal_id: string | null;
  title: string;
  agreement_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  value: number;
  currency: string;
  billing_cycle: string;
  response_time_hours: number | null;
  resolution_time_hours: number | null;
  coverage_hours: string | null;
  auto_renew: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
export interface AgreementItem {
  id: string;
  agreement_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}
export interface Activity {
  id: string;
  entity_type: string;
  entity_id: string;
  activity_type: string;
  body: string;
  occurred_at: string;
  created_at: string;
  updated_at: string;
}
export interface Reply {
  id: string;
  mailbox_id: string | null;
  prospect_id: string | null;
  campaign_id: string | null;
  from_email: string;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  external_id: string | null;
  created_at: string;
}

export interface Tables {
  prospects: Prospect;
  clients: Client;
  mailboxes: Mailbox;
  mailbox_secrets: MailboxSecret;
  campaigns: Campaign;
  campaign_recipients: CampaignRecipient;
  deals: Deal;
  agreements: Agreement;
  agreement_items: AgreementItem;
  activities: Activity;
  replies: Reply;
}
export type TableName = keyof Tables;
export type AppRow<K extends TableName> = Tables[K] & {
  prospects?: Prospect | null;
  clients?: Client | null;
  campaigns?: Campaign | null;
  campaign_recipients?: CampaignRecipient[];
};
