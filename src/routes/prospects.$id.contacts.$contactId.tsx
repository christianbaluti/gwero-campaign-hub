import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Phone, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { db } from "@/lib/db";
import { sendProspectEmail, syncReplies } from "@/lib/crm.functions";

export const Route = createFileRoute("/prospects/$id/contacts/$contactId")({
  component: ProspectContactPage,
});

function ProspectContactPage() {
  const { id, contactId } = Route.useParams();
  const qc = useQueryClient();
  const [message, setMessage] = useState({ mailboxId: "", subject: "", body: "" });
  const [busy, setBusy] = useState(false);
  const { data: prospect } = useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => (await db.from("prospects").select("*").eq("id", id).maybeSingle()).data,
  });
  const { data: contact, isLoading } = useQuery({
    queryKey: ["prospect-contact", contactId],
    queryFn: async () =>
      (
        await db
          .from("prospect_contacts")
          .select("*")
          .eq("id", contactId)
          .eq("prospect_id", id)
          .maybeSingle()
      ).data,
  });
  const { data: interactions = [] } = useQuery({
    queryKey: ["contact-interactions", contactId],
    queryFn: async () =>
      (
        await db
          .from("prospect_interactions")
          .select("*")
          .eq("contact_id", contactId)
          .order("occurred_at", { ascending: false })
      ).data || [],
  });
  const { data: replies = [] } = useQuery({
    queryKey: ["contact-replies", contactId],
    queryFn: async () =>
      (
        await db
          .from("replies")
          .select("*")
          .eq("contact_id", contactId)
          .order("received_at", { ascending: false })
      ).data || [],
  });
  const { data: mailboxes = [] } = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async () =>
      (await db.from("mailboxes").select("*").order("is_default", { ascending: false })).data || [],
  });
  const selectedMailbox = message.mailboxId || mailboxes[0]?.id || "";
  const refresh = async () => {
    setBusy(true);
    try {
      const result = await syncReplies();
      toast.success(
        `Mailbox sync complete. ${result.imported} new message${result.imported === 1 ? "" : "s"} found.`,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["contact-replies", contactId] }),
        qc.invalidateQueries({ queryKey: ["prospect-replies", id] }),
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inbox sync failed.");
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    setBusy(true);
    try {
      await sendProspectEmail({
        data: {
          prospectId: id,
          contactId,
          mailboxId: selectedMailbox,
          subject: message.subject,
          body: message.body,
        },
      });
      setMessage((old) => ({ ...old, subject: "", body: "" }));
      toast.success("Email sent and added to this conversation.");
      await qc.invalidateQueries({ queryKey: ["contact-interactions", contactId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Email could not be sent.");
    } finally {
      setBusy(false);
    }
  };
  if (isLoading)
    return (
      <AppShell title="Contact">
        <p>Loading contact…</p>
      </AppShell>
    );
  if (!contact)
    return (
      <AppShell title="Contact not found">
        <Button asChild>
          <Link to="/prospects/$id" params={{ id }}>
            Back to prospect
          </Link>
        </Button>
      </AppShell>
    );
  const name =
    [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email || "Contact";
  const initials =
    [contact.first_name, contact.last_name]
      .filter(Boolean)
      .map((value) => value!.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  const conversation = [
    ...interactions.map((item) => ({
      id: item.id,
      date: item.occurred_at,
      direction: item.direction,
      subject: item.subject,
      body: item.body,
    })),
    ...replies.map((item) => ({
      id: item.id,
      date: item.received_at,
      direction: "inbound",
      subject: item.subject,
      body: item.body || item.snippet || "",
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return (
    <AppShell
      title={name}
      description={prospect?.company || "Prospect contact"}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/prospects/$id" params={{ id }}>
              Back to company
            </Link>
          </Button>
          <Button
            variant="outline"
            disabled={busy || !mailboxes.length}
            onClick={() => void refresh()}
          >
            <RefreshCw className="size-4" /> Sync inbox
          </Button>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="size-24">
                <AvatarImage src={contact.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{name}</h2>
              <p className="text-sm text-muted-foreground">
                {contact.job_title || "Position not set"}
              </p>
            </div>
            <div className="mt-6 space-y-3 text-sm">
              {contact.email ? (
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Mail className="size-4" />
                  {contact.email}
                </a>
              ) : null}
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Phone className="size-4" />
                  {contact.phone}
                </a>
              ) : null}
            </div>
            <Button className="mt-6 w-full" variant="outline" asChild>
              <Link to="/prospects/$id" params={{ id }}>
                Edit contact details
              </Link>
            </Button>
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Email this contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!mailboxes.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No sending account is configured. Add SMTP, Gmail or Microsoft 365 in{" "}
                  <Link to="/settings" className="font-semibold underline">
                    Settings
                  </Link>{" "}
                  before sending email.
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label>From</Label>
                    <Select
                      value={selectedMailbox}
                      onValueChange={(mailboxId) => setMessage((old) => ({ ...old, mailboxId }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mailboxes.map((mailbox) => (
                          <SelectItem key={mailbox.id} value={mailbox.id}>
                            {mailbox.name} · {mailbox.from_email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={message.subject}
                      onChange={(event) =>
                        setMessage((old) => ({ ...old, subject: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <Textarea
                      rows={7}
                      value={message.body}
                      onChange={(event) =>
                        setMessage((old) => ({ ...old, body: event.target.value }))
                      }
                    />
                  </div>
                  <Button
                    disabled={busy || !message.subject.trim() || !message.body.trim()}
                    onClick={() => void send()}
                  >
                    <Send className="size-4" /> Send email
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Full conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {conversation.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 ${item.direction === "outbound" ? "ml-8 bg-primary/5" : "mr-8 bg-muted/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={item.direction === "inbound" ? "default" : "secondary"}>
                      {item.direction}
                    </Badge>
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleString()}
                    </time>
                  </div>
                  {item.subject ? <p className="mt-2 font-medium">{item.subject}</p> : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              ))}
              {!conversation.length ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No emails with this contact yet.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
