import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileUp,
  LoaderCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archiveOpportunity,
  createOpportunity,
  deleteOpportunity,
  listOpportunities,
  listOpportunityDependencies,
  type OpportunityListResult,
  type OpportunityKind,
} from "@/lib/opportunities.functions";
import { triggerBidafOpportunitySync } from "@/lib/bidaf.functions";

type RecordRow = Record<string, unknown>;
type Attachment = { path: string; name: string; type: string; size: number };

const labels = {
  rfp: {
    singular: "RFP",
    title: "Requests for Proposal",
    description: "Build, collaborate on and submit complete proposal responses.",
  },
  rfq: {
    singular: "RFQ",
    title: "Requests for Quotation",
    description: "Prepare pricing responses, supporting documents and submissions.",
  },
  bid: {
    singular: "bid",
    title: "Bids",
    description: "Coordinate tender requirements, costing and final submissions.",
  },
  eoi: {
    singular: "EOI / Prequalification",
    title: "EOI & Prequalification",
    description:
      "Coordinate expressions of interest, registrations and prequalification responses.",
  },
} as const;

const initialForm = {
  title: "",
  reference: "",
  clientId: "",
  status: "received",
  receivedDate: "",
  dueDate: "",
  value: "",
  currency: "MWK",
  notes: "",
  submissionType: "email" as "email" | "hand_delivery" | "portal",
  submissionEmail: "",
  submissionCc: "",
  deliveryLocation: "",
  portalUrl: "",
  portalUsername: "",
  submissionInstructions: "",
  submissionTime: "",
};

