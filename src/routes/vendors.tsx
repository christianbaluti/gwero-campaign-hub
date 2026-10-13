import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileText, Paperclip, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteVendor,
  deleteVendorQuote,
  getVendorWorkspace,
  saveVendor,
  saveVendorQuote,
  type VendorAttachment,
} from "@/lib/vendors.functions";

export const Route = createFileRoute("/vendors")({
  component: VendorsPage,
  head: () => ({
    meta: [
      { title: "Vendors & source quotations | Gwero OS" },
      {
        name: "description",
        content: "Manage vendors and quotations that support internal cost sheets.",
      },
    ],
  }),
});

type Row = Record<string, unknown>;
type Workspace = { vendors: Row[]; quotes: Row[]; currencies: Row[] };
const emptyRows: Row[] = [];

const emptyVendor = {
  id: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  category: "",
  notes: "",
};

const emptyQuote = {
  id: "",
  sourceType: "vendor" as "vendor" | "external",
  supplierId: "",
  sourceName: "",
  quoteReference: "",
  quoteDate: "",
  validUntil: "",
  currency: "MWK",
  amount: "",
  notes: "",
  attachment: undefined as VendorAttachment | undefined,
};

function attachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}

function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [vendorOpen, setVendorOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendor);
  const [quoteForm, setQuoteForm] = useState(emptyQuote);
  const [quoteOwnerId, setQuoteOwnerId] = useState<string>(() => crypto.randomUUID());
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-workspace"],
    queryFn: () => getVendorWorkspace() as Promise<Workspace>,
  });
  const vendors = data?.vendors || emptyRows;
  const quotes = data?.quotes || emptyRows;
  const needle = search.trim().toLowerCase();
  const filteredVendors = useMemo(
    () =>
      needle
        ? vendors.filter((vendor) =>
            [vendor["name"], vendor["contact_name"], vendor["email"], vendor["category"]].some(
              (value) =>
                String(value || "")
                  .toLowerCase()
                  .includes(needle),
            ),
          )
        : vendors,
    [needle, vendors],
  );
  const filteredQuotes = useMemo(
    () =>
      needle
        ? quotes.filter((quote) =>
            [quote["source_name"], quote["quote_reference"], quote["notes"]].some((value) =>
              String(value || "")
                .toLowerCase()
                .includes(needle),
            ),
          )
        : quotes,
    [needle, quotes],
  );
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["vendor-workspace"] });

  const vendorMutation = useMutation({
    mutationFn: () =>
      saveVendor({
        data: {
          ...(vendorForm.id ? { id: vendorForm.id } : {}),
          name: vendorForm.name,
          contactName: vendorForm.contactName,
          email: vendorForm.email,
          phone: vendorForm.phone,
          category: vendorForm.category,
          notes: vendorForm.notes,
        },
      }),
    onSuccess: async () => {
      toast.success(vendorForm.id ? "Vendor updated." : "Vendor added.");
      setVendorOpen(false);
      setVendorForm(emptyVendor);
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeVendor = useMutation({
    mutationFn: (id: string) => deleteVendor({ data: { id } }),
    onSuccess: async () => {
      toast.success("Vendor removed. Existing quotations remain as external source records.");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const quoteMutation = useMutation({
    mutationFn: () =>
      saveVendorQuote({
        data: {
          id: quoteForm.id || quoteOwnerId,
          supplierId: quoteForm.sourceType === "vendor" ? quoteForm.supplierId : "",
          sourceName: quoteForm.sourceType === "external" ? quoteForm.sourceName : "",
          quoteReference: quoteForm.quoteReference,
          quoteDate: quoteForm.quoteDate,
          validUntil: quoteForm.validUntil,
          currency: quoteForm.currency,
          amount: Number(quoteForm.amount || 0),
          notes: quoteForm.notes,
          ...(quoteForm.attachment ? { attachment: quoteForm.attachment } : {}),
        },
      }),
    onSuccess: async () => {
      toast.success(quoteForm.id ? "Quotation updated." : "Quotation saved.");
      setQuoteOpen(false);
      setQuoteForm(emptyQuote);
      setQuoteOwnerId(crypto.randomUUID());
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeQuote = useMutation({
    mutationFn: (id: string) => deleteVendorQuote({ data: { id } }),
    onSuccess: async () => {
      toast.success("Quotation removed.");
      await refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const editVendor = (vendor: Row) => {
    setVendorForm({
      id: String(vendor["id"]),
      name: String(vendor["name"] || ""),
      contactName: String(vendor["contact_name"] || ""),
      email: String(vendor["email"] || ""),
      phone: String(vendor["phone"] || ""),
      category: String(vendor["category"] || ""),
      notes: String(vendor["notes"] || ""),
    });
    setVendorOpen(true);
  };
  const editQuote = (quote: Row) => {
    const quoteId = String(quote["id"]);
    setQuoteOwnerId(quoteId);
    setQuoteForm({
      id: quoteId,
      sourceType: quote["supplier_id"] ? "vendor" : "external",
      supplierId: String(quote["supplier_id"] || ""),
      sourceName: String(quote["source_name"] || ""),
      quoteReference: String(quote["quote_reference"] || ""),
      quoteDate: String(quote["quote_date"] || "").slice(0, 10),
      validUntil: String(quote["valid_until"] || "").slice(0, 10),
      currency: String(quote["currency"] || "MWK"),
      amount: String(quote["amount"] || ""),
      notes: String(quote["notes"] || ""),
      attachment: quote["attachment_path"]
        ? {
            path: String(quote["attachment_path"]),
            name: String(quote["attachment_name"] || "Quotation attachment"),
            type: String(quote["attachment_type"] || "application/octet-stream"),
            size: Number(quote["attachment_size"] || 0),
          }
        : undefined,
    });
    setQuoteOpen(true);
  };
  const uploadQuote = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.set("ownerId", quoteOwnerId);
      body.set("file", file);
      const response = await fetch("/api/attachments/upload", { method: "POST", body });
      const result = (await response.json()) as VendorAttachment & { error?: string };
      if (!response.ok) throw new Error(result.error || "Quotation upload failed.");
      setQuoteForm((current) => ({ ...current, attachment: result }));
      toast.success("Quotation document uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Quotation upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AppShell
      title="Vendors & source quotations"
      description="Keep supplier records and the evidence behind every cost sheet."
    >
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search vendors or quotations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setVendorForm(emptyVendor);
              setVendorOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" /> Add vendor
          </Button>
          <Button
            onClick={() => {
              setQuoteForm(emptyQuote);
              setQuoteOwnerId(crypto.randomUUID());
              setQuoteOpen(true);
            }}
          >
            <FileText className="mr-2 size-4" /> Add quotation
          </Button>
        </div>
      </div>
      <Tabs defaultValue="vendors" className="space-y-5">
        <TabsList>
          <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="quotes">Source quotations ({quotes.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor directory</CardTitle>
              <CardDescription>
                Organisations you regularly source products or services from.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? <p className="text-muted-foreground">Loading vendors…</p> : null}
              {filteredVendors.map((vendor) => (
                <article key={String(vendor["id"])} className="rounded-2xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Building2 className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{String(vendor["name"])}</h3>
                      <p className="text-xs text-muted-foreground">
                        {String(vendor["category"] || "Uncategorised")}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${String(vendor["name"])}`}
                      onClick={() => editVendor(vendor)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <p>{String(vendor["contact_name"] || "No contact person")}</p>
                    <p className="truncate">{String(vendor["email"] || "No email")}</p>
                    <p>{String(vendor["phone"] || "No phone")}</p>
                  </div>
                  <div className="mt-4 flex justify-end border-t pt-3">
                    <ConfirmAction
                      title="Delete this vendor?"
                      description="Its quotations remain available as external-source records."
                      onConfirm={() => removeVendor.mutateAsync(String(vendor["id"]))}
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </Button>
                      }
                    />
                  </div>
                </article>
              ))}
              {!filteredVendors.length && !isLoading ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
                  No vendors match this search. Add a vendor or save the quotation as an external
                  source.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="quotes">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Vendor and external quotations</CardTitle>
              <CardDescription>
                Quotes can come from a saved vendor or any other person or organisation.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="border-y bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-5 py-3">Date / validity</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Used by</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map((quote) => (
                    <tr key={String(quote["id"])} className="border-b last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-medium">{String(quote["source_name"])}</p>
                        <Badge variant="outline" className="mt-1">
                          {quote["supplier_id"] ? "Vendor" : "External source"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        {String(quote["quote_reference"] || "No reference")}
                      </td>
                      <td className="px-5 py-4">
                        <p>{String(quote["quote_date"] || "No date").slice(0, 10)}</p>
                        <p className="text-xs text-muted-foreground">
                          Valid until {String(quote["valid_until"] || "not set").slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {money(Number(quote["amount"] || 0), String(quote["currency"] || "MWK"))}
                      </td>
                      <td className="px-5 py-4">
                        {quote["attachment_path"] ? (
                          <a
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            href={attachmentUrl(String(quote["attachment_path"]))}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Paperclip className="size-4" />
                            {String(quote["attachment_name"] || "Open quote")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No document</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {Number(quote["linked_sheets"] || 0)} cost sheet
                        {Number(quote["linked_sheets"] || 0) === 1 ? "" : "s"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit quote from ${String(quote["source_name"])}`}
                            onClick={() => editQuote(quote)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmAction
                            title="Delete this quotation?"
                            description="It will also be unlinked from every cost sheet."
                            onConfirm={() => removeQuote.mutateAsync(String(quote["id"]))}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete quote from ${String(quote["source_name"])}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredQuotes.length && !isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        No source quotations yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={vendorOpen} onOpenChange={setVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{vendorForm.id ? "Edit vendor" : "Add vendor"}</DialogTitle>
            <DialogDescription>
              Save the organisation and its main purchasing contact.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Vendor name"
              value={vendorForm.name}
              onChange={(name) => setVendorForm((form) => ({ ...form, name }))}
              className="sm:col-span-2"
            />
            <FormField
              label="Contact person"
              value={vendorForm.contactName}
              onChange={(contactName) => setVendorForm((form) => ({ ...form, contactName }))}
            />
            <FormField
              label="Category"
              value={vendorForm.category}
              onChange={(category) => setVendorForm((form) => ({ ...form, category }))}
            />
            <FormField
              label="Email"
              type="email"
              value={vendorForm.email}
              onChange={(email) => setVendorForm((form) => ({ ...form, email }))}
            />
            <FormField
              label="Phone"
              value={vendorForm.phone}
              onChange={(phone) => setVendorForm((form) => ({ ...form, phone }))}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={vendorForm.notes}
                onChange={(event) =>
                  setVendorForm((form) => ({ ...form, notes: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => vendorMutation.mutate()} disabled={vendorMutation.isPending}>
              {vendorMutation.isPending ? "Saving…" : "Save vendor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quoteForm.id ? "Edit source quotation" : "Add source quotation"}
            </DialogTitle>
            <DialogDescription>
              Record a quote from a saved vendor or another external source, then link it from a
              cost sheet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Source type</Label>
              <Select
                value={quoteForm.sourceType}
                onValueChange={(sourceType) =>
                  setQuoteForm((form) => ({
                    ...form,
                    sourceType: sourceType as "vendor" | "external",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Saved vendor</SelectItem>
                  <SelectItem value="external">Other person or organisation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {quoteForm.sourceType === "vendor" ? (
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select
                  value={quoteForm.supplierId}
                  onValueChange={(supplierId) => setQuoteForm((form) => ({ ...form, supplierId }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={String(vendor["id"])} value={String(vendor["id"])}>
                        {String(vendor["name"])}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <FormField
                label="Quote source"
                value={quoteForm.sourceName}
                onChange={(sourceName) => setQuoteForm((form) => ({ ...form, sourceName }))}
                placeholder="Person or organisation"
              />
            )}
            <FormField
              label="Quote reference"
              value={quoteForm.quoteReference}
              onChange={(quoteReference) => setQuoteForm((form) => ({ ...form, quoteReference }))}
            />
            <FormField
              label="Quote date"
              type="date"
              value={quoteForm.quoteDate}
              onChange={(quoteDate) => setQuoteForm((form) => ({ ...form, quoteDate }))}
            />
            <FormField
              label="Valid until"
              type="date"
              value={quoteForm.validUntil}
              onChange={(validUntil) => setQuoteForm((form) => ({ ...form, validUntil }))}
            />
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={quoteForm.currency}
                onValueChange={(currency) => setQuoteForm((form) => ({ ...form, currency }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(data?.currencies || []).map((currency) => (
                    <SelectItem key={String(currency["code"])} value={String(currency["code"])}>
                      {String(currency["code"])} — {String(currency["name"])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FormField
              label="Quoted amount"
              type="number"
              value={quoteForm.amount}
              onChange={(amount) => setQuoteForm((form) => ({ ...form, amount }))}
            />
            <div className="space-y-2 sm:col-span-2">
              <Label>Quote document</Label>
              <Input
                type="file"
                onChange={(event) => void uploadQuote(event.target.files?.[0])}
                disabled={uploading}
              />
              {quoteForm.attachment ? (
                <a
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  href={attachmentUrl(quoteForm.attachment.path)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Paperclip className="size-4" />
                  {quoteForm.attachment.name}
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Upload the PDF, image, spreadsheet or document received.
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={quoteForm.notes}
                onChange={(event) =>
                  setQuoteForm((form) => ({ ...form, notes: event.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => quoteMutation.mutate()}
              disabled={quoteMutation.isPending || uploading}
            >
              {quoteMutation.isPending ? "Saving…" : "Save quotation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
