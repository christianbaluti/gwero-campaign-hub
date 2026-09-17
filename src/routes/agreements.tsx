import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agreements")({ component: AgreementsPage });
function AgreementsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState("");
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id,name").order("name");
      if (error) throw error;
      return data;
    },
  });
  const { data: agreements = [] } = useQuery({
    queryKey: ["agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agreements")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !clientId) throw new Error("Choose a client and enter a title.");
      const { error } = await supabase
        .from("agreements")
        .insert({ title: title.trim(), client_id: clientId });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      toast.success("Agreement added.");
      void qc.invalidateQueries({ queryKey: ["agreements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell
      title="Agreements & SLAs"
      description="Track contracts, service commitments and renewals."
    >
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input
            className="max-w-xs"
            placeholder="Agreement title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Choose client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => create.mutate()}>Add agreement</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agreements.map((a) => (
          <Card key={a.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{a.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(a.clients as { name?: string } | null)?.name}
                  </p>
                </div>
                <Badge variant="secondary">{a.status}</Badge>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="capitalize">{a.agreement_type}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Value</dt>
                  <dd>{money(a.value, a.currency)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Response</dt>
                  <dd>{a.response_time_hours ? `${a.response_time_hours} hours` : "Not set"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Renews</dt>
                  <dd>{a.auto_renew ? "Automatically" : a.end_date || "Not set"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
        {agreements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agreements yet.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
