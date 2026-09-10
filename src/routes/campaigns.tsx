import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns | Gwero CRM" },
      { name: "description", content: "Draft, send and measure mass email campaigns to your prospects." },
      { property: "og:title", content: "Campaigns | Gwero CRM" },
      { property: "og:description", content: "Draft, send and measure mass email campaigns to your prospects." },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*, campaign_recipients(status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .insert({ name: name || "Untitled campaign", subject: "", body_html: "" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setName("");
      toast.success("Campaign created.");
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Campaigns" description="Mass emails to your prospect lists.">
      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <Input
            className="max-w-sm"
            placeholder="New campaign name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button onClick={() => create.mutate()}>Create campaign</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const recipients = (c.campaign_recipients ?? []) as Array<{ status: string }>;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to="/campaigns/$id"
                        params={{ id: c.id }}
                        className="font-medium text-primary hover:underline"
                      >
                        {c.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{c.subject || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "sent" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{recipients.length}</TableCell>
                    <TableCell>{recipients.filter((r) => r.status === "sent").length}</TableCell>
                  </TableRow>
                );
              })}
              {campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No campaigns yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
