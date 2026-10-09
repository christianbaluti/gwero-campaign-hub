import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  deleteOrganizationLocation,
  listOrganizationLocations,
  saveOrganizationLocation,
  type LocationOwnerType,
  type OrganizationLocation,
} from "@/lib/locations.functions";

const emptyLocation = {
  name: "",
  addressLine: "",
  city: "",
  region: "",
  country: "Malawi",
  sourceUrl: "",
  isPrimary: false,
};

function displayLocation(location: OrganizationLocation) {
  return [location.address_line, location.city, location.region, location.country]
    .filter(Boolean)
    .join(", ");
}

export function OrganizationLocations({
  entityType,
  entityId,
  title = "Company locations",
}: {
  entityType: LocationOwnerType;
  entityId: string;
  title?: string;
}) {
  const queryClient = useQueryClient();
  const listLocations = useServerFn(listOrganizationLocations);
  const saveLocation = useServerFn(saveOrganizationLocation);
  const removeLocation = useServerFn(deleteOrganizationLocation);
  const queryKey = ["organization-locations", entityType, entityId];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyLocation);
  const { data: locations = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => listLocations({ data: { entityType, entityId } }),
  });

  const reset = () => {
    setEditingId(null);
    setFormOpen(false);
    setForm(emptyLocation);
  };
  const edit = (location: OrganizationLocation) => {
    setEditingId(location.id);
    setFormOpen(true);
    setForm({
      name: location.name,
      addressLine: location.address_line || "",
      city: location.city || "",
      region: location.region || "",
      country: location.country || "",
      sourceUrl: location.source_url || "",
      isPrimary: location.is_primary,
    });
  };

  const save = useMutation({
    mutationFn: () =>
      saveLocation({
        data: {
          entityType,
          entityId,
          ...(editingId ? { locationId: editingId } : {}),
          ...form,
        },
      }),
    onSuccess: async () => {
      toast.success(editingId ? "Location updated." : "Location added.");
      reset();
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (locationId: string) =>
      removeLocation({ data: { entityType, entityId, locationId } }),
    onSuccess: async () => {
      toast.success("Location deleted.");
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Keep every office, branch or operating location on one organisation record.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (formOpen) reset();
            else setFormOpen(true);
          }}
        >
          <Plus className="size-4" /> {formOpen ? "Cancel" : "Add location"}
        </Button>
      </div>

      {formOpen ? (
        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Location name"
              placeholder="Head office, Blantyre branch…"
              value={form.name}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
            />
            <Field
              label="City / town"
              value={form.city}
              onChange={(city) => setForm((current) => ({ ...current, city }))}
            />
            <Field
              label="Region / state"
              value={form.region}
              onChange={(region) => setForm((current) => ({ ...current, region }))}
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(country) => setForm((current) => ({ ...current, country }))}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Street address or landmark</Label>
              <Input
                value={form.addressLine}
                onChange={(event) =>
                  setForm((current) => ({ ...current, addressLine: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Verification source URL</Label>
              <Input
                type="url"
                placeholder="Official contact page or professional profile"
                value={form.sourceUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sourceUrl: event.target.value }))
                }
              />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-3 text-sm">
            <Switch
              checked={form.isPrimary}
              onCheckedChange={(isPrimary) => setForm((current) => ({ ...current, isPrimary }))}
            />
            Primary location
          </label>
          <Button className="mt-4" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : editingId ? "Save location" : "Add location"}
          </Button>
        </div>
      ) : null}

      <div className="space-y-2">
        {locations.map((location) => (
          <div key={location.id} className="flex min-w-0 items-start gap-3 rounded-xl border p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{location.name}</p>
                {location.is_primary ? (
                  <Badge variant="secondary">
                    <Star className="mr-1 size-3" /> Primary
                  </Badge>
                ) : null}
              </div>
              <p className="break-words text-sm text-muted-foreground">
                {displayLocation(location) || "Address details not supplied"}
              </p>
              {location.source_url ? (
                <a
                  href={location.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Verification source <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                size="icon"
                variant="ghost"
                aria-label="Edit location"
                onClick={() => edit(location)}
              >
                <Pencil className="size-4" />
              </Button>
              <ConfirmAction
                title="Delete this location?"
                description="This removes the office or branch from the organisation record."
                onConfirm={() => remove.mutateAsync(location.id)}
                trigger={
                  <Button size="icon" variant="ghost" aria-label="Delete location">
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </div>
        ))}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading locations…</p> : null}
        {!isLoading && !locations.length ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            No company locations have been added yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
