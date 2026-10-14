import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, money } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/db";
import { ConfirmAction } from "@/components/ConfirmAction";
import { OrganizationLocations } from "@/components/OrganizationLocations";
import { normalizePhone } from "@/lib/contact-normalization";

export const Route = createFileRoute("/clients/$id")({ component: ClientDetail });

function ClientDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [contact, setContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
    location: "",
    location_source_url: "",
  });
  const [editingContact, setEditingContact] = useState<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    location: string;
    location_source_url: string;
  } | null>(null);
  const { data: client } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await db.from("clients").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["client-deals", id],
    queryFn: async () => {
      const { data, error } = await db
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
      const { data, error } = await db
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
      const { data, error } = await db
        .from("activities")
        .select("*")
        .eq("entity_type", "client")
        .eq("entity_id", id)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["client-contacts", id],
    queryFn: async () => {
      const { data, error } = await db
        .from("client_contacts")
        .select("*")
        .eq("client_id", id)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const addNote = useMutation({
    mutationFn: async () => {
      if (!note.trim()) throw new Error("Write a note first.");
      const { error } = await db
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
  const addContact = useMutation({
    mutationFn: async () => {
      if (!contact.first_name.trim() && !contact.last_name.trim() && !contact.email.trim()) {
        throw new Error("Add a contact name or email address.");
      }
      const normalizedPhone = normalizePhone(contact.phone);
      const { error } = await db.from("client_contacts").insert({
        client_id: id,
        first_name: contact.first_name.trim() || null,
        last_name: contact.last_name.trim() || null,
        email: contact.email.trim().toLowerCase() || null,
        phone: normalizedPhone || null,
        raw_phone: contact.phone.trim() || null,
        job_title: contact.job_title.trim() || null,
        location: contact.location.trim() || null,
        location_source_url: contact.location_source_url.trim() || null,
        location_is_inferred: false,
        is_primary: contacts.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setContact({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        job_title: "",
        location: "",
        location_source_url: "",
      });
      toast.success("Contact person added.");
      void qc.invalidateQueries({ queryKey: ["client-contacts", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const updateContact = useMutation({
    mutationFn: async () => {
      if (!editingContact) return;
      const { error } = await db
        .from("client_contacts")
        .update({
          first_name: editingContact.first_name.trim() || null,
          last_name: editingContact.last_name.trim() || null,
          email: editingContact.email.trim().toLowerCase() || null,
          phone: normalizePhone(editingContact.phone) || null,
          raw_phone: editingContact.phone.trim() || null,
          job_title: editingContact.job_title.trim() || null,
          location: editingContact.location.trim() || null,
          location_source_url: editingContact.location_source_url.trim() || null,
          location_is_inferred: false,
        })
        .eq("id", editingContact.id)
        .eq("client_id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingContact(null);
      toast.success("Contact details updated.");
      void qc.invalidateQueries({ queryKey: ["client-contacts", id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeContact = async (contactId: string) => {
    const { error } = await db.from("client_contacts").delete().eq("id", contactId);
    if (error) throw new Error(error.message);
    void qc.invalidateQueries({ queryKey: ["client-contacts", id] });
  };
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
              <CardTitle>Company profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client?.logo_path ? (
                <img
                  src={client.logo_path}
                  alt={`${client.company || client.name} logo`}
                  className="mb-4 h-20 w-full rounded-xl border bg-white object-contain p-3"
                />
              ) : null}
              <p>{client?.email || "No email"}</p>
              <p>{client?.phone || "No phone"}</p>
              <p>{client?.website || "No website"}</p>
              <p className="text-muted-foreground">{client?.address || "No address"}</p>
              {client ? (
                <div className="mt-5 border-t pt-5">
                  <OrganizationLocations entityType="client" entityId={id} />
                </div>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contact people</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="First name"
                  value={contact.first_name}
                  onChange={(event) =>
                    setContact((old) => ({ ...old, first_name: event.target.value }))
                  }
                />
                <Input
                  placeholder="Last name"
                  value={contact.last_name}
                  onChange={(event) =>
                    setContact((old) => ({ ...old, last_name: event.target.value }))
                  }
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={contact.email}
                  onChange={(event) => setContact((old) => ({ ...old, email: event.target.value }))}
                />
                <Input
                  placeholder="Phone number"
                  value={contact.phone}
                  onChange={(event) => setContact((old) => ({ ...old, phone: event.target.value }))}
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Job title"
                  value={contact.job_title}
                  onChange={(event) =>
                    setContact((old) => ({ ...old, job_title: event.target.value }))
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Contact person's professional location"
                  value={contact.location}
                  onChange={(event) =>
                    setContact((old) => ({ ...old, location: event.target.value }))
                  }
                />
                <Input
                  className="sm:col-span-2"
                  type="url"
                  placeholder="Location verification source URL (optional)"
                  value={contact.location_source_url}
                  onChange={(event) =>
                    setContact((old) => ({ ...old, location_source_url: event.target.value }))
                  }
                />
              </div>
              <Button
                variant="outline"
                onClick={() => addContact.mutate()}
                disabled={addContact.isPending}
              >
                Add contact person
              </Button>
              <div className="space-y-2">
                {contacts.map((person) =>
                  editingContact?.id === person.id ? (
                    <div key={person.id} className="rounded-xl border p-3">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {(
                          [
                            "first_name",
                            "last_name",
                            "email",
                            "phone",
                            "job_title",
                            "location",
                            "location_source_url",
                          ] as const
                        ).map((key) => (
                          <Input
                            key={key}
                            className={key === "location_source_url" ? "sm:col-span-2" : undefined}
                            placeholder={key.replaceAll("_", " ")}
                            value={editingContact[key]}
                            onChange={(event) =>
                              setEditingContact((current) =>
                                current ? { ...current, [key]: event.target.value } : current,
                              )
                            }
                          />
                        ))}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          disabled={updateContact.isPending}
                          onClick={() => updateContact.mutate()}
                        >
                          {updateContact.isPending ? "Saving…" : "Save contact"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingContact(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={person.id}
                      className="flex items-start justify-between gap-3 rounded-xl border p-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {[person.first_name, person.last_name].filter(Boolean).join(" ") ||
                            person.email ||
                            "Unnamed contact"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[person.job_title, person.email, person.phone || person.raw_phone]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {person.location || "Location not supplied"}
                          {person.location_is_inferred ? " · based on company location" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Edit contact"
                          onClick={() =>
                            setEditingContact({
                              id: person.id,
                              first_name: person.first_name || "",
                              last_name: person.last_name || "",
                              email: person.email || "",
                              phone: person.phone || person.raw_phone || "",
                              job_title: person.job_title || "",
                              location: person.location || "",
                              location_source_url: person.location_source_url || "",
                            })
                          }
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmAction
                          title="Delete contact person?"
                          description="This removes the contact from this client."
                          onConfirm={() => removeContact(person.id)}
                          trigger={
                            <Button size="icon" variant="ghost" aria-label="Delete contact">
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ),
                )}
                {!contacts.length ? (
                  <p className="text-sm text-muted-foreground">No contact people yet.</p>
                ) : null}
              </div>
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
