import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { discoverProspects, type AiProspect } from "@/lib/settings.functions";
import { ConfirmAction } from "@/components/ConfirmAction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/prospects")({
  head: () => ({
    meta: [
      { title: "Prospects | Gwero CRM" },
      { name: "description", content: "Import prospect lists from Excel and track their status." },
      { property: "og:title", content: "Prospects | Gwero CRM" },
      {
        property: "og:description",
        content: "Import prospect lists from Excel and track their status.",
      },
    ],
  }),
  component: ProspectsRoute,
});

function ProspectsRoute() {
  const location = useLocation();
  return location.pathname !== "/prospects" && location.pathname !== "/prospects/" ? (
    <Outlet />
  ) : (
    <ProspectsPage />
  );
}

const FIELDS = [
  { key: "email", label: "Email (required)" },
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "company", label: "Company" },
  { key: "job_title", label: "Job title" },
  { key: "phone", label: "Phone" },
] as const;

const STATUSES = ["new", "contacted", "replied", "interested", "not_interested", "client"];

type Row = Record<string, unknown>;

type Draft = {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  phone: string;
  website: string;
  linkedin_url: string;
  category_id: string;
};
const emptyDraft = (): Draft => ({
  email: "",
  first_name: "",
  last_name: "",
  company: "",
  job_title: "",
  phone: "",
  website: "",
  linkedin_url: "",
  category_id: "",
});

