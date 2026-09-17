import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
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
import { db } from "@/lib/db";

export const Route = createFileRoute("/deals")({ component: DealsPage });
const stages = ["new", "qualified", "proposal", "negotiation", "won", "lost"] as const;
function DealsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const { data: deals = [] } = useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await db
        .from("deals")
        .select("*, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Deal title is required.");
      const { error } = await db
        .from("deals")
        .insert({ title: title.trim(), value: Number(value) || 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setValue("");
      toast.success("Deal added.");
      void qc.invalidateQueries({ queryKey: ["deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const { error } = await db.from("deals").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["deals"] }),
  });
  return (
    <AppShell title="Deals" description="Move opportunities through your sales pipeline.">
      <Card className="mb-6">
        <CardContent className="flex flex-wrap gap-3 pt-6">
          <Input
            className="max-w-xs"
            placeholder="New deal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            className="max-w-40"
            type="number"
            placeholder="Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button onClick={() => create.mutate()}>Add deal</Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
        {stages.map((stage) => (
          <section key={stage} className="rounded-xl bg-muted/60 p-3">
            <div className="mb-3 flex justify-between">
              <h2 className="text-sm font-semibold capitalize">{stage}</h2>
              <span className="text-xs text-muted-foreground">
                {deals.filter((d) => d.stage === stage).length}
              </span>
            </div>
            <div className="space-y-3">
              {deals
                .filter((d) => d.stage === stage)
                .map((d) => (
                  <Card key={d.id}>
                    <CardContent className="pt-4">
                      <p className="text-sm font-semibold">{d.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {(d.clients as { name?: string } | null)?.name || "Unassigned"}
                      </p>
                      <p className="my-3 font-semibold">{money(d.value, d.currency)}</p>
                      <Select
                        value={d.stage}
                        onValueChange={(next) => move.mutate({ id: d.id, stage: next })}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {stages.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
