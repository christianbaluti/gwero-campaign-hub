import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["client-deals", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: agreements = [] } = useQuery({
    queryKey: ["client-agreements", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreements")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", "client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("entity_type", "client")
        .eq("entity_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const addNote = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Write a note first.");
      const { error } = await supabase
        .from("activities")
        .insert({ entity_type: "client", entity_id: id, activity_type: "note", body: note.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      toast.success("Activity added.");
      void qc.invalidateQueries({ queryKey: ["activities", "client", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell
      title={client?.name ?? "Client"}
      description={client?.company || "Client account"}
      actions={
        <Button variant="outline" asChild>
          <Link to="/clients">Back to clients</Link>
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{client?.email || "No email"}</p>
              <p>{client?.phone || "No phone"}</p>
              <p>{client?.website || "No website"}</p>
              <p className="text-muted-foreground">{client?.address || "No address"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Open deals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deals.map((d) => (
                <div key={d.id} className="flex justify-between border-b pb-2 text-sm">
                  <span>{d.title}</span>
                  <b>{money(d.value, d.currency)}</b>
                </div>
              ))}
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deals.</p>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Agreements & SLAs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agreements.map((a) => (
                <div key={a.id} className="flex justify-between border-b pb-2 text-sm">
                  <span>{a.title}</span>
                  <span className="capitalize">{a.status}</span>
                </div>
              ))}
              {agreements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No agreements.</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add a meeting, call or account note…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button className="mt-3" onClick={() => addNote.mutate()}>
              Add note
            </Button>
            <div className="mt-6 space-y-4">
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-primary/30 pl-4">
                  <p className="text-sm">{a.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.occurred_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
