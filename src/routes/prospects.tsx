import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { db } from "@/lib/db";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  component: ProspectsPage,
});

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
      description="Everyone you might sell to, imported from your spreadsheets."
      actions={<ImportDialog onDone={() => qc.invalidateQueries({ queryKey: ["prospects"] })} />}
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
                      {[p.first_name, p.last_name].filter(Boolean).join(" ") || "—"}
                    </TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.company ?? "—"}</TableCell>
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
                      <Button size="sm" variant="ghost" onClick={() => remove.mutate(p.id)}>
                        Delete
                      </Button>
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
