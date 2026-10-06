import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Image,
  Italic,
  Link2,
  Mail,
  Paperclip,
  Phone,
  Send,
  Underline,
  X,
} from "lucide-react";
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
import { db } from "@/lib/db";
import { sendProspectEmail, syncReplies } from "@/lib/crm.functions";

export const Route = createFileRoute("/prospects/$id/contacts/$contactId")({
  component: ProspectContactPage,
});

type Attachment = { path: string; name: string; type: string; size: number };

function parseAttachments(value: unknown): Attachment[] {
  if (Array.isArray(value)) return value as Attachment[];
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as Attachment[]) : [];
  } catch {
    return [];
  }
}

function attachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}

function ProspectContactPage() {
  const { id, contactId } = Route.useParams();
  const qc = useQueryClient();
  const editor = useRef<HTMLDivElement>(null);
  const syncBusy = useRef(false);
  const [message, setMessage] = useState({ mailboxId: "", subject: "", body: "", bodyHtml: "" });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    refetchInterval: 30_000,
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
    refetchInterval: 30_000,
  });
  const { data: mailboxes = [] } = useQuery({
    queryKey: ["mailboxes"],
    queryFn: async () =>
      (await db.from("mailboxes").select("*").order("is_default", { ascending: false })).data || [],
  });
  const selectedMailbox = message.mailboxId || mailboxes[0]?.id || "";

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (syncBusy.current || !mounted) return;
      syncBusy.current = true;
      try {
        await syncReplies();
        if (mounted)
          await Promise.all([
            qc.invalidateQueries({ queryKey: ["contact-replies", contactId] }),
            qc.invalidateQueries({ queryKey: ["prospect-replies", id] }),
          ]);
      } catch {
        // Settings retains the provider diagnostic; background refresh stays quiet.
      } finally {
        syncBusy.current = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 120_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [contactId, id, qc]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("ownerId", contactId);
        form.set("file", file);
        const response = await fetch("/api/attachments/upload", { method: "POST", body: form });
        const result = (await response.json()) as Attachment & { error?: string };
        if (!response.ok) throw new Error(result.error || `Could not upload ${file.name}.`);
        uploaded.push(result);
      }
      setAttachments((current) => [...current, ...uploaded]);
      toast.success(`${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"} added.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Attachment upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const updateEditor = () => {
    setMessage((current) => ({
      ...current,
      body: editor.current?.innerText || "",
      bodyHtml: editor.current?.innerHTML || "",
    }));
  };
  const format = (command: string, value?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, value);
    updateEditor();
  };
  const addLink = () => {
    const url = window.prompt("Paste the link URL");
    if (url) format("createLink", url);
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
          bodyHtml: message.bodyHtml,
          attachments,
        },
      });
      setMessage((current) => ({ ...current, subject: "", body: "", bodyHtml: "" }));
      setAttachments([]);
      if (editor.current) editor.current.innerHTML = "";
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
      bodyHtml: item.body_html || "",
      attachments: parseAttachments(item.attachments),
    })),
    ...replies.map((item) => ({
      id: item.id,
      date: item.received_at,
      direction: "inbound",
      subject: item.subject,
      body: item.body || item.snippet || "",
      bodyHtml: item.body_html || "",
      attachments: parseAttachments(item.attachments),
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <AppShell
      title={name}
      description={prospect?.company || "Prospect contact"}
      actions={
        <Button variant="outline" asChild>
          <Link to="/prospects/$id" params={{ id }}>
            Back to company
          </Link>
        </Button>
      }
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="self-start">
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
                  className="flex items-center gap-2 break-all hover:text-primary"
                >
                  <Mail className="size-4 shrink-0" />
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
        <div className="min-w-0 space-y-5">
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
                      onValueChange={(mailboxId) =>
                        setMessage((current) => ({ ...current, mailboxId }))
                      }
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
                        setMessage((current) => ({ ...current, subject: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Message</Label>
                    <div className="overflow-hidden rounded-md border bg-background">
                      <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Bold"
                          onClick={() => format("bold")}
                        >
                          <Bold className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Italic"
                          onClick={() => format("italic")}
                        >
                          <Italic className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Underline"
                          onClick={() => format("underline")}
                        >
                          <Underline className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Add link"
                          onClick={addLink}
                        >
                          <Link2 className="size-4" />
                        </Button>
                        <Label
                          htmlFor="contact-email-attachment"
                          className="ml-auto inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm hover:bg-muted"
                        >
                          <Paperclip className="size-4" />
                          {uploading ? "Uploading…" : "Attach files"}
                        </Label>
                        <input
                          id="contact-email-attachment"
                          className="sr-only"
                          type="file"
                          multiple
                          disabled={uploading}
                          onChange={(event) => {
                            void uploadFiles(event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </div>
                      <div
                        ref={editor}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={updateEditor}
                        data-placeholder="Write your message…"
                        className="min-h-40 max-h-96 overflow-y-auto p-3 text-sm outline-none empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]"
                      />
                    </div>
                  </div>
                  {attachments.length ? (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((attachment) => (
                        <span
                          key={attachment.path}
                          className="inline-flex max-w-full items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs"
                        >
                          <Image className="size-3.5 shrink-0" />
                          <span className="truncate">{attachment.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${attachment.name}`}
                            onClick={() =>
                              setAttachments((current) =>
                                current.filter((item) => item.path !== attachment.path),
                              )
                            }
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Button
                    disabled={busy || uploading || !message.subject.trim() || !message.body.trim()}
                    onClick={() => void send()}
                  >
                    <Send className="size-4" />
                    {busy ? "Sending…" : "Send email"}
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
                  className={`min-w-0 rounded-xl border p-4 ${item.direction === "outbound" ? "sm:ml-8 bg-primary/5" : "sm:mr-8 bg-muted/40"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={item.direction === "inbound" ? "default" : "secondary"}>
                      {item.direction}
                    </Badge>
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleString()}
                    </time>
                  </div>
                  {item.subject ? (
                    <p className="mt-2 break-words font-medium">{item.subject}</p>
                  ) : null}
                  {item.bodyHtml ? (
                    <iframe
                      title={`Email ${item.subject || item.id}`}
                      sandbox=""
                      referrerPolicy="no-referrer"
                      srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{font:14px system-ui,sans-serif;color:#374151;margin:0;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${item.bodyHtml}</body></html>`}
                      className="mt-2 min-h-24 w-full border-0 bg-white"
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  )}
                  {item.attachments.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.attachments.map((attachment) => (
                        <a
                          key={attachment.path}
                          href={attachmentUrl(attachment.path)}
                          download={attachment.name}
                          className="inline-flex max-w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-xs hover:text-primary"
                        >
                          <Paperclip className="size-3.5 shrink-0" />
                          <span className="truncate">{attachment.name}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!conversation.length ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No emails with this contact yet. New replies are checked automatically.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
