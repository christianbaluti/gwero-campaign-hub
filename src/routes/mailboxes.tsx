import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveMailboxCredentials, testMailbox } from "@/lib/crm.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/mailboxes")({ component: MailboxesPage });
function MailboxesPage() {
  const qc = useQueryClient();
  const saveSecrets = useServerFn(saveMailboxCredentials);
  const test = useServerFn(testMailbox);
  const [form, setForm] = useState({
    name: "",
    email: "",
    smtpHost: "",
    smtpPort: "587",
    username: "",
    password: "",
    imapHost: "",
    imapPort: "993",
  });
  const { data: mailboxes = [] } = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mailboxes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.email || !form.smtpHost || !form.username || !form.password)
        throw new Error("Complete the required SMTP fields.");
      const { data, error } = await supabase
        .from("mailboxes")
        .insert({
          name: form.name,
          from_email: form.email,
          provider: "smtp",
          smtp_host: form.smtpHost,
          smtp_port: Number(form.smtpPort),
          smtp_username: form.username,
          smtp_secure: Number(form.smtpPort) === 465,
          imap_host: form.imapHost || null,
          imap_port: Number(form.imapPort),
          imap_username: form.username,
        })
        .select()
        .single();
      if (error) throw error;
      await saveSecrets({
        data: { mailboxId: data.id, smtpPassword: form.password, imapPassword: form.password },
      });
    },
    onSuccess: () => {
      toast.success("Sending account saved.");
      setForm({
        name: "",
        email: "",
        smtpHost: "",
        smtpPort: "587",
        username: "",
        password: "",
        imapHost: "",
        imapPort: "993",
      });
      void qc.invalidateQueries({ queryKey: ["mailboxes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  async function check(id: string) {
    try {
      const result = await test({ data: { mailboxId: id } });
      toast.success(result.message);
      void qc.invalidateQueries({ queryKey: ["mailboxes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <AppShell
      title="Sending accounts"
      description="Connect SMTP/IMAP or authorize Gmail and Microsoft 365."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connect with OAuth</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" asChild>
                <a href="/api/oauth/google/start">Connect Gmail</a>
              </Button>
              <Button className="w-full" variant="outline" asChild>
                <a href="/api/oauth/microsoft/start">Connect Microsoft 365 / Outlook</a>
              </Button>
              <p className="text-xs text-muted-foreground">
                OAuth client IDs and secrets must be configured on the server.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Add SMTP / IMAP account</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Account name *</Label>
                <Input value={form.name} onChange={set("name")} />
              </div>
              <div>
                <Label>From email *</Label>
                <Input type="email" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <Label>SMTP host *</Label>
                <Input value={form.smtpHost} onChange={set("smtpHost")} />
              </div>
              <div>
                <Label>SMTP port</Label>
                <Input value={form.smtpPort} onChange={set("smtpPort")} />
              </div>
              <div>
                <Label>Username *</Label>
                <Input value={form.username} onChange={set("username")} />
              </div>
              <div>
                <Label>Password *</Label>
                <Input type="password" value={form.password} onChange={set("password")} />
              </div>
              <div>
                <Label>IMAP host</Label>
                <Input value={form.imapHost} onChange={set("imapHost")} />
              </div>
              <div>
                <Label>IMAP port</Label>
                <Input value={form.imapPort} onChange={set("imapPort")} />
              </div>
              <Button
                className="sm:col-span-2"
                onClick={() => create.mutate()}
                disabled={create.isPending}
              >
                Save account
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          {mailboxes.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-wrap items-center gap-4 pt-6">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{m.name}</h2>
                    <Badge variant="secondary">{m.provider}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{m.from_email}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {m.last_status || "Not tested yet"}
                  </p>
                </div>
                <Button variant="outline" onClick={() => void check(m.id)}>
                  Test connection
                </Button>
              </CardContent>
            </Card>
          ))}
          {mailboxes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sending accounts connected yet.</p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
