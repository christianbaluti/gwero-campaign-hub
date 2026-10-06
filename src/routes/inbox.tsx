import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Paperclip } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { syncReplies } from "@/lib/crm.functions";
import { db } from "@/lib/db";

export const Route = createFileRoute("/inbox")({ component: InboxPage });
function InboxPage() {
  const qc = useQueryClient();
  const sync = useServerFn(syncReplies);
  const syncing = useRef(false);
  const [search, setSearch] = useState("");
  const { data: replies = [] } = useQuery({
    queryKey: ["replies"],
    queryFn: async () => {
      const { data, error } = await db
        .from("replies")
        .select("*, prospects(first_name,last_name,company), campaigns(name)")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30_000,
  });
  const shown = replies.filter((r) =>
    `${r.from_email} ${r.subject} ${r.body || r.snippet}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  useEffect(() => {
    let mounted = true;
    const runSync = async () => {
      if (syncing.current || !mounted) return;
      syncing.current = true;
      try {
        await sync();
        if (mounted) await qc.invalidateQueries({ queryKey: ["replies"] });
      } catch {
        // Connected account status in Settings contains the provider diagnostic.
      } finally {
        syncing.current = false;
      }
    };
    void runSync();
    const timer = window.setInterval(() => void runSync(), 120_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [qc, sync]);
  return (
    <AppShell
      title="Replies"
      description="Responses collected automatically from all connected inboxes."
    >
      <Input
        className="mb-6 max-w-md"
        placeholder="Search replies"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Card>
        <CardContent className="divide-y p-0">
          {shown.map((r) => (
            <article key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{r.subject || "(No subject)"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.from_email} ·{" "}
                    {(r.campaigns as { name?: string } | null)?.name || "Direct reply"}
                  </p>
                  {r.contact_id && r.prospect_id ? (
                    <Link
                      to="/prospects/$id/contacts/$contactId"
                      params={{ id: r.prospect_id, contactId: r.contact_id }}
                      className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                    >
                      Open full conversation
                    </Link>
                  ) : null}
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(r.received_at).toLocaleString()}
                </time>
              </div>
              {r.body_html ? (
                <iframe
                  title={`Email ${r.subject || r.id}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>body{font:14px system-ui,sans-serif;color:#374151;margin:0;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}</style></head><body>${r.body_html}</body></html>`}
                  className="mt-3 min-h-20 w-full border-0 bg-white"
                />
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm">
                  {r.body || r.snippet || "No preview available."}
                </p>
              )}
              {Array.isArray(r.attachments) && r.attachments.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(r.attachments as Array<{ path: string; name: string }>).map((attachment) => {
                    const [ownerId, fileId] = attachment.path.split("/");
                    return (
                      <a
                        key={attachment.path}
                        href={`/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`}
                        download={attachment.name}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs hover:text-primary"
                      >
                        <Paperclip className="size-3.5" /> {attachment.name}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </article>
          ))}
          {shown.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No replies found.</p>
          ) : null}
        </CardContent>
      </Card>
    </AppShell>
  );
}
