import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";

export const Route = createFileRoute("/clients")({ component: ClientsPage });

function ClientsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await db
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Client name is required.");
      const { error } = await db
        .from("clients")
        .insert({ name: name.trim(), email: email.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setEmail("");
      toast.success("Client added.");
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell title="Clients" description="Companies and people you actively serve.">
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input
            className="max-w-xs"
            placeholder="Client name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            className="max-w-xs"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            Add client
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => (
          <Link key={c.id} to="/clients/$id" params={{ id: c.id }}>
            <Card className="h-full transition hover:border-primary/40 hover:shadow-raised">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">{c.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.company || c.email || "No contact details"}
                    </p>
                  </div>
                  <Badge variant="secondary">{c.status}</Badge>
                </div>
                <p className="mt-5 text-sm text-muted-foreground">
                  {c.industry || "Industry not set"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No clients yet. Convert a prospect or add one above.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