function AddProspectsDialog({
  categories,
  onDone,
}: {
  categories: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([emptyDraft()]);
  const [busy, setBusy] = useState(false);
  const update = (index: number, key: keyof Draft, value: string) =>
    setDrafts((items) => items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  const save = async () => {
    const valid = drafts.filter((d) => d.email.includes("@") || d.company.trim());
    if (!valid.length) {
      toast.error("Add a company or valid email.");
      return;
    }
    setBusy(true);
    const { error } = await db.from("prospects").insert(
      valid.map((d) => ({
        ...d,
        email: d.email.trim().toLowerCase() || `unknown-${crypto.randomUUID()}@prospect.local`,
        category_id: d.category_id || null,
      })),
    );
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${valid.length} prospect${valid.length === 1 ? "" : "s"} added.`);
    setDrafts([emptyDraft()]);
    setOpen(false);
    onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add prospects</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add one or several prospects</DialogTitle>
          <DialogDescription>
            Start with one row and use “Add another” for long-form batch entry.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {drafts.map((draft, index) => (
            <Card key={index}>
              <CardContent className="grid gap-3 pt-5 md:grid-cols-3">
                <Input
                  aria-label="First name"
                  placeholder="First name"
                  value={draft.first_name}
                  onChange={(e) => update(index, "first_name", e.target.value)}
                />
                <Input
                  aria-label="Last name"
                  placeholder="Last name"
                  value={draft.last_name}
                  onChange={(e) => update(index, "last_name", e.target.value)}
                />
                <Input
                  aria-label="Company"
                  placeholder="Company *"
                  value={draft.company}
                  onChange={(e) => update(index, "company", e.target.value)}
                />
                <Input
                  aria-label="Email"
                  type="email"
                  placeholder="Email"
                  value={draft.email}
                  onChange={(e) => update(index, "email", e.target.value)}
                />
                <Input
                  aria-label="Job title"
                  placeholder="Job title"
                  value={draft.job_title}
                  onChange={(e) => update(index, "job_title", e.target.value)}
                />
                <Input
                  aria-label="Phone"
                  placeholder="Phone"
                  value={draft.phone}
                  onChange={(e) => update(index, "phone", e.target.value)}
                />
                <Input
                  aria-label="Website"
                  placeholder="Website"
                  value={draft.website}
                  onChange={(e) => update(index, "website", e.target.value)}
                />
                <Input
                  aria-label="LinkedIn URL"
                  placeholder="LinkedIn URL"
                  value={draft.linkedin_url}
                  onChange={(e) => update(index, "linkedin_url", e.target.value)}
                />
                <Select
                  value={draft.category_id || "none"}
                  onValueChange={(v) => update(index, "category_id", v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {drafts.length > 1 ? (
                  <Button
                    variant="ghost"
                    className="md:col-span-3 md:w-fit"
                    onClick={() => setDrafts((items) => items.filter((_, i) => i !== index))}
                  >
                    Remove row
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setDrafts((items) => [...items, emptyDraft()])}
            >
              + Add another
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              {busy ? "Saving…" : "Save prospects"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialog({
  categories,
  onDone,
}: {
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
    offerings: string | null;
  }>;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", description: "", offerings: "" });
  const save = async () => {
    const values = { name: form.name, description: form.description, offerings: form.offerings };
    const { error } = form.id
      ? await db.from("prospect_categories").update(values).eq("id", form.id)
      : await db.from("prospect_categories").insert(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Category updated." : "Category added.");
    setForm({ id: "", name: "", description: "", offerings: "" });
    onDone();
  };
  const remove = async (id: string) => {
    const { error } = await db.from("prospect_categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Category deleted.");
    if (form.id === id) setForm({ id: "", name: "", description: "", offerings: "" });
    onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Categories</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Prospect categories</DialogTitle>
          <DialogDescription>
            Describe the segment and what your team can offer it. AI research uses this context.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 md:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4">
            <FieldInput
              label="Category name"
              value={form.name}
              onChange={(v) => setForm((o) => ({ ...o, name: v }))}
            />
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((o) => ({ ...o, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Offerings for this category</Label>
              <Textarea
                value={form.offerings}
                onChange={(e) => setForm((o) => ({ ...o, offerings: e.target.value }))}
              />
            </div>
            <Button onClick={() => void save()} disabled={!form.name}>
              {form.id ? "Save changes" : "Add category"}
            </Button>
            {form.id ? (
              <Button
                variant="ghost"
                onClick={() => setForm({ id: "", name: "", description: "", offerings: "" })}
              >
                Cancel editing
              </Button>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold">Existing categories</p>
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {category.description || "No description"}
                    </p>
                    <p className="mt-1 text-xs">{category.offerings || "No offerings listed"}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          id: category.id,
                          name: category.name,
                          description: category.description || "",
                          offerings: category.offerings || "",
                        })
                      }
                    >
                      Edit
                    </Button>
                    <ConfirmAction
                      title="Delete category?"
                      description="Prospects will remain but become uncategorised."
                      onConfirm={() => remove(category.id)}
                      trigger={
                        <Button size="sm" variant="destructive">
                          Delete
                        </Button>
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
            {!categories.length ? (
              <p className="text-sm text-muted-foreground">No categories yet.</p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function FieldInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AiSearchDialog({
  categories,
  onDone,
}: {
  categories: Array<{ id: string; name: string }>;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [results, setResults] = useState<AiProspect[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const search = useMutation({
    mutationFn: () =>
      discoverProspects({ data: { prompt, categoryId: categoryId || null, limit: 12 } }),
    onSuccess: (items) => {
      setResults(items);
      setSelected(items.map((_, i) => i));
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const add = async () => {
    const items = results.filter((_, i) => selected.includes(i));
    const { error } = await db.from("prospects").insert(
      items.map((p) => ({
        email: p.email || `unknown-${crypto.randomUUID()}@prospect.local`,
        first_name: p.first_name,
        last_name: p.last_name,
        company: p.company,
        job_title: p.job_title,
        phone: p.phone,
        website: p.website,
        linkedin_url: p.linkedin_url,
        fit_score: p.fit_score,
        fit_reason: p.fit_reason,
        category_id: categoryId || null,
        extra: { source_urls: p.source_urls },
        source_file: "OpenAI web research",
      })),
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${items.length} researched prospects added.`);
    setOpen(false);
    onDone();
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Find with AI</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>AI prospect research</DialogTitle>
          <DialogDescription>
            OpenAI searches the web using your saved guide and selected category. Review every
            sourced match before importing it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <Textarea
            rows={3}
            placeholder="e.g. Find growing logistics companies in Malawi that need workflow automation…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Any category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          className="w-fit"
          disabled={!prompt || search.isPending}
          onClick={() => search.mutate()}
        >
          {search.isPending ? "Searching the web…" : "Search for prospects"}
        </Button>
        <div className="space-y-3">
          {results.map((item, index) => (
            <Card key={`${item.company}-${index}`}>
              <CardContent className="flex gap-3 pt-5">
                <Checkbox
                  checked={selected.includes(index)}
                  onCheckedChange={(checked) =>
                    setSelected((old) =>
                      checked ? [...old, index] : old.filter((i) => i !== index),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{item.company}</p>
                    <Badge>{item.fit_score}% fit</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.fit_reason}</p>
                  <p className="mt-2 text-xs">
                    {[item.first_name, item.last_name, item.job_title, item.email]
                      .filter(Boolean)
                      .join(" · ") || "No verified contact person found"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.source_urls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="max-w-xs truncate text-xs text-violet-700 underline"
                      >
                        Source
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {results.length ? (
          <Button onClick={() => void add()} disabled={!selected.length}>
            Add {selected.length} selected prospect{selected.length === 1 ? "" : "s"}
          </Button>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    const buffer = await file.arrayBuffer();
    const book = XLSX.read(buffer);
    const sheetName = book.SheetNames[0];
    if (!sheetName) return;
    const sheet = book.Sheets[sheetName];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json<Row>(sheet, { defval: "" });
    if (!data.length) {
      toast.error("That file has no rows.");
      return;
    }
    const cols = Object.keys(data[0] as Row);
    setRows(data);
    setHeaders(cols);
    setFileName(file.name);
    const guess: Record<string, string> = {};
    for (const field of FIELDS) {
      const hit = cols.find(
        (c) => c.toLowerCase().replace(/[^a-z]/g, "") === field.key.replace(/_/g, ""),
      );
      if (hit) guess[field.key] = hit;
    }
    if (!guess["email"]) {
      const hit = cols.find((c) => c.toLowerCase().includes("mail"));
      if (hit) guess["email"] = hit;
    }
    if (!guess["first_name"]) {
      const hit = cols.find((c) => c.toLowerCase().includes("name"));
      if (hit) guess["first_name"] = hit;
    }
    setMapping(guess);
  }

  async function importRows() {
    const emailCol = mapping["email"];
    if (!emailCol) {
      toast.error("Choose which column holds the email address.");
      return;
    }
    setBusy(true);
    const mapped = rows
      .map((row) => {
        const used = new Set(Object.values(mapping));
        const extra: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(row)) {
          if (!used.has(key) && value !== "") extra[key] = value;
        }
        const pick = (field: string) => {
          const col = mapping[field];
          const value = col ? row[col] : null;
          return value == null || value === "" ? null : String(value).trim();
        };
        const email = pick("email");
        if (!email || !email.includes("@")) return null;
        return {
          email: email.toLowerCase(),
          first_name: pick("first_name"),
          last_name: pick("last_name"),
          company: pick("company"),
          job_title: pick("job_title"),
          phone: pick("phone"),
          extra,
          source_file: fileName,
        };
      })
      .filter(Boolean) as Array<Record<string, unknown>>;

    if (!mapped.length) {
      setBusy(false);
      toast.error("No valid email addresses found in that column.");
      return;
    }

    const { error } = await db.from("prospects").upsert(mapped as never, { onConflict: "email" });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${mapped.length} prospects imported.`);
    setOpen(false);
    setRows([]);
    setHeaders([]);
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload spreadsheet</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import prospects</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file, then tell us which column holds what.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="font-medium">1. Download and complete the template</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep the column headings unchanged, add one prospect per row, then upload the completed
            file below.
          </p>
          <Button className="mt-3" variant="outline" asChild>
            <a href="/templates/gwero-prospect-import-template.csv" download>
              Download sample CSV template
            </a>
          </Button>
        </div>
        <p className="text-sm font-medium">2. Upload your completed file</p>

        <Input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        {headers.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {rows.length} rows found in {fileName}. Anything you don't map is kept as extra
              details you can still use as placeholders.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label>{field.label}</Label>
                  <Select
                    value={mapping[field.key] ?? "__none"}
                    onValueChange={(v) =>
                      setMapping((m) => {
                        const next = { ...m };
                        if (v === "__none") delete next[field.key];
                        else next[field.key] = v;
                        return next;
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not used" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">Not used</SelectItem>
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <Button onClick={() => void importRows()} disabled={busy}>
              {busy ? "Importing…" : `Import ${rows.length} rows`}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ProspectsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: prospects = [] } = useQuery({
    queryKey: ["prospects"],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["prospect-categories"],
    queryFn: async () => {
      const { data, error } = await db.from("prospect_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await db.from("prospects").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const convert = useMutation({
    mutationFn: async (prospect: (typeof prospects)[number]) => {
      const { error } = await db.from("clients").insert({
        name: [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || prospect.email,
        company: prospect.company,
        email: prospect.email,
        phone: prospect.phone,
        prospect_id: prospect.id,
      });
      if (error) throw error;
      await db.from("prospects").update({ status: "client" }).eq("id", prospect.id);
    },
    onSuccess: () => {
      toast.success("Prospect converted to a client.");
      void qc.invalidateQueries({ queryKey: ["prospects"] });
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("prospects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] }),
  });

  const filtered = prospects.filter((p) =>
    `${p.email} ${p.first_name ?? ""} ${p.last_name ?? ""} ${p.company ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <AppShell
      title="Prospects"
      description="Build, research and progress qualified opportunities from first contact to client."
      actions={
        <>
          <CategoryDialog
            categories={categories}
            onDone={() => qc.invalidateQueries({ queryKey: ["prospect-categories"] })}
          />
          <AiSearchDialog
            categories={categories}
            onDone={() => qc.invalidateQueries({ queryKey: ["prospects"] })}
          />
          <ImportDialog onDone={() => qc.invalidateQueries({ queryKey: ["prospects"] })} />
          <AddProspectsDialog
            categories={categories}
            onDone={() => qc.invalidateQueries({ queryKey: ["prospects"] })}
          />
        </>
      }
    >
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search by name, email or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 max-w-sm"
          />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/prospects/$id"
                        params={{ id: p.id }}
                        className="text-violet-800 hover:underline"
                      >
                        {[p.first_name, p.last_name].filter(Boolean).join(" ") ||
                          p.company ||
                          "Open prospect"}
                      </Link>
                    </TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>
                      <div>{p.company ?? "—"}</div>
                      <p className="text-xs text-muted-foreground">
                        {categories.find((c) => c.id === p.category_id)?.name || "Uncategorised"}
                        {p.fit_score != null ? ` · ${p.fit_score}% fit` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={p.status}
                        onValueChange={(status) => setStatus.mutate({ id: p.id, status })}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => convert.mutate(p)}>
                        Make client
                      </Button>
                      <ConfirmAction
                        title="Delete prospect?"
                        description={`Remove ${p.company || p.email} and its interaction history?`}
                        onConfirm={() => remove.mutateAsync(p.id)}
                        trigger={
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No prospects yet — upload a spreadsheet to get started.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            <Badge variant="secondary">{prospects.length}</Badge> prospects in total
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
