import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, FileUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
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
  createOpportunity,
  listOpportunities,
  listOpportunityDependencies,
  type OpportunityKind,
} from "@/lib/opportunities.functions";

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
  const [ownerId, setOwnerId] = useState(() => crypto.randomUUID());
  const [files, setFiles] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    ...initialForm,
    status: kind === "bid" ? "identified" : "received",
  });
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["opportunities", kind],
    queryFn: () => listOpportunities({ data: { kind } }) as Promise<RecordRow[]>,
  });
  const { data: dependencies } = useQuery({
    queryKey: ["opportunity-dependencies"],
    queryFn: () =>
      listOpportunityDependencies() as Promise<{ clients: RecordRow[]; currencies: RecordRow[] }>,
  });
  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return records;
    return records.filter((row) =>
      [row["title"], row["client_company"], row["client_name"], row["reference"]].some((item) =>
        String(item || "")
          .toLowerCase()
          .includes(value),
      ),
    );
  }, [records, search]);

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
      setForm({ ...initialForm, status: kind === "bid" ? "identified" : "received" });
      void qc.invalidateQueries({ queryKey: ["opportunities", kind] });
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
  const basePath = kind === "bid" ? "/bids" : kind === "rfp" ? "/rfps" : "/rfqs";
  return (
    <AppShell title={copy.title} description={copy.description}>
      <div className="mb-5 flex flex-wrap gap-3">
        <Input
          className="max-w-sm"
          placeholder={`Search ${copy.title.toLowerCase()}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                <th className="px-5 py-3">{copy.singular.toUpperCase()} name</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Due date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Submission</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-5 py-8 text-muted-foreground" colSpan={5}>
                    Loading…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((row) => {
                  const clientName = String(
                    row["client_company"] || row["client_name"] || "No client",
                  );
                  return (
                    <tr
                      key={String(row["id"])}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarImage src={String(row["client_logo"] || "")} />
                            <AvatarFallback>{clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span>{clientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2">
                          <CalendarClock className="size-4 text-muted-foreground" />
                          {String(row["due_date"] || "Not set")}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={row["status"] === "submitted" ? "default" : "secondary"}
                          className="capitalize"
                        >
                          {String(row["status"])}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 capitalize">
                        {String(row["submission_type"] || "email").replace("_", " ")}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-5 py-8 text-muted-foreground" colSpan={5}>
                    No {copy.title.toLowerCase()} yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create {copy.singular.toUpperCase()}</DialogTitle>
            <DialogDescription>
              Add the opportunity details and how it must be submitted. Contact people can be
              managed from the client record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
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
                : ["received", "reviewing", "responding", "submitted", "won", "lost"]
              ).map((v) => ({ value: v, label: v }))}
            />
            {kind !== "bid" ? (
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
