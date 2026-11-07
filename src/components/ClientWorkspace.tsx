import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Globe2,
  Handshake,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Pencil,
  Trash2,
  ReceiptText,
  Send,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
import { OrganizationLocations } from "@/components/OrganizationLocations";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MetricValue } from "@/components/ui/metric-value";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { normalizePhone } from "@/lib/contact-normalization";
import { db } from "@/lib/db";

type RelatedRecord = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  date?: string | null;
  href?: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string | null) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function statusVariant(status?: string) {
  if (!status) return "outline" as const;
  if (["won", "accepted", "active", "completed", "paid", "approved"].includes(status))
    return "default" as const;
  if (["lost", "rejected", "cancelled", "overdue"].includes(status)) return "destructive" as const;
  return "secondary" as const;
}

function RecordCollection({
  title,
  description,
  records,
  empty,
  browseHref,
}: {
  title: string;
  description: string;
  records: RelatedRecord[];
  empty: string;
  browseHref?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">{records.length}</Badge>
      </CardHeader>
      <CardContent>
        {records.length ? (
          <div className="divide-y">
            {records.map((record) => {
              const content = (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{record.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[record.detail, record.date ? formatDate(record.date) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {record.status ? (
                    <Badge variant={statusVariant(record.status)} className="shrink-0 capitalize">
                      {record.status.replaceAll("_", " ")}
                    </Badge>
                  ) : null}
                </>
              );
              return record.href ? (
                <a
                  key={record.id}
                  href={record.href}
                  className="flex items-center gap-3 py-3 text-sm transition hover:text-primary"
                >
                  {content}
                </a>
              ) : (
                <div key={record.id} className="flex items-center gap-3 py-3 text-sm">
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
            {empty}
          </p>
        )}
        {browseHref ? (
          <Button className="mt-3 px-0" variant="link" asChild>
            <a href={browseHref}>Open full module →</a>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ClientWorkspace({ id }: { id: string }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    location: "",
    location_source_url: "",
  });
  const [editingContact, setEditingContact] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    location: string;
    location_source_url: string;
  } | null>(null);
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const result = await db.from("clients").select("*").eq("id", id).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const { data: related, isLoading: relatedLoading } = useQuery({
    queryKey: ["client-workspace", id],
    queryFn: async () => {
      const [
        deals,
        agreements,
        activities,
        contacts,
        bids,
        requests,
        costSheets,
        quotations,
        projects,
        jobs,
        invoices,
      ] = await Promise.all([
        db.from("deals").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        db
          .from("agreements")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        db
          .from("activities")
          .select("*")
          .eq("entity_type", "client")
          .eq("entity_id", id)
          .order("occurred_at", { ascending: false }),
        db
          .from("client_contacts")
          .select("*")
          .eq("client_id", id)
          .order("is_primary", { ascending: false }),
        db.from("bids").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        db
          .from("requests")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        db
          .from("cost_sheets")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        db
          .from("quotations")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        db
          .from("projects")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
        db.from("jobs").select("*").eq("client_id", id).order("created_at", { ascending: false }),
        db
          .from("invoices")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);
      const failed = [
        deals,
        agreements,
        activities,
        contacts,
        bids,
        requests,
        costSheets,
        quotations,
        projects,
        jobs,
        invoices,
      ].find((result) => result.error);
      if (failed?.error) throw failed.error;
      return {
        deals: deals.data,
        agreements: agreements.data,
        activities: activities.data,
        contacts: contacts.data,
        bids: bids.data,
        requests: requests.data,
        costSheets: costSheets.data,
        quotations: quotations.data,
        projects: projects.data,
        jobs: jobs.data,
        invoices: invoices.data,
      };
    },
  });
  const data = related ?? {
    deals: [],
    agreements: [],
    activities: [],
    contacts: [],
    bids: [],
    requests: [],
    costSheets: [],
    quotations: [],
    projects: [],
    jobs: [],
    invoices: [],
  };
  const rfps = data.requests.filter((request) => request.request_type === "rfp");
  const rfqs = data.requests.filter((request) => request.request_type === "rfq");
  const totalRecords =
    data.deals.length +
    data.bids.length +
    data.requests.length +
    data.costSheets.length +
    data.quotations.length +
    data.projects.length +
    data.jobs.length +
    data.agreements.length +
    data.invoices.length;
  const activeDelivery =
    data.projects.filter((project) => !["completed", "cancelled"].includes(project.status)).length +
    data.jobs.filter((job) => !["completed", "cancelled"].includes(job.status)).length;
  const openOpportunities =
    data.deals.filter((deal) => !["won", "lost"].includes(deal.stage)).length +
    data.bids.filter((bid) => !["won", "lost"].includes(bid.status)).length +
    data.requests.filter((request) => !["won", "lost"].includes(request.status)).length;
  const timeline = useMemo(
    () =>
      [
        ...data.activities.map((item) => ({
          id: `activity-${item.id}`,
          date: item.occurred_at,
          title: item.body,
          type: item.activity_type,
          href: undefined,
        })),
        ...data.deals.map((item) => ({
          id: `deal-${item.id}`,
          date: item.created_at,
          title: item.title,
          type: "Deal",
          href: "/deals",
        })),
        ...data.bids.map((item) => ({
          id: `bid-${item.id}`,
          date: item.created_at,
          title: item.title,
          type: "Bid",
          href: `/bids/${item.id}`,
        })),
        ...data.requests.map((item) => ({
          id: `request-${item.id}`,
          date: item.created_at,
          title: item.title,
          type: item.request_type.toUpperCase(),
          href: `/${item.request_type}s/${item.id}`,
        })),
        ...data.quotations.map((item) => ({
          id: `quote-${item.id}`,
          date: item.created_at,
          title: item.title,
          type: "Quotation",
          href: `/quotations/${item.id}`,
        })),
        ...data.projects.map((item) => ({
          id: `project-${item.id}`,
          date: item.created_at,
          title: item.name,
          type: "Project",
          href: "/projects",
        })),
        ...data.jobs.map((item) => ({
          id: `job-${item.id}`,
          date: item.created_at,
          title: item.title,
          type: "Job",
          href: "/jobs",
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 12),
    [
      data.activities,
      data.bids,
      data.deals,
      data.jobs,
      data.projects,
      data.quotations,
      data.requests,
    ],
  );

  const addNote = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Write a note first.");
      const result = await db
        .from("activities")
        .insert({ entity_type: "client", entity_id: id, activity_type: "note", body: note.trim() });
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      setNote("");
      toast.success("Note added.");
      void qc.invalidateQueries({ queryKey: ["client-workspace", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const addContact = useMutation({
    mutationFn: async () => {
      if (!contact.first_name.trim() && !contact.last_name.trim() && !contact.email.trim()) {
        throw new Error("Add a contact name or email address.");
      }
      const normalizedPhone = normalizePhone(contact.phone);
      const { error } = await db.from("client_contacts").insert({
        client_id: id,
        first_name: contact.first_name.trim() || null,
        last_name: contact.last_name.trim() || null,
        email: contact.email.trim().toLowerCase() || null,
        phone: normalizedPhone || null,
        raw_phone: contact.phone.trim() || null,
        job_title: contact.job_title.trim() || null,
        location: contact.location.trim() || null,
        location_source_url: contact.location_source_url.trim() || null,
        location_is_inferred: false,
        is_primary: data.contacts.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContact({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_title: "",
        location: "",
        location_source_url: "",
      });
      toast.success("Contact person added.");
      void qc.invalidateQueries({ queryKey: ["client-workspace", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateContact = useMutation({
    mutationFn: async () => {
      if (!editingContact) return;
      const { error } = await db
        .from("client_contacts")
        .update({
          first_name: editingContact.first_name.trim() || null,
          last_name: editingContact.last_name.trim() || null,
          email: editingContact.email.trim().toLowerCase() || null,
          phone: normalizePhone(editingContact.phone) || null,
          raw_phone: editingContact.phone.trim() || null,
          job_title: editingContact.job_title.trim() || null,
          location: editingContact.location.trim() || null,
          location_source_url: editingContact.location_source_url.trim() || null,
          location_is_inferred: false,
        })
        .eq("id", editingContact.id)
        .eq("client_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingContact(null);
      toast.success("Contact details updated.");
      void qc.invalidateQueries({ queryKey: ["client-workspace", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeContact = async (contactId: string) => {
    const result = await db.from("client_contacts").delete().eq("id", contactId);
    if (result.error) throw result.error;
    await qc.invalidateQueries({ queryKey: ["client-workspace", id] });
  };

  if (clientLoading)
    return (
      <AppShell title="Client">
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </AppShell>
    );
  if (!client)
    return (
      <AppShell title="Client not found" description="This client may have been removed.">
        <Button asChild>
          <Link to="/clients">Back to clients</Link>
        </Button>
      </AppShell>
    );
  const displayName = client.company || client.name;

  return (
    <AppShell
      title={displayName}
      description={client.industry || "Client account"}
      actions={
        <Button variant="outline" asChild>
          <Link to="/clients">
            <ArrowLeft className="size-4" /> Clients
          </Link>
        </Button>
      }
    >
      <Card className="mb-4 overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <Avatar className="size-20 rounded-2xl border bg-white shadow-sm">
              <AvatarImage
                src={client.logo_path || undefined}
                alt={`${displayName} logo`}
                className="object-contain p-3"
              />
              <AvatarFallback className="rounded-3xl bg-primary/10 font-display text-2xl font-semibold text-primary">
                {initials(displayName) || <Building2 />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold">{displayName}</h2>
                <Badge
                  variant={client.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {client.status}
                </Badge>
              </div>
              {client.company && client.name !== client.company ? (
                <p className="mt-1 text-sm text-muted-foreground">Account contact: {client.name}</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {client.email ? (
                  <a
                    className="inline-flex items-center gap-2 hover:text-primary"
                    href={`mailto:${client.email}`}
                  >
                    <Mail className="size-4" />
                    {client.email}
                  </a>
                ) : null}
                {client.phone ? (
                  <a
                    className="inline-flex items-center gap-2 hover:text-primary"
                    href={`tel:${client.phone}`}
                  >
                    <Phone className="size-4" />
                    {client.phone}
                  </a>
                ) : null}
                {client.website ? (
                  <a
                    className="inline-flex items-center gap-2 hover:text-primary"
                    href={client.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Globe2 className="size-4" />
                    Website
                  </a>
                ) : null}
                {client.address ? (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="size-4" />
                    {client.address}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 border-t pt-5">
                <OrganizationLocations entityType="client" entityId={id} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-80">
              <Metric label="Records" value={totalRecords} />
              <Metric label="Open pipeline" value={openOpportunities} />
              <Metric label="Active work" value={activeDelivery} />
            </div>
          </div>
        </CardContent>
      </Card>

      {relatedLoading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <Tabs defaultValue="overview" className="min-w-0">
          <div className="mb-5 overflow-x-auto pb-1">
            <TabsList className="h-auto min-w-max justify-start p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="opportunities">
                Opportunities{" "}
                <Count value={data.deals.length + data.bids.length + data.requests.length} />
              </TabsTrigger>
              <TabsTrigger value="commercial">
                Commercial{" "}
                <Count
                  value={
                    data.quotations.length +
                    data.costSheets.length +
                    data.agreements.length +
                    data.invoices.length
                  }
                />
              </TabsTrigger>
              <TabsTrigger value="delivery">
                Delivery <Count value={data.projects.length + data.jobs.length} />
              </TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts <Count value={data.contacts.length} />
              </TabsTrigger>
              <TabsTrigger value="activity">
                Activity <Count value={data.activities.length} />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="overview"
            className="mt-0 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent client activity</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length ? (
                  <div className="space-y-1">
                    {timeline.map((event) => {
                      const row = (
                        <div className="flex gap-3 rounded-xl p-3 transition hover:bg-muted/60">
                          <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-medium">{event.title}</p>
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {event.type}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDate(event.date)}
                            </p>
                          </div>
                        </div>
                      );
                      return event.href ? (
                        <a key={event.id} href={event.href}>
                          {row}
                        </a>
                      ) : (
                        <div key={event.id}>{row}</div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                    No client activity has been recorded yet.
                  </p>
                )}
              </CardContent>
            </Card>
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Account summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <SummaryRow icon={Handshake} label="Deals" value={data.deals.length} />
                  <SummaryRow
                    icon={Send}
                    label="Bids, RFPs & RFQs"
                    value={data.bids.length + data.requests.length}
                  />
                  <SummaryRow
                    icon={ReceiptText}
                    label="Quotes & invoices"
                    value={data.quotations.length + data.invoices.length}
                  />
                  <SummaryRow
                    icon={BriefcaseBusiness}
                    label="Projects & jobs"
                    value={data.projects.length + data.jobs.length}
                  />
                  <SummaryRow
                    icon={UsersRound}
                    label="Contact people"
                    value={data.contacts.length}
                  />
                </CardContent>
              </Card>
              {client.notes ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Account notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {client.notes}
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="mt-0 grid gap-5 lg:grid-cols-2">
            <RecordCollection
              title="Deals"
              description="Sales opportunities linked to this client."
              empty="No deals for this client."
              browseHref="/deals"
              records={data.deals.map((item) => ({
                id: item.id,
                title: item.title,
                detail: money(Number(item.value), item.currency),
                status: item.stage,
                date: item.expected_close_date,
              }))}
            />
            <RecordCollection
              title="Bids"
              description="Tender and bid responses."
              empty="No bids for this client."
              browseHref="/bids"
              records={data.bids.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.reference || money(Number(item.value), item.currency),
                status: item.status,
                date: item.closing_date,
                href: `/bids/${item.id}`,
              }))}
            />
            <RecordCollection
              title="RFPs"
              description="Requests for proposal from this client."
              empty="No RFPs for this client."
              browseHref="/rfps"
              records={rfps.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.reference || money(Number(item.value), item.currency),
                status: item.status,
                date: item.due_date,
                href: `/rfps/${item.id}`,
              }))}
            />
            <RecordCollection
              title="RFQs"
              description="Requests for quotation from this client."
              empty="No RFQs for this client."
              browseHref="/rfqs"
              records={rfqs.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.reference || money(Number(item.value), item.currency),
                status: item.status,
                date: item.due_date,
                href: `/rfqs/${item.id}`,
              }))}
            />
          </TabsContent>

          <TabsContent value="commercial" className="mt-0 grid gap-5 lg:grid-cols-2">
            <RecordCollection
              title="Quotations"
              description="Pricing sent or prepared for this client."
              empty="No quotations for this client."
              browseHref="/quotations"
              records={data.quotations.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.quote_number,
                status: item.status,
                date: item.valid_until,
                href: `/quotations/${item.id}`,
              }))}
            />
            <RecordCollection
              title="Cost sheets"
              description="Internal costing behind this client's work."
              empty="No cost sheets for this client."
              browseHref="/cost-sheets"
              records={data.costSheets.map((item) => ({
                id: item.id,
                title: item.name,
                detail: item.currency,
                status: item.status,
                date: item.created_at,
                href: `/cost-sheets/${item.id}`,
              }))}
            />
            <RecordCollection
              title="Agreements & SLAs"
              description="Contracts and service agreements."
              empty="No agreements for this client."
              browseHref="/agreements"
              records={data.agreements.map((item) => ({
                id: item.id,
                title: item.title,
                detail: money(Number(item.value), item.currency),
                status: item.status,
                date: item.end_date,
              }))}
            />
            <RecordCollection
              title="Invoices"
              description="Billing history for this account."
              empty="No invoices for this client."
              browseHref="/finance"
              records={data.invoices.map((item) => ({
                id: item.id,
                title: item.invoice_number,
                detail: money(Number(item.amount), item.currency),
                status: item.status,
                date: item.due_date,
              }))}
            />
          </TabsContent>

          <TabsContent value="delivery" className="mt-0 grid gap-5 lg:grid-cols-2">
            <RecordCollection
              title="Projects"
              description="Delivery projects for this client."
              empty="No projects for this client."
              browseHref="/projects"
              records={data.projects.map((item) => ({
                id: item.id,
                title: item.name,
                detail: `${item.progress}% complete${item.manager ? ` · ${item.manager}` : ""}`,
                status: item.status,
                date: item.end_date,
              }))}
            />
            <RecordCollection
              title="Jobs"
              description="Scheduled and completed operational work."
              empty="No jobs for this client."
              browseHref="/jobs"
              records={data.jobs.map((item) => ({
                id: item.id,
                title: item.title,
                detail: [item.job_type, item.assignee].filter(Boolean).join(" · "),
                status: item.status,
                date: item.scheduled_date,
              }))}
            />
          </TabsContent>

          <TabsContent
            value="contacts"
            className="mt-0 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
          >
            <Card>
              <CardHeader>
                <CardTitle>Contact people</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="First name"
                    value={contact.first_name}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, first_name: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Last name"
                    value={contact.last_name}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, last_name: event.target.value }))
                    }
                  />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={contact.email}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, email: event.target.value }))
                    }
                  />
                  <Input
                    placeholder="Phone number"
                    value={contact.phone}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, phone: event.target.value }))
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Job title"
                    value={contact.job_title}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, job_title: event.target.value }))
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    placeholder="Contact person's professional location"
                    value={contact.location}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, location: event.target.value }))
                    }
                  />
                  <Input
                    className="sm:col-span-2"
                    type="url"
                    placeholder="Location verification source URL (optional)"
                    value={contact.location_source_url}
                    onChange={(event) =>
                      setContact((old) => ({ ...old, location_source_url: event.target.value }))
                    }
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => addContact.mutate()}
                  disabled={addContact.isPending}
                >
                  Add contact person
                </Button>
                <div className="space-y-2">
                  {data.contacts.map((person) =>
                    editingContact?.id === person.id ? (
                      <div key={person.id} className="rounded-xl border p-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(
                            [
                              "first_name",
                              "last_name",
                              "email",
                              "phone",
                              "job_title",
                              "location",
                              "location_source_url",
                            ] as const
                          ).map((key) => (
                            <Input
                              key={key}
                              className={
                                key === "location_source_url" ? "sm:col-span-2" : undefined
                              }
                              placeholder={key.replaceAll("_", " ")}
                              value={editingContact[key]}
                              onChange={(event) =>
                                setEditingContact((current) =>
                                  current ? { ...current, [key]: event.target.value } : current,
                                )
                              }
                            />
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            disabled={updateContact.isPending}
                            onClick={() => updateContact.mutate()}
                          >
                            {updateContact.isPending ? "Saving…" : "Save contact"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingContact(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={person.id}
                        className="flex items-start justify-between gap-3 rounded-xl border p-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">
                            {[person.first_name, person.last_name].filter(Boolean).join(" ") ||
                              person.email ||
                              "Unnamed contact"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[person.job_title, person.email, person.phone || person.raw_phone]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <MapPin className="size-3 shrink-0" />
                            {person.location || "Location not supplied"}
                            {person.location_is_inferred ? " · based on company location" : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Edit contact"
                            onClick={() =>
                              setEditingContact({
                                id: person.id,
                                first_name: person.first_name || "",
                                last_name: person.last_name || "",
                                email: person.email || "",
                                phone: person.phone || person.raw_phone || "",
                                job_title: person.job_title || "",
                                location: person.location || "",
                                location_source_url: person.location_source_url || "",
                              })
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmAction
                            title="Delete contact person?"
                            description="This removes the contact from this client."
                            onConfirm={() => removeContact(person.id)}
                            trigger={
                              <Button size="icon" variant="ghost" aria-label="Delete contact">
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ),
                  )}
                  {!data.contacts.length ? (
                    <p className="text-sm text-muted-foreground">No contact people yet.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="activity"
            className="mt-0 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes and interactions</CardTitle>
              </CardHeader>
              <CardContent>
                {data.activities.length ? (
                  <div className="space-y-5">
                    {data.activities.map((activity) => (
                      <div key={activity.id} className="relative border-l-2 border-primary/25 pl-5">
                        <span className="absolute -left-[5px] top-1 size-2 rounded-full bg-primary" />
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {activity.activity_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.occurred_at)}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{activity.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                    No notes or interactions yet.
                  </p>
                )}
              </CardContent>
            </Card>
            <Card className="self-start">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquareText className="size-4" /> Add account note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={5}
                  placeholder="Add a meeting, call, decision or account note…"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <Button
                  className="mt-3 w-full"
                  onClick={() => addNote.mutate()}
                  disabled={addNote.isPending}
                >
                  {addNote.isPending ? "Adding…" : "Add note"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </AppShell>
  );
}

function Count({ value }: { value: number }) {
  return <span className="ml-1.5 rounded-full bg-background/80 px-1.5 text-[10px]">{value}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-background/70 p-3 text-center">
      <MetricValue value={value} maxSize={1.25} />
      <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      <span className="grid size-8 place-items-center rounded-lg bg-background text-primary">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
