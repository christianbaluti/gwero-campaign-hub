import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/prospects/$id")({ component: ProspectDetail });
const stages = ["new", "contacted", "replied", "interested", "not_interested", "client"];

function ProspectDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [message, setMessage] = useState({ subject: "", body: "", interaction_type: "note" });
  const {
    data: prospect,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => {
      const { data, error } = await db.from("prospects").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: interactions = [] } = useQuery({
    queryKey: ["prospect-interactions", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("prospect_interactions")
        .select("*")
        .eq("prospect_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: replies = [] } = useQuery({
    queryKey: ["prospect-replies", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("replies")
        .select("*")
        .eq("prospect_id", id)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const status = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await db.from("prospects").update({ status: value }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prospect", id] }),
  });
  const addInteraction = async () => {
    if (!message.body.trim()) return;
    const { error } = await db.from("prospect_interactions").insert({
      prospect_id: id,
      interaction_type: message.interaction_type,
      direction: message.interaction_type === "email" ? "outbound" : "internal",
      subject: message.subject || null,
      body: message.body,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessage({ subject: "", body: "", interaction_type: "note" });
    toast.success("Interaction recorded.");
    void qc.invalidateQueries({ queryKey: ["prospect-interactions", id] });
  };
  const convert = async () => {
    if (!prospect) return;
    const { error } = await db.from("clients").insert({
      name:
        [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") ||
        prospect.company ||
        prospect.email,
      company: prospect.company,
      email: prospect.email,
      phone: prospect.phone,
      website: prospect.website,
      prospect_id: id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await db.from("prospects").update({ status: "client" }).eq("id", id);
    toast.success("Prospect converted to a client.");
    void qc.invalidateQueries({ queryKey: ["prospect", id] });
  };
  if (isLoading)
    return (
      <AppShell title="Prospect">
        <p>Loading prospect…</p>
      </AppShell>
    );
  if (isError || !prospect)
    return (
      <AppShell
        title="Prospect not found"
        description="This record does not exist in the current MySQL database."
      >
        <Button asChild>
          <Link to="/prospects">Return to prospects</Link>
        </Button>
      </AppShell>
    );
  const timeline = [
    ...interactions.map((x) => ({
      id: x.id,
      date: x.occurred_at,
      type: x.interaction_type,
      subject: x.subject,
      body: x.body,
      direction: x.direction,
    })),
    ...replies.map((x) => ({
      id: x.id,
      date: x.received_at,
      type: "email reply",
      subject: x.subject,
      body: x.snippet,
      direction: "inbound",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return (
    <AppShell
      title={
        [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") ||
        prospect.company ||
        prospect.email
      }
      description={[prospect.job_title, prospect.company].filter(Boolean).join(" at ")}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/prospects">Back to prospects</Link>
          </Button>
          {prospect.status !== "client" ? (
            <Button onClick={() => void convert()}>Convert to client</Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Prospect profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pipeline stage</Label>
                <Select value={prospect.status} onValueChange={(v) => status.mutate(v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {prospect.fit_score != null ? (
                <div>
                  <Badge>{prospect.fit_score}% AI fit</Badge>
                  <p className="mt-2 text-sm text-muted-foreground">{prospect.fit_reason}</p>
                </div>
              ) : null}
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>
                    {prospect.email.includes("@prospect.local") ? "Not verified" : prospect.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{prospect.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Website</dt>
                  <dd>
                    {prospect.website ? (
                      <a
                        className="text-violet-700 underline"
                        href={prospect.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Visit website
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">LinkedIn</dt>
                  <dd>
                    {prospect.linkedin_url ? (
                      <a
                        className="text-violet-700 underline"
                        href={prospect.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open profile
                      </a>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Continue the conversation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <Select
                  value={message.interaction_type}
                  onValueChange={(v) => setMessage((o) => ({ ...o, interaction_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Internal note</SelectItem>
                    <SelectItem value="call">Phone call</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="email">Email follow-up</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Subject (optional)"
                  value={message.subject}
                  onChange={(e) => setMessage((o) => ({ ...o, subject: e.target.value }))}
                />
              </div>
              <Textarea
                rows={4}
                placeholder="Record what happened or draft the next follow-up…"
                value={message.body}
                onChange={(e) => setMessage((o) => ({ ...o, body: e.target.value }))}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Email follow-ups are recorded here; use Campaigns or the connected inbox to send
                  them.
                </p>
                <Button onClick={() => void addInteraction()}>Save interaction</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Interaction and email timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge variant="secondary">{item.direction}</Badge>
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleString()}
                    </time>
                  </div>
                  {item.subject ? <p className="mt-3 font-medium">{item.subject}</p> : null}
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
                </div>
              ))}
              {!timeline.length ? (
                <p className="py-10 text-center text-muted-foreground">
                  No interactions yet. Add the first note, call, meeting or follow-up.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
