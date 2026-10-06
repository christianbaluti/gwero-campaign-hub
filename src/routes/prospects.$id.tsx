import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Building2, Globe2, Linkedin, Mail, Pencil, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/contact-normalization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/prospects/$id")({ component: ProspectDetailRoute });

function fileDataUrl(file: File, done: (value: string) => void) {
  if (!file.type.startsWith("image/")) {
    toast.error("Choose an image file.");
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Use an image smaller than 2 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => done(String(reader.result || ""));
  reader.readAsDataURL(file);
}

function ProspectDetailRoute() {
  const location = useLocation();
  const { id } = Route.useParams();
  return location.pathname !== `/prospects/${id}` && location.pathname !== `/prospects/${id}/` ? (
    <Outlet />
  ) : (
    <ProspectDetail />
  );
}

function ProspectDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState({
    company: "",
    email: "",
    phone: "",
    website: "",
    linkedin_url: "",
    notes: "",
    logo_path: "",
  });
  const [newContact, setNewContact] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    job_title: "",
  });
  const { data: prospect, isLoading } = useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => {
      const result = await db.from("prospects").select("*").eq("id", id).maybeSingle();
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const { data: contacts = [] } = useQuery({
    queryKey: ["prospect-contacts", id],
    queryFn: async () => {
      const result = await db
        .from("prospect_contacts")
        .select("*")
        .eq("prospect_id", id)
        .order("is_primary", { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const { data: interactions = [] } = useQuery({
    queryKey: ["prospect-interactions", id],
    queryFn: async () => {
      const result = await db
        .from("prospect_interactions")
        .select("*")
        .eq("prospect_id", id)
        .order("occurred_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },
  });
  const { data: replies = [] } = useQuery({
    queryKey: ["prospect-replies", id],
    queryFn: async () => {
      const result = await db
        .from("replies")
        .select("*")
        .eq("prospect_id", id)
        .order("received_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data;
    },
  });
  useEffect(() => {
    if (prospect) {
      setProfile({
        company: prospect.company || "",
        email: prospect.email.includes("@prospect.local") ? "" : prospect.email,
        phone: prospect.phone || "",
        website: prospect.website || "",
        linkedin_url: prospect.linkedin_url || "",
        notes: prospect.notes || "",
        logo_path: prospect.logo_path || "",
      });
      setEditingProfile(false);
    }
  }, [prospect]);
  if (isLoading)
    return (
      <AppShell title="Prospect">
        <p>Loading prospect…</p>
      </AppShell>
    );
  if (!prospect)
    return (
      <AppShell title="Prospect not found">
        <Button asChild>
          <Link to="/prospects">Back to prospects</Link>
        </Button>
      </AppShell>
    );

  const saveProfile = async () => {
    const email = profile.email.trim().toLowerCase() || prospect.email;
    const result = await db
      .from("prospects")
      .update({
        ...profile,
        email,
        phone: normalizePhone(profile.phone) || null,
        company: profile.company.trim() || null,
        website: profile.website.trim() || null,
        linkedin_url: profile.linkedin_url.trim() || null,
        notes: profile.notes.trim() || null,
        logo_path: profile.logo_path || null,
      })
      .eq("id", id);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Prospect details saved.");
    setEditingProfile(false);
    void qc.invalidateQueries({ queryKey: ["prospect", id] });
    void qc.invalidateQueries({ queryKey: ["prospects"] });
  };
  const saveContact = async (
    contactId: string,
    values: typeof newContact & { avatar_url?: string },
  ) => {
    const result = await db
      .from("prospect_contacts")
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        email: values.email.trim().toLowerCase() || null,
        phone: normalizePhone(values.phone) || null,
        raw_phone: values.phone || null,
        job_title: values.job_title || null,
        avatar_url: values.avatar_url || null,
      })
      .eq("id", contactId);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    toast.success("Contact details saved.");
    void qc.invalidateQueries({ queryKey: ["prospect-contacts", id] });
  };
  const addContact = async () => {
    if (
      ![newContact.first_name, newContact.last_name, newContact.email].some((value) => value.trim())
    ) {
      toast.error("Add a contact name or email address.");
      return;
    }
    const result = await db.from("prospect_contacts").insert({
      prospect_id: id,
      ...newContact,
      email: newContact.email.trim().toLowerCase() || null,
      phone: normalizePhone(newContact.phone) || null,
      raw_phone: newContact.phone || null,
      is_primary: contacts.length === 0,
    });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    setNewContact({ first_name: "", last_name: "", email: "", phone: "", job_title: "" });
    toast.success("Contact person added.");
    void qc.invalidateQueries({ queryKey: ["prospect-contacts", id] });
  };
  const timeline = [
    ...interactions.map((item) => ({
      id: item.id,
      date: item.occurred_at,
      subject: item.subject,
      body: item.body,
      direction: item.direction,
      contact_id: item.contact_id,
    })),
    ...replies.map((item) => ({
      id: item.id,
      date: item.received_at,
      subject: item.subject,
      body: item.body || item.snippet || "",
      direction: "inbound",
      contact_id: item.contact_id,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppShell
      title={prospect.company || prospect.email}
      description={`${contacts.length} contact person${contacts.length === 1 ? "" : "s"}`}
      actions={
        <>
          {!editingProfile ? (
            <Button onClick={() => setEditingProfile(true)}>
              <Pencil className="size-4" /> Edit details
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/prospects">Back to prospects</Link>
          </Button>
        </>
      }
    >
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <Card className="min-w-0 self-start">
          <CardHeader>
            <CardTitle>Prospect profile</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4">
            {!editingProfile ? (
              <>
                <div className="rounded-xl border bg-muted/20 p-4">
                  {prospect.logo_path ? (
                    <img
                      src={prospect.logo_path}
                      alt={`${prospect.company || "Prospect"} logo`}
                      className="h-28 w-full object-contain"
                    />
                  ) : (
                    <div className="grid h-28 place-items-center text-sm text-muted-foreground">
                      <Building2 className="mb-2 size-8" /> No company logo
                    </div>
                  )}
                </div>
                <dl className="space-y-4 text-sm">
                  <ProfileDetail
                    icon={Building2}
                    label="Company"
                    value={prospect.company || "Not supplied"}
                  />
                  <ProfileDetail
                    icon={Mail}
                    label="Company email"
                    value={
                      prospect.email.includes("@prospect.local") ? "Not supplied" : prospect.email
                    }
                    href={
                      prospect.email.includes("@prospect.local")
                        ? undefined
                        : `mailto:${prospect.email}`
                    }
                  />
                  <ProfileDetail
                    icon={Phone}
                    label="Phone"
                    value={prospect.phone || "Not supplied"}
                    href={prospect.phone ? `tel:${prospect.phone}` : undefined}
                  />
                  <ProfileDetail
                    icon={Globe2}
                    label="Website"
                    value={prospect.website || "Not supplied"}
                    href={prospect.website || undefined}
                  />
                  <ProfileDetail
                    icon={Linkedin}
                    label="LinkedIn"
                    value={prospect.linkedin_url || "Not supplied"}
                    href={prospect.linkedin_url || undefined}
                  />
                </dl>
                {prospect.notes ? (
                  <div className="rounded-xl bg-muted/50 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{prospect.notes}</p>
                  </div>
                ) : null}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setEditingProfile(true)}
                >
                  <Pencil className="size-4" /> Edit prospect details
                </Button>
              </>
            ) : (
              <>
                <div className="rounded-xl border bg-muted/20 p-4">
                  {profile.logo_path ? (
                    <img
                      src={profile.logo_path}
                      alt={`${profile.company || "Prospect"} logo`}
                      className="h-24 w-full object-contain"
                    />
                  ) : (
                    <div className="grid h-24 place-items-center text-sm text-muted-foreground">
                      No company logo
                    </div>
                  )}
                  <Label
                    htmlFor="prospect-logo"
                    className="mt-3 inline-block cursor-pointer text-sm font-medium text-primary hover:underline"
                  >
                    Upload or replace logo
                  </Label>
                  <input
                    id="prospect-logo"
                    className="absolute size-px overflow-hidden opacity-0"
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file)
                        fileDataUrl(file, (logo_path) =>
                          setProfile((old) => ({ ...old, logo_path })),
                        );
                    }}
                  />
                </div>
                {(["company", "email", "phone", "website", "linkedin_url"] as const).map((key) => (
                  <div key={key} className="min-w-0 space-y-1.5">
                    <Label htmlFor={`prospect-${key}`}>
                      {key === "linkedin_url"
                        ? "LinkedIn URL"
                        : key.charAt(0).toUpperCase() + key.slice(1)}
                    </Label>
                    <Input
                      className="min-w-0"
                      id={`prospect-${key}`}
                      value={profile[key]}
                      onChange={(event) =>
                        setProfile((old) => ({ ...old, [key]: event.target.value }))
                      }
                    />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label htmlFor="prospect-notes">Notes</Label>
                  <Textarea
                    id="prospect-notes"
                    value={profile.notes}
                    onChange={(event) =>
                      setProfile((old) => ({ ...old, notes: event.target.value }))
                    }
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void saveProfile()}>Save changes</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setProfile({
                        company: prospect.company || "",
                        email: prospect.email.includes("@prospect.local") ? "" : prospect.email,
                        phone: prospect.phone || "",
                        website: prospect.website || "",
                        linkedin_url: prospect.linkedin_url || "",
                        notes: prospect.notes || "",
                        logo_path: prospect.logo_path || "",
                      });
                      setEditingProfile(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Contact people</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((person) => (
                <ContactEditor
                  key={person.id}
                  person={person}
                  prospectId={id}
                  onSave={(values) => saveContact(person.id, values)}
                />
              ))}
              <div className="rounded-xl border border-dashed p-4">
                <p className="mb-3 font-medium">Add another contact</p>
                <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                  {(["first_name", "last_name", "email", "phone", "job_title"] as const).map(
                    (key) => (
                      <Input
                        key={key}
                        placeholder={key.replace("_", " ")}
                        value={newContact[key]}
                        onChange={(event) =>
                          setNewContact((old) => ({ ...old, [key]: event.target.value }))
                        }
                      />
                    ),
                  )}
                </div>
                <Button className="mt-3" variant="outline" onClick={() => void addContact()}>
                  Add contact person
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Conversation history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.map((item) => {
                const person = contacts.find((contact) => contact.id === item.contact_id);
                return (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.direction === "inbound" ? "default" : "secondary"}>
                          {item.direction}
                        </Badge>
                        {person ? (
                          <Link
                            to="/prospects/$id/contacts/$contactId"
                            params={{ id, contactId: person.id }}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {[person.first_name, person.last_name].filter(Boolean).join(" ") ||
                              person.email}
                          </Link>
                        ) : null}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleString()}
                      </time>
                    </div>
                    {item.subject ? <p className="mt-3 font-medium">{item.subject}</p> : null}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.body}
                    </p>
                  </div>
                );
              })}
              {!timeline.length ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No email conversations have been recorded yet.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function ProfileDetail({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  href?: string | undefined;
}) {
  const external = Boolean(href?.startsWith("http"));
  return (
    <div className="flex min-w-0 gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 min-w-0 break-words font-medium">
          {href ? (
            <a
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noreferrer" : undefined}
              className="break-all text-primary hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )}
        </dd>
      </div>
    </div>
  );
}

function ContactEditor({
  person,
  prospectId,
  onSave,
}: {
  person: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    avatar_url: string | null;
  };
  prospectId: string;
  onSave: (values: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    job_title: string;
    avatar_url?: string;
  }) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({
    first_name: person.first_name || "",
    last_name: person.last_name || "",
    email: person.email || "",
    phone: person.phone || "",
    job_title: person.job_title || "",
    avatar_url: person.avatar_url || "",
  });
  const name =
    [values.first_name, values.last_name].filter(Boolean).join(" ") || values.email || "Contact";
  const initials =
    [values.first_name, values.last_name]
      .filter(Boolean)
      .map((value) => value.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";
  if (!editing)
    return (
      <div className="flex items-center gap-3 rounded-xl border p-3">
        <Avatar className="size-11">
          <AvatarImage src={values.avatar_url || undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <Link
            to="/prospects/$id/contacts/$contactId"
            params={{ id: prospectId, contactId: person.id }}
            className="font-medium text-primary hover:underline"
          >
            {name}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {values.job_title || "Position not set"}
            {values.email ? ` · ${values.email}` : ""}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
      </div>
    );
  return (
    <div className="rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(["first_name", "last_name", "email", "phone", "job_title"] as const).map((key) => (
          <div key={key}>
            <Label className="text-xs">{key.replace("_", " ")}</Label>
            <Input
              className="mt-1"
              value={values[key]}
              onChange={(event) => setValues((old) => ({ ...old, [key]: event.target.value }))}
            />
          </div>
        ))}
        <div>
          <Label htmlFor={`avatar-${person.id}`} className="text-xs">
            Profile image
          </Label>
          <Input
            id={`avatar-${person.id}`}
            className="mt-1"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file)
                fileDataUrl(file, (avatar_url) => setValues((old) => ({ ...old, avatar_url })));
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await onSave(values);
            setEditing(false);
          }}
        >
          Save contact
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
