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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    smtpHost: "",
    smtpPort: "587",
    username: "",
    password: "",
    imapHost: "",
    imapPort: "993",
    fromName: "",
    isDefault: false,
    provider: "smtp",
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
  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      smtpHost: "",
      smtpPort: "587",
      username: "",
      password: "",
      imapHost: "",
      imapPort: "993",
      fromName: "",
      isDefault: false,
      provider: "smtp",
    });
  };
  const save = useMutation({
    mutationFn: async () => {
      const smtp = form.provider === "smtp";
      if (
        !form.name ||
        !form.email ||
        (smtp && (!form.smtpHost || !form.username || (!editingId && !form.password)))
      )
        throw new Error(
          smtp ? "Complete the required SMTP fields." : "Add the account name and email.",
        );
      if (form.isDefault) {
        const { error } = await db.from("mailboxes").update({ is_default: false });
        if (error) throw error;
      }
      const values = {
        name: form.name.trim(),
        from_email: form.email.trim().toLowerCase(),
        from_name: form.fromName.trim() || null,
        provider: form.provider,
        smtp_host: smtp ? form.smtpHost.trim() : null,
        smtp_port: smtp ? Number(form.smtpPort) : null,
        smtp_username: smtp ? form.username.trim() : null,
        smtp_secure: smtp && Number(form.smtpPort) === 465,
        imap_host: smtp ? form.imapHost.trim() || null : null,
        imap_port: smtp ? Number(form.imapPort) : null,
        imap_username: smtp ? form.username.trim() : null,
        is_default: form.isDefault,
      };
      const query = editingId
        ? db.from("mailboxes").update(values).eq("id", editingId)
        : db.from("mailboxes").insert(values);
      const { data, error } = await query.select().single();
      if (error || !data) throw error || new Error("Account was not saved.");
      if (smtp && form.password)
        await saveSecrets({
          data: { mailboxId: data.id, smtpPassword: form.password, imapPassword: form.password },
        });
    },
    onSuccess: () => {
      toast.success(editingId ? "Sending account updated." : "Sending account saved.");
      resetForm();
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
    setForm((old) => ({
      ...old,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));
  const edit = (mailbox: (typeof mailboxes)[number]) => {
    setEditingId(mailbox.id);
    setForm({
      name: mailbox.name,
      email: mailbox.from_email,
      fromName: mailbox.from_name || "",
      smtpHost: mailbox.smtp_host || "",
      smtpPort: String(mailbox.smtp_port || 587),
      username: mailbox.smtp_username || mailbox.from_email,
      password: "",
      imapHost: mailbox.imap_host || "",
      imapPort: String(mailbox.imap_port || 993),
      isDefault: mailbox.is_default,
      provider: mailbox.provider,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.25fr]">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingId
              ? `Edit ${form.provider === "smtp" ? "SMTP / IMAP" : form.provider} account`
              : "Add SMTP / IMAP account"}
          </CardTitle>
          <CardDescription>
            For any provider that supplies standard outgoing and incoming mail credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["name", "Account name *"],
              ["email", "From email *"],
              ["fromName", "From name"],
              ...(form.provider === "smtp"
                ? [
                    ["smtpHost", "SMTP host *"],
                    ["smtpPort", "SMTP port"],
                    ["username", "Username *"],
                    [
                      "password",
                      editingId ? "New password (leave blank to keep current)" : "Password *",
                    ],
                    ["imapHost", "IMAP host"],
                    ["imapPort", "IMAP port"],
                  ]
                : []),
            ] as string[][]
          ).map(([key, label]) => (
            <div key={key}>
              <Label>{label}</Label>
              <Input
                type={key === "password" ? "password" : key === "email" ? "email" : "text"}
                value={String(form[key as keyof typeof form])}
                onChange={set(key as keyof typeof form)}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={form.isDefault} onChange={set("isDefault")} />
            Use this as the default sending account
          </label>
          <Button
            className={editingId ? "" : "sm:col-span-2"}
            onClick={() => save.mutate()}
            disabled={save.isPending}
          >
            {save.isPending ? "Saving…" : editingId ? "Update account" : "Save account"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={resetForm} disabled={save.isPending}>
              Cancel editing
            </Button>
          ) : null}
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
              <Button variant="outline" onClick={() => edit(m)}>
                Edit
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
