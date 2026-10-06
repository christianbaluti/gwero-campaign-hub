import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
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
import { importProspectContacts, type ContactImportRow } from "@/lib/prospects.functions";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  { key: "company", label: "Company / organisation (required)" },
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "gender", label: "Gender" },
  { key: "job_title", label: "Job title" },
  { key: "phone", label: "Phone" },
] as const;

type Row = Record<string, unknown>;

type Draft = {
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string;
  phone: string;
  gender: string;
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
  gender: "",
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
    let result;
    try {
      result = await importProspectContacts({
        data: {
          rows: valid.map((d) => ({
            company: d.company,
            firstName: d.first_name,
            lastName: d.last_name,
            email: d.email,
            phone: d.phone,
            gender: d.gender,
            jobTitle: d.job_title,
            website: d.website,
            linkedinUrl: d.linkedin_url,
            categoryId: d.category_id || null,
          })),
          sourceFile: "Manual entry",
        },
      });
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Could not save contacts.");
      return;
    }
    setBusy(false);
    toast.success(
      `${result.contactsCreated + result.contactsUpdated} contact${valid.length === 1 ? "" : "s"} saved across ${result.companies} compan${result.companies === 1 ? "y" : "ies"}.`,
    );
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
                <Select
                  value={draft.gender || "none"}
                  onValueChange={(v) => update(index, "gender", v === "none" ? "" : v)}
                >
                  <SelectTrigger aria-label="Gender">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Gender not specified</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
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
      <DialogContent className="flex h-[88vh] max-h-[88vh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Prospect categories</DialogTitle>
          <DialogDescription>
            Describe the segment and what your team can offer it. AI research uses this context.
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="space-y-4 overflow-y-auto pr-1 md:overflow-y-visible md:pr-0">
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
          <div className="gwero-scrollbar min-h-0 space-y-2 overflow-y-auto pr-2">
            <p className="sticky top-0 z-10 bg-background pb-2 text-sm font-semibold">
              Existing categories
            </p>
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
    try {
      await importProspectContacts({
        data: {
          rows: items.map((p) => ({
            company: p.company,
            firstName: p.first_name || "",
            lastName: p.last_name || "",
            email: p.email || "",
            phone: p.phone || "",
            jobTitle: p.job_title || "",
            website: p.website || "",
            linkedinUrl: p.linkedin_url || "",
            categoryId: categoryId || null,
          })),
          sourceFile: "OpenAI web research",
        },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save researched prospects.");
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
    const aliases: Record<string, string[]> = {
      company: ["organisation", "organization", "company", "client"],
      first_name: ["name of participant first", "first name", "firstname"],
      last_name: ["name of participant last", "last name", "lastname", "surname"],
      phone: ["contact phone", "phone", "mobile", "number"],
      gender: ["gender", "sex"],
      email: ["email address", "email", "mail"],
    };
    for (const [field, choices] of Object.entries(aliases)) {
      const hit = cols.find((column) =>
        choices.includes(
          column
            .toLowerCase()
            .replace(/[^a-z]+/g, " ")
            .trim(),
        ),
      );
      if (hit) guess[field] = hit;
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
    const companyCol = mapping["company"];
    if (!companyCol) {
      toast.error("Choose which column holds the company or organisation.");
      return;
    }
    setBusy(true);
    const mapped = rows
      .map((row) => {
        const pick = (field: string) => {
          const col = mapping[field];
          const value = col ? row[col] : null;
          return value == null || value === "" ? null : String(value).trim();
        };
        const company = pick("company");
        if (!company) return null;
        return {
          company,
          email: pick("email") || "",
          firstName: pick("first_name") || "",
          lastName: pick("last_name") || "",
          gender: pick("gender") || "",
          jobTitle: pick("job_title") || "",
          phone: pick("phone") || "",
        };
      })
      .filter(Boolean) as ContactImportRow[];

    if (!mapped.length) {
      setBusy(false);
      toast.error("No company names were found in that column.");
      return;
    }

    try {
      const result = await importProspectContacts({ data: { rows: mapped, sourceFile: fileName } });
      toast.success(
        `${result.contactsCreated + result.contactsUpdated} contacts imported into ${result.companies} canonical companies.`,
      );
    } catch (error) {
      setBusy(false);
      toast.error(error instanceof Error ? error.message : "Import failed.");
      return;
    }
    setBusy(false);
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [visibleCount, setVisibleCount] = useState(30);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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
  const { data: contacts = [] } = useQuery({
    queryKey: ["prospect-contacts"],
    queryFn: async () => {
      const { data, error } = await db.from("prospect_contacts").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const filtered = prospects
    .filter(
      (p) =>
        (categoryFilter === "all" || p.category_id === categoryFilter) &&
        `${p.email} ${p.first_name ?? ""} ${p.last_name ?? ""} ${p.company ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const companyA = a.company || a.email;
      const companyB = b.company || b.email;
      if (sortBy === "name_desc") return companyB.localeCompare(companyA);
      if (sortBy === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "contacts_desc") {
        const countA = contacts.filter((contact) => contact.prospect_id === a.id).length;
        const countB = contacts.filter((contact) => contact.prospect_id === b.id).length;
        return countB - countA || companyA.localeCompare(companyB);
      }
      return companyA.localeCompare(companyB);
    });
  const visible = filtered.slice(0, visibleCount);
  useEffect(() => setVisibleCount(30), [search, categoryFilter, sortBy]);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting)
          setVisibleCount((count) => Math.min(count + 30, filtered.length));
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered.length]);

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
          <div className="mb-4 grid min-w-0 gap-3 md:grid-cols-[minmax(220px,1fr)_minmax(190px,280px)_minmax(180px,230px)]">
            <Input
              placeholder="Search by name, email or company"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full min-w-0" aria-label="Filter by category">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full min-w-0" aria-label="Sort prospects">
                <SelectValue placeholder="Sort prospects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Company A–Z</SelectItem>
                <SelectItem value="name_desc">Company Z–A</SelectItem>
                <SelectItem value="newest">Newest added</SelectItem>
                <SelectItem value="oldest">Oldest added</SelectItem>
                <SelectItem value="contacts_desc">Most contacts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Table className="table-fixed" containerClassName="overflow-visible">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="sticky top-20 z-20 w-[36%] bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
                    Company
                  </TableHead>
                  <TableHead className="sticky top-20 z-20 w-[38%] bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
                    Company email
                  </TableHead>
                  <TableHead className="sticky top-20 z-20 w-[26%] bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
                    Contact people
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => {
                  const people = contacts.filter((contact) => contact.prospect_id === p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="min-w-0 font-medium">
                        <div className="flex items-center gap-3">
                          {p.logo_path ? (
                            <img
                              src={p.logo_path}
                              alt=""
                              className="size-9 rounded-lg border bg-white object-contain p-1"
                            />
                          ) : (
                            <span className="grid size-9 place-items-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
                              {(p.company || "P").charAt(0)}
                            </span>
                          )}
                          <Link
                            to="/prospects/$id"
                            params={{ id: p.id }}
                            className="min-w-0 truncate text-violet-800 hover:underline"
                          >
                            {p.company || "Open prospect"}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0 overflow-hidden">
                        {p.email.includes("@prospect.local") ? (
                          <span className="text-muted-foreground">No verified company email</span>
                        ) : (
                          <a
                            href={`mailto:${p.email}`}
                            className="block truncate hover:text-primary hover:underline"
                          >
                            {p.email}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider delayDuration={150}>
                          <div className="flex min-w-0 -space-x-2 overflow-hidden py-1">
                            {people.slice(0, 8).map((person) => {
                              const name =
                                [person.first_name, person.last_name].filter(Boolean).join(" ") ||
                                person.email ||
                                "Contact";
                              const initials =
                                [person.first_name, person.last_name]
                                  .filter(Boolean)
                                  .map((part) => part!.charAt(0))
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase() || "?";
                              return (
                                <Tooltip key={person.id}>
                                  <TooltipTrigger asChild>
                                    <Link
                                      to="/prospects/$id/contacts/$contactId"
                                      params={{ id: p.id, contactId: person.id }}
                                      aria-label={`Open ${name}`}
                                    >
                                      <Avatar className="size-9 border-2 border-background transition-transform hover:z-10 hover:scale-110">
                                        <AvatarImage src={person.avatar_url || undefined} alt="" />
                                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                          {initials}
                                        </AvatarFallback>
                                      </Avatar>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{name}</p>
                                    {person.job_title ? (
                                      <p className="text-xs opacity-75">{person.job_title}</p>
                                    ) : null}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            {people.length > 8 ? (
                              <span className="grid size-9 place-items-center rounded-full border-2 border-background bg-muted text-xs font-semibold">
                                +{people.length - 8}
                              </span>
                            ) : null}
                            {!people.length ? (
                              <span className="text-sm text-muted-foreground">No contacts</span>
                            ) : null}
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                      No prospects match the current search and category filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          <div ref={loadMoreRef} className="h-2" aria-hidden="true" />
          <div className="mt-4 text-xs text-muted-foreground">
            <Badge variant="secondary">{visible.length}</Badge> of {filtered.length} matching
            prospects loaded
            {visible.length < filtered.length ? " · Scroll to load more" : ""}
          </div>
          {visible.length < filtered.length ? (
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => setVisibleCount((count) => Math.min(count + 30, filtered.length))}
            >
              Load more prospects
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
