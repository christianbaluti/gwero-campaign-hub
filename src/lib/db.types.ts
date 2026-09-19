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

export interface Quotation {
  id: string;
  quote_number: string;
  title: string;
  client_id: string|null;
  deal_id: string|null;
  status: string;
  currency: string;
  issue_date: string|null;
  valid_until: string|null;
  tax_rate: number;
  discount: number;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
}
export interface Project {
  id: string;
  name: string;
  code: string|null;
  client_id: string|null;
  manager: string|null;
  status: string;
  start_date: string|null;
  end_date: string|null;
  budget: number;
  currency: string;
  progress: number;
  description: string|null;
  created_at: string;
  updated_at: string;
}
export interface Bid {
  id: string;
  reference: string|null;
  title: string;
  buyer: string|null;
  client_id: string|null;
  status: string;
  closing_date: string|null;
  submission_date: string|null;
  value: number;
  currency: string;
  bond_amount: number;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface CostSheet {
  id: string;
  name: string;
  client_id: string|null;
  quotation_id: string|null;
  bid_id: string|null;
  project_id: string|null;
  status: string;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface CostSheetItem {
  id: string;
  cost_sheet_id: string;
  category: string;
  description: string;
  quantity: number;
  unit_cost: number;
  markup_percent: number;
  created_at: string;
  updated_at: string;
}
export interface Job {
  id: string;
  title: string;
  client_id: string|null;
  project_id: string|null;
  job_type: string;
  assignee: string|null;
  priority: string;
  status: string;
  scheduled_date: string|null;
  completed_at: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Task {
  id: string;
  title: string;
  entity_type: string;
  entity_id: string|null;
  assignee: string|null;
  priority: string;
  status: string;
  due_date: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Supplier {
  id: string;
  name: string;
  contact_name: string|null;
  email: string|null;
  phone: string|null;
  category: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string|null;
  project_id: string|null;
  status: string;
  order_date: string|null;
  expected_date: string|null;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  received_quantity: number;
  created_at: string;
  updated_at: string;
}
export interface Prequalification {
  id: string;
  reference: string|null;
  buyer: string;
  category: string|null;
  submission_type: string;
  status: string;
  submitted_date: string|null;
  valid_until: string|null;
  outcome: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Request {
  id: string;
  reference: string|null;
  title: string;
  issuer: string|null;
  client_id: string|null;
  request_type: string;
  status: string;
  received_date: string|null;
  due_date: string|null;
  value: number;
  currency: string;
  scope: string|null;
  created_at: string;
  updated_at: string;
}
export interface MarketingActivity {
  id: string;
  name: string;
  channel: string;
  status: string;
  start_date: string|null;
  end_date: string|null;
  budget: number;
  spend: number;
  leads: number;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Document {
  id: string;
  title: string;
  category: string;
  entity_type: string;
  entity_id: string|null;
  owner: string|null;
  version: string|null;
  file_url: string|null;
  issue_date: string|null;
  expiry_date: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Vacancy {
  id: string;
  title: string;
  department: string|null;
  employment_type: string;
  status: string;
  openings: number;
  location: string|null;
  closing_date: string|null;
  description: string|null;
  created_at: string;
  updated_at: string;
}
export interface Applicant {
  id: string;
  vacancy_id: string|null;
  full_name: string;
  email: string|null;
  phone: string|null;
  stage: string;
  rating: number;
  resume_url: string|null;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Employee {
  id: string;
  employee_number: string|null;
  full_name: string;
  email: string|null;
  phone: string|null;
  job_title: string|null;
  department: string|null;
  employment_type: string;
  status: string;
  start_date: string|null;
  end_date: string|null;
  base_salary: number;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface LeaveRequest {
  id: string;
  employee_id: string|null;
  leave_type: string;
  start_date: string|null;
  end_date: string|null;
  days: number;
  status: string;
  reason: string|null;
  created_at: string;
  updated_at: string;
}
export interface PayrollRun {
  id: string;
  period: string;
  pay_date: string|null;
  status: string;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface PayrollItem {
  id: string;
  payroll_run_id: string;
  employee_id: string|null;
  gross: number;
  allowances: number;
  deductions: number;
  tax: number;
  net: number;
  created_at: string;
  updated_at: string;
}
export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string|null;
  quotation_id: string|null;
  project_id: string|null;
  status: string;
  issue_date: string|null;
  due_date: string|null;
  amount: number;
  tax: number;
  paid_amount: number;
  currency: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Expense {
  id: string;
  description: string;
  category: string;
  vendor: string|null;
  amount: number;
  currency: string;
  expense_date: string|null;
  project_id: string|null;
  status: string;
  notes: string|null;
  created_at: string;
  updated_at: string;
}
export interface Payment {
  id: string;
  invoice_id: string|null;
  amount: number;
  currency: string;
  paid_at: string|null;
  method: string|null;
  reference: string|null;
  created_at: string;
  updated_at: string;
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
  quotations: Quotation;
  quotation_items: QuotationItem;
  projects: Project;
  bids: Bid;
  cost_sheets: CostSheet;
  cost_sheet_items: CostSheetItem;
  jobs: Job;
  tasks: Task;
  suppliers: Supplier;
  purchase_orders: PurchaseOrder;
  purchase_order_items: PurchaseOrderItem;
  prequalifications: Prequalification;
  requests: Request;
  marketing_activities: MarketingActivity;
  documents: Document;
  vacancies: Vacancy;
  applicants: Applicant;
  employees: Employee;
  leave_requests: LeaveRequest;
  payroll_runs: PayrollRun;
  payroll_items: PayrollItem;
  invoices: Invoice;
  expenses: Expense;
  payments: Payment;
}
export type TableName = keyof Tables;
export type AppRow<K extends TableName> = Tables[K] & {
  prospects?: Prospect | null;
  clients?: Client | null;
  campaigns?: Campaign | null;
  campaign_recipients?: CampaignRecipient[];
  projects?: Project | null;
  suppliers?: Supplier | null;
  employees?: Employee | null;
  vacancies?: Vacancy | null;
  invoices?: Invoice | null;
};
