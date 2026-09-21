import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmAction } from "@/components/ConfirmAction";
import { saveMailboxCredentials, testMailbox } from "@/lib/crm.functions";
import { db } from "@/lib/db";

export function MailboxSettings() {
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
      const { data, error } = await db
        .from("mailboxes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.email || !form.smtpHost || !form.username || !form.password)
        throw new Error("Complete the required SMTP fields.");
      const { data, error } = await db
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
      if (error || !data) throw error || new Error("Account was not saved.");
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
  const check = async (id: string) => {
    try {
      const result = await test({ data: { mailboxId: id } });
      toast.success(result.message);
      void qc.invalidateQueries({ queryKey: ["mailboxes"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  const remove = async (id: string) => {
    const { error } = await db.from("mailboxes").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Sending account deleted.");
    void qc.invalidateQueries({ queryKey: ["mailboxes"] });
  };
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((old) => ({ ...old, [key]: e.target.value }));
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
      <Card>
        <CardHeader>
          <CardTitle>Add SMTP / IMAP account</CardTitle>
          <CardDescription>
            For any provider that supplies standard outgoing and incoming mail credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            ["name", "Account name *"],
            ["email", "From email *"],
            ["smtpHost", "SMTP host *"],
            ["smtpPort", "SMTP port"],
            ["username", "Username *"],
            ["password", "Password *"],
            ["imapHost", "IMAP host"],
            ["imapPort", "IMAP port"],
          ].map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                value={form[key as keyof typeof form]}
                onChange={set(key as keyof typeof form)}
              />
            </div>
          ))}
          <Button
            className="sm:col-span-2"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            {create.isPending ? "Saving…" : "Save account"}
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <h3 className="font-semibold">Connected sending accounts</h3>
        {mailboxes.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex flex-wrap items-center gap-3 pt-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{m.name}</p>
                  <Badge variant="secondary">{m.provider}</Badge>
                  {m.is_default ? <Badge>Default</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{m.from_email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.last_status || "Not tested yet"}
                </p>
              </div>
              <Button variant="outline" onClick={() => void check(m.id)}>
                Test
              </Button>
              <ConfirmAction
                title="Delete sending account?"
                description={`Remove ${m.from_email} and its stored credentials? Campaign history will remain.`}
                onConfirm={() => remove(m.id)}
                trigger={<Button variant="destructive">Delete</Button>}
              />
            </CardContent>
          </Card>
        ))}
        {!mailboxes.length ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No sending accounts connected yet.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
