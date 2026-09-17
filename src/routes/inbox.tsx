import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { syncReplies } from "@/lib/crm.functions";
import { db } from "@/lib/db";

export const Route = createFileRoute("/inbox")({ component: InboxPage });
function InboxPage() {
  const qc = useQueryClient();
  const sync = useServerFn(syncReplies);
  const [busy, setBusy] = useState(false);
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
  });
  const shown = replies.filter((r) =>
    `${r.from_email} ${r.subject} ${r.snippet}`.toLowerCase().includes(search.toLowerCase()),
  );
  async function runSync() {
    setBusy(true);
    try {
      const result = await sync();
      toast.success(`Checked ${result.checked} accounts; imported ${result.imported} replies.`);
      await qc.invalidateQueries({ queryKey: ["replies"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AppShell
      title="Replies"
      description="Responses collected from all connected inboxes."
      actions={
        <Button onClick={() => void runSync()} disabled={busy}>
          {busy ? "Checking…" : "Check for replies"}
        </Button>
      }
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
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(r.received_at).toLocaleString()}
                </time>
              </div>
              <p className="mt-3 text-sm">{r.snippet || "No preview available."}</p>
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