export function OpportunityListPage({ kind }: { kind: OpportunityKind }) {
  const copy = labels[kind];
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [archived, setArchived] = useState(false);
  const [ownerId, setOwnerId] = useState(() => crypto.randomUUID());
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    ...initialForm,
    status: kind === "bid" ? "identified" : kind === "eoi" ? "preparing" : "received",
  });
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", kind, page, pageSize, debouncedSearch, archived],
    queryFn: () =>
      listOpportunities({
        data: { kind, page, pageSize, search: debouncedSearch, archived },
      }) as Promise<OpportunityListResult>,
  });
  const records = data?.items || [];
  useEffect(() => {
    if (data && data.page !== page) setPage(data.page);
  }, [data, page]);
  const { data: dependencies } = useQuery({
    queryKey: ["opportunity-dependencies"],
    queryFn: () =>
      listOpportunityDependencies() as Promise<{ clients: RecordRow[]; currencies: RecordRow[] }>,
  });
  const create = useMutation({
    mutationFn: () =>
      createOpportunity({
        data: {
          id: ownerId,
          kind,
          title: form.title,
          reference: form.reference,
          clientId: form.clientId,
          status: form.status,
          receivedDate: form.receivedDate,
          dueDate: form.dueDate,
          value: Number(form.value || 0),
          currency: form.currency,
          notes: form.notes,
          submissionType: form.submissionType,
          submissionEmail: form.submissionEmail,
          submissionCc: form.submissionCc,
          deliveryLocation: form.deliveryLocation,
          portalUrl: form.portalUrl,
          portalUsername: form.portalUsername,
          submissionInstructions: form.submissionInstructions,
          submissionTime: form.submissionTime,
          sourceDocuments: files,
        },
      }),
    onSuccess: () => {
      toast.success(`${copy.singular.toUpperCase()} created.`);
      setOpen(false);
      setOwnerId(crypto.randomUUID());
      setFiles([]);
      setForm({
        ...initialForm,
        status: kind === "bid" ? "identified" : kind === "eoi" ? "preparing" : "received",
      });
      void qc.invalidateQueries({ queryKey: ["opportunities", kind] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archive = useMutation({
    mutationFn: (payload: { id: string; archived: boolean }) =>
      archiveOpportunity({ data: { kind, ...payload } }),
    onSuccess: (_, variables) => {
      toast.success(variables.archived ? "Tender archived." : "Tender restored.");
      void qc.invalidateQueries({ queryKey: ["opportunities", kind] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteOpportunity({ data: { kind, id } }),
    onSuccess: () => {
      toast.success("Tender permanently deleted.");
      void qc.invalidateQueries({ queryKey: ["opportunities", kind] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const bidaf = useMutation({
    mutationFn: () => triggerBidafOpportunitySync(),
    onSuccess: (result) => {
      for (const opportunityKind of ["bid", "eoi", "rfp", "rfq"])
        void qc.invalidateQueries({ queryKey: ["opportunities", opportunityKind] });
      if (result.status === "completed")
        toast.success(
          `BidAF checked: ${result.created} new, ${result.updated} updated, ${result.seen} active opportunities found.`,
        );
      else if (result.reason === "not_configured")
        toast.error("Configure the BidAF connection in Settings first.");
      else toast.info("A BidAF check is already running. The lists will update when it finishes.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const upload = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(selected)) {
        const body = new FormData();
        body.set("ownerId", ownerId);
        body.set("file", file);
        const response = await fetch("/api/attachments/upload", { method: "POST", body });
        const result = (await response.json()) as Attachment & { error?: string };
        if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}`);
        uploaded.push(result);
      }
      setFiles((current) => [...current, ...uploaded]);
      toast.success(
        `${uploaded.length} source document${uploaded.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const basePath =
    kind === "bid"
      ? "/bids"
      : kind === "rfp"
        ? "/rfps"
        : kind === "eoi"
          ? "/prequalifications"
          : "/rfqs";
  return (
    <AppShell title={copy.title} description={copy.description}>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input
          className="max-w-sm"
          placeholder={`Search ${copy.title.toLowerCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button
          variant={archived ? "default" : "outline"}
          onClick={() => {
            setArchived((current) => !current);
            setPage(1);
          }}
        >
          <Archive className="mr-2 size-4" />
          {archived ? "Viewing archive" : "Archive"}
        </Button>
        <Button variant="outline" onClick={() => bidaf.mutate()} disabled={bidaf.isPending}>
          {bidaf.isPending ? (
            <LoaderCircle className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Check BidAF now
        </Button>
        <Button className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="mr-2 size-4" />
          New {copy.singular.toUpperCase()}
        </Button>
      </div>
      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">{copy.singular.toUpperCase()} name</th>
                <th className="px-4 py-2.5">Client</th>
                <th className="px-4 py-2.5">Due date</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Submission</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : records.length ? (
                records.map((row) => {
                  const clientName = String(
                    row["client_company"] || row["client_name"] || "No client",
                  );
                  return (
                    <tr
                      key={String(row["id"])}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <a
                          href={`${basePath}/${String(row["id"])}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {String(row["title"])}
                        </a>
                        <p className="text-xs text-muted-foreground">
                          {String(row["reference"] || "No reference")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={String(row["client_logo"] || "")} />
                            <AvatarFallback>{clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="size-4 text-muted-foreground" />
                          {String(row["due_date"] || "Not set")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={row["status"] === "submitted" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {String(row["status"])}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {String(row["submission_type"] || "email").replace("_", " ")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {archived ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  archive.mutate({ id: String(row["id"]), archived: false })
                                }
                                disabled={archive.isPending}
                              >
                                <RotateCcw className="mr-1.5 size-4" /> Restore
                              </Button>
                              <ConfirmAction
                                title={`Permanently delete ${String(row["title"])}?`}
                                description="This removes the tender and its checklist, documents, comments, submissions and replies. This cannot be undone."
                                confirmLabel="Delete permanently"
                                onConfirm={() => remove.mutateAsync(String(row["id"]))}
                                disabled={remove.isPending}
                                trigger={
                                  <Button variant="ghost" size="icon" aria-label="Delete tender">
                                    <Trash2 className="size-4 text-destructive" />
                                  </Button>
                                }
                              />
                            </>
                          ) : (
                            <ConfirmAction
                              title={`Archive ${String(row["title"])}?`}
                              description="It will leave the active list and remain available in the archive."
                              confirmLabel="Archive"
                              onConfirm={() =>
                                archive.mutateAsync({ id: String(row["id"]), archived: true })
                              }
                              disabled={archive.isPending}
                              trigger={
                                <Button variant="ghost" size="icon" aria-label="Archive tender">
                                  <Archive className="size-4" />
                                </Button>
                              }
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    No {archived ? "archived " : ""}
                    {copy.title.toLowerCase()} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">
          {data?.total
            ? `${(data.page - 1) * data.pageSize + 1}–${Math.min(data.page * data.pageSize, data.total)} of ${data.total}`
            : "0 results"}
        </p>
        <div className="flex items-center gap-2">
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[118px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} per page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            disabled={(data?.page || 1) <= 1 || isLoading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-20 text-center">
            Page {data?.page || 1} of{" "}
            {Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || pageSize)))}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={
              (data?.page || 1) >=
                Math.max(1, Math.ceil((data?.total || 0) / (data?.pageSize || pageSize))) ||
              isLoading
            }
            onClick={() => setPage((current) => current + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {copy.singular.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Add the opportunity details and how it must be submitted. Contact people can be
              managed from the client record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={`${copy.singular.toUpperCase()} name`}
              value={form.title}
              onChange={(v) => set("title", v)}
            />
            <Field label="Reference" value={form.reference} onChange={(v) => set("reference", v)} />
            <SelectField
              label="Client"
              value={form.clientId}
              onChange={(v) => set("clientId", v)}
              options={(dependencies?.clients || []).map((c) => ({
                value: String(c["id"]),
                label: String(c["company"] || c["name"]),
              }))}
            />
            <SelectField
              label="Status"
              value={form.status}
              onChange={(v) => set("status", v)}
              options={(kind === "bid"
                ? ["identified", "preparing", "submitted", "won", "lost"]
                : kind === "eoi"
                  ? ["preparing", "submitted", "approved", "rejected"]
                  : ["received", "reviewing", "responding", "submitted", "won", "lost"]
              ).map((v) => ({ value: v, label: v }))}
            />
            {kind !== "bid" && kind !== "eoi" ? (
              <Field
                label="Received date"
                type="date"
                value={form.receivedDate}
                onChange={(v) => set("receivedDate", v)}
              />
            ) : null}
            <Field
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={(v) => set("dueDate", v)}
            />
            <Field
              label="Due time"
              type="time"
              value={form.submissionTime}
              onChange={(v) => set("submissionTime", v)}
            />
            <Field
              label="Estimated value"
              type="number"
              value={form.value}
              onChange={(v) => set("value", v)}
            />
            <SelectField
              label="Currency"
              value={form.currency}
              onChange={(v) => set("currency", v)}
              options={(dependencies?.currencies || []).map((c) => ({
                value: String(c["code"]),
                label: `${String(c["code"])} — ${String(c["name"])}`,
              }))}
            />
            <SelectField
              label="Submission type"
              value={form.submissionType}
              onChange={(v) => set("submissionType", v)}
              options={[
                { value: "email", label: "Email" },
                { value: "hand_delivery", label: "Hand delivery" },
                { value: "portal", label: "Online portal" },
              ]}
            />
            {form.submissionType === "email" ? (
              <>
                <Field
                  label="Send to"
                  type="email"
                  value={form.submissionEmail}
                  onChange={(v) => set("submissionEmail", v)}
                />
                <Field
                  label="CC emails"
                  value={form.submissionCc}
                  onChange={(v) => set("submissionCc", v)}
                  placeholder="Separate with commas"
                />
              </>
            ) : null}
            {form.submissionType === "hand_delivery" ? (
              <div className="sm:col-span-2">
                <Field
                  label="Delivery location"
                  value={form.deliveryLocation}
                  onChange={(v) => set("deliveryLocation", v)}
                />
              </div>
            ) : null}
            {form.submissionType === "portal" ? (
              <>
                <Field
                  label="Portal URL"
                  type="url"
                  value={form.portalUrl}
                  onChange={(v) => set("portalUrl", v)}
                />
                <Field
                  label="Portal username / account"
                  value={form.portalUsername}
                  onChange={(v) => set("portalUsername", v)}
                />
              </>
            ) : null}
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Submission instructions</Label>
              <Textarea
                rows={3}
                value={form.submissionInstructions}
                onChange={(e) => set("submissionInstructions", e.target.value)}
                placeholder="Portal steps, delivery contact, packaging rules or other instructions. Store passwords in your password manager, not here."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Original request documents</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => void upload(e.target.files)}
                disabled={uploading}
              />
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <Badge key={file.path} variant="outline">
                    <FileUp className="mr-1 size-3" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => create.mutate()} disabled={create.isPending || uploading}>
              {create.isPending ? "Creating…" : `Create ${copy.singular.toUpperCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="capitalize">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
