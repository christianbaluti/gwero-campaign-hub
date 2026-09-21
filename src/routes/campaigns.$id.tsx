import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { sendCampaign } from "@/lib/crm.functions";
import { BASE_PLACEHOLDERS } from "@/lib/personalize";
import { AppShell } from "@/components/AppShell";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/campaigns/$id")({
  head: () => ({
    meta: [
      { title: "Campaign editor | Gwero CRM" },
      {
        name: "description",
        content: "Write your email, add attachments and recipients, then send.",
      },
      { property: "og:title", content: "Campaign editor | Gwero CRM" },
      {
        property: "og:description",
        content: "Write your email, add attachments and recipients, then send.",
      },
    ],
  }),
  component: CampaignDetail,
});

type Attachment = { path: string; name: string; type?: string; size?: number };

function CampaignDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const send = useServerFn(sendCampaign);

  const { data: campaign } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await db.from("campaigns").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: mailboxes = [] } = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async () => {
      const { data, error } = await db.from("mailboxes").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

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

  const { data: recipients = [] } = useQuery({
    queryKey: ["recipients", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("campaign_recipients")
        .select("*, prospects(email, first_name, last_name, company)")
        .eq("campaign_id", id);
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000,
  });

  const [form, setForm] = useState({
    name: "",
    subject: "",
    body_html: "",
    cc: "",
    bcc: "",
    mailbox_id: "",
    track_opens: true,
    track_clicks: true,
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setForm({
      name: campaign.name,
      subject: campaign.subject,
      body_html: campaign.body_html,
      cc: (campaign.cc ?? []).join(", "),
      bcc: (campaign.bcc ?? []).join(", "),
      mailbox_id: campaign.mailbox_id ?? "",
      track_opens: campaign.track_opens,
      track_clicks: campaign.track_clicks,
    });
    setAttachments((campaign.attachments as unknown as Attachment[]) ?? []);
  }, [campaign]);

  const save = useMutation({
    mutationFn: async (extra?: { attachments?: Attachment[] }) => {
      const list = (extra?.attachments ?? attachments) as unknown;
      const { error } = await db
        .from("campaigns")
        .update({
          name: form.name,
          subject: form.subject,
          body_html: form.body_html,
          cc: form.cc
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          bcc: form.bcc
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          mailbox_id: form.mailbox_id || null,
          track_opens: form.track_opens,
          track_clicks: form.track_clicks,
          attachments: list as never,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved.");
      void qc.invalidateQueries({ queryKey: ["campaign", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function uploadFile(file: File) {
    const formData = new FormData();
    formData.set("campaignId", id);
    formData.set("file", file);
    const response = await fetch("/api/attachments/upload", { method: "POST", body: formData });
    const result = (await response.json()) as Attachment & { error?: string };
    if (!response.ok) {
      toast.error(result.error || "Upload failed");
      return;
    }
    const next = [...attachments, result];
    setAttachments(next);
    save.mutate({ attachments: next });
  }

  const addRecipients = useMutation({
    mutationFn: async (status: string) => {
      const pool = status === "all" ? prospects : prospects.filter((p) => p.status === status);
      const existing = new Set(recipients.map((r) => r.prospect_id));
      const rows = pool
        .filter((p) => !existing.has(p.id))
        .map((p) => ({ campaign_id: id, prospect_id: p.id }));
      if (!rows.length) throw new Error("No new prospects to add.");
      const { error } = await db.from("campaign_recipients").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} recipients added.`);
      void qc.invalidateQueries({ queryKey: ["recipients", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleSend() {
    setSending(true);
    try {
      await save.mutateAsync(undefined);
      const result = await send({ data: { campaignId: id } });
      toast.success(`Sent ${result.sent}, failed ${result.failed}.`);
      void qc.invalidateQueries({ queryKey: ["recipients", id] });
      void qc.invalidateQueries({ queryKey: ["campaign", id] });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSending(false);
    }
  }

  const stats = {
    total: recipients.length,
    sent: recipients.filter((r) => r.status === "sent").length,
    failed: recipients.filter((r) => r.status === "failed").length,
    opened: recipients.filter((r) => (r.open_count ?? 0) > 0).length,
    clicked: recipients.filter((r) => (r.click_count ?? 0) > 0).length,
    replied: recipients.filter((r) => r.replied_at).length,
  };

  const extraKeys = Array.from(
    new Set(prospects.flatMap((p) => Object.keys((p.extra as Record<string, unknown>) ?? {}))),
  ).slice(0, 20);

  return (
    <AppShell
      title={campaign?.name ?? "Campaign"}
      description="Write once, personalise per prospect, and send."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/campaigns">Back</Link>
          </Button>
          <Button variant="outline" onClick={() => save.mutate(undefined)}>
            Save
          </Button>
          <Button onClick={() => void handleSend()} disabled={sending}>
            {sending ? "Sending…" : "Send campaign"}
          </Button>
        </>
      }
    >
      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="recipients">Recipients ({stats.total})</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <Label>Campaign name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Hi {{first_name}}, a quick idea for {{company}}"
                />
              </div>
              <div className="space-y-1">
                <Label>Message (HTML allowed)</Label>
                <Textarea
                  rows={16}
                  value={form.body_html}
                  onChange={(e) => setForm({ ...form, body_html: e.target.value })}
                  placeholder="<p>Hi {{first_name}},</p>"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>CC (comma separated)</Label>
                  <Input
                    value={form.cc}
                    onChange={(e) => setForm({ ...form, cc: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>BCC (comma separated)</Label>
                  <Input
                    value={form.bcc}
                    onChange={(e) => setForm({ ...form, bcc: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sending account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={form.mailbox_id || "__none"}
                  onValueChange={(v) => setForm({ ...form, mailbox_id: v === "__none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pick an account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Not chosen</SelectItem>
                    {mailboxes.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} · {m.from_email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between">
                  <Label>Track opens</Label>
                  <Switch
                    checked={form.track_opens}
                    onCheckedChange={(v) => setForm({ ...form, track_opens: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Track link clicks</Label>
                  <Switch
                    checked={form.track_clicks}
                    onCheckedChange={(v) => setForm({ ...form, track_clicks: v })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadFile(file);
                  }}
                />
                {attachments.map((a) => (
                  <div key={a.path} className="flex items-center justify-between text-sm">
                    <span className="truncate">{a.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const next = attachments.filter((x) => x.path !== a.path);
                        setAttachments(next);
                        save.mutate({ attachments: next });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Placeholders</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[...BASE_PLACEHOLDERS, ...extraKeys].map((key) => (
                  <Badge key={key} variant="secondary">{`{{${key}}}`}</Badge>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recipients" className="mt-4 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-6">
              {["all", "new", "contacted", "interested"].map((status) => (
                <Button key={status} variant="outline" onClick={() => addRecipients.mutate(status)}>
                  Add {status} prospects
                </Button>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => {
                    const p = r.prospects as unknown as {
                      email: string;
                      first_name: string | null;
                      last_name: string | null;
                    } | null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          {[p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—"}
                        </TableCell>
                        <TableCell>{p?.email}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "failed" ? "destructive" : "secondary"}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ConfirmAction
                            title="Remove campaign recipient?"
                            description="This person will no longer receive this campaign."
                            onConfirm={async () => {
                              await db.from("campaign_recipients").delete().eq("id", r.id);
                              void qc.invalidateQueries({ queryKey: ["recipients", id] });
                            }}
                            trigger={
                              <Button size="sm" variant="destructive">
                                Remove
                              </Button>
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(stats).map(([key, value]) => (
              <Card key={key}>
                <CardContent className="pt-6">
                  <p className="text-xs uppercase text-muted-foreground">{key}</p>
                  <p className="font-display text-2xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="overflow-x-auto pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opens</TableHead>
                    <TableHead>Clicks</TableHead>
                    <TableHead>Replied</TableHead>
                    <TableHead>Problem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((r) => {
                    const p = r.prospects as unknown as { email: string } | null;
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{p?.email}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>{r.open_count}</TableCell>
                        <TableCell>{r.click_count}</TableCell>
                        <TableCell>{r.replied_at ? "Yes" : "—"}</TableCell>
                        <TableCell className="max-w-xs truncate text-destructive">
                          {r.error ?? ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
