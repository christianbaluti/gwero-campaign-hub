import { useEffect, useMemo, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Edit3, Pin, PinOff, Plus, StickyNote, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createStickyNote,
  deleteStickyNote,
  getStickyNotes,
  getStickyNoteUsers,
  updateStickyNote,
  type StickyNote as StickyNoteRecord,
} from "@/lib/sticky-notes.functions";
import { ConfirmAction } from "@/components/ConfirmAction";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const colours = {
  yellow: "border-amber-200 bg-amber-100 text-amber-950",
  pink: "border-pink-200 bg-pink-100 text-pink-950",
  blue: "border-sky-200 bg-sky-100 text-sky-950",
  green: "border-emerald-200 bg-emerald-100 text-emerald-950",
  purple: "border-violet-200 bg-violet-100 text-violet-950",
  orange: "border-orange-200 bg-orange-100 text-orange-950",
} as const;

type Colour = keyof typeof colours;
const emptyForm = {
  title: "",
  body: "",
  color: "yellow" as Colour,
  pinned: true,
  mentions: [] as string[],
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function StickyNotes() {
  const location = useLocation();
  const pageKey = location.pathname;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const queryKey = useMemo(() => ["sticky-notes", pageKey], [pageKey]);
  const { data: notes = [] } = useQuery({
    queryKey,
    queryFn: () => getStickyNotes({ data: { pageKey } }),
    refetchInterval: 20_000,
  });
  const { data: users = [] } = useQuery({
    queryKey: ["sticky-note-users"],
    queryFn: () => getStickyNoteUsers(),
    staleTime: 60_000,
  });

  useEffect(() => {
    const noteId = new URLSearchParams(location.searchStr).get("note");
    if (!noteId) return;
    setFocused(noteId);
    setOpen(true);
  }, [location.searchStr]);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
  };
  const edit = (note: StickyNoteRecord) => {
    setEditing(note.id);
    setFocused(note.id);
    setForm({
      title: note.title || "",
      body: note.body,
      color: note.color as Colour,
      pinned: note.is_pinned,
      mentions: note.mentions.map((mention) => mention.id),
    });
    setOpen(true);
  };
  const save = useMutation({
    mutationFn: async () => {
      if (editing) {
        await updateStickyNote({
          data: {
            noteId: editing,
            pageKey,
            title: form.title,
            body: form.body,
            color: form.color,
            pinned: form.pinned,
            mentionIds: form.mentions,
          },
        });
        return { id: editing };
      }
      return createStickyNote({
        data: {
          pageKey,
          title: form.title,
          body: form.body,
          color: form.color,
          pinned: form.pinned,
          mentionIds: form.mentions,
        },
      });
    },
    onSuccess: async () => {
      toast.success(editing ? "Sticky note updated." : "Sticky note added to this page.");
      reset();
      await Promise.all([
        qc.invalidateQueries({ queryKey }),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (noteId: string) => deleteStickyNote({ data: { noteId } }),
    onSuccess: async () => {
      toast.success("Sticky note deleted.");
      reset();
      await qc.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const pinned = notes.filter((note) => note.is_pinned);

  return (
    <>
      <div className="fixed bottom-24 right-4 z-20 hidden max-w-56 space-y-2 xl:block">
        {pinned.slice(0, 4).map((note) => (
          <button
            key={note.id}
            type="button"
            className={`block w-full rotate-[-1deg] rounded-sm border p-3 text-left shadow-lg transition hover:rotate-0 hover:shadow-xl ${colours[note.color as Colour] || colours.yellow}`}
            onClick={() => {
              setFocused(note.id);
              setOpen(true);
            }}
          >
            <span className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="truncate">{note.title || "Sticky note"}</span>
              <Pin className="size-3 shrink-0" />
            </span>
            <span className="mt-1 line-clamp-3 block whitespace-pre-wrap text-xs leading-5">
              {note.body}
            </span>
          </button>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="relative rounded-xl text-slate-500 hover:bg-accent"
        onClick={() => setOpen(true)}
        aria-label={`Sticky notes for this page${notes.length ? `, ${notes.length} notes` : ""}`}
      >
        <StickyNote className="size-5" />
        <span className="hidden xl:inline">Notes</span>
        {notes.length ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-5 text-white">
            {notes.length > 99 ? "99+" : notes.length}
          </span>
        ) : null}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setFocused(null);
            reset();
          }
        }}
      >
        <DialogContent className="flex max-h-[88vh] max-w-5xl flex-col overflow-hidden p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="size-5 text-primary" /> Sticky notes for this page
            </DialogTitle>
            <DialogDescription>
              Shared notes stay with this page. Mentioned users receive an in-app notification and,
              if it remains unread, the configured notification email.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
            <div className="gwero-scrollbar min-h-0 overflow-y-auto border-b p-5 md:border-b-0 md:border-r">
              <div className="grid gap-4 sm:grid-cols-2">
                {notes.map((note) => (
                  <article
                    key={note.id}
                    className={`rounded-sm border p-4 shadow-sm transition ${colours[note.color as Colour] || colours.yellow} ${focused === note.id ? "ring-4 ring-primary/30" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">{note.title || "Sticky note"}</h3>
                        <p className="text-[11px] opacity-70">
                          {note.created_by_name} · {new Date(note.updated_at).toLocaleString()}
                        </p>
                      </div>
                      {note.is_pinned ? (
                        <Pin className="size-4 shrink-0" />
                      ) : (
                        <PinOff className="size-4 shrink-0 opacity-50" />
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{note.body}</p>
                    {note.mentions.length ? (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {note.mentions.map((mention) => (
                          <Badge key={mention.id} variant="secondary" className="bg-white/60">
                            @{mention.full_name}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {note.can_edit ? (
                      <div className="mt-4 flex justify-end gap-1 border-t border-black/10 pt-2">
                        <Button type="button" size="sm" variant="ghost" onClick={() => edit(note)}>
                          <Edit3 className="mr-1 size-3.5" /> Edit
                        </Button>
                        <ConfirmAction
                          title="Delete this sticky note?"
                          description="It will be removed for everyone who can view this page."
                          onConfirm={() => remove.mutate(note.id)}
                          trigger={
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="text-rose-700"
                            >
                              <Trash2 className="mr-1 size-3.5" /> Delete
                            </Button>
                          }
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              {!notes.length ? (
                <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed text-center text-muted-foreground">
                  <div>
                    <StickyNote className="mx-auto mb-3 size-10 opacity-40" />
                    <p className="font-medium">No notes on this page yet</p>
                    <p className="mt-1 text-sm">Create the first shared reminder or team note.</p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="gwero-scrollbar min-h-0 overflow-y-auto bg-slate-50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">
                  {editing ? "Edit sticky note" : "New sticky note"}
                </h3>
                {editing ? (
                  <Button type="button" size="sm" variant="ghost" onClick={reset}>
                    <Plus className="mr-1 size-4" /> New
                  </Button>
                ) : null}
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="sticky-title">Title</Label>
                  <Input
                    id="sticky-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Optional short heading"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sticky-body">Note</Label>
                  <Textarea
                    id="sticky-body"
                    rows={7}
                    value={form.body}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, body: event.target.value }))
                    }
                    placeholder="Write a reminder, decision or request for the team…"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colour</Label>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(colours) as Colour[]).map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`${color} note`}
                        className={`size-8 rounded-full border-2 ${colours[color]} ${form.color === color ? "ring-2 ring-primary ring-offset-2" : ""}`}
                        onClick={() => setForm((current) => ({ ...current, color }))}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border bg-white p-3">
                  <div>
                    <Label>Keep visible on this page</Label>
                    <p className="text-xs text-muted-foreground">
                      Pinned notes appear beside the page.
                    </p>
                  </div>
                  <Switch
                    checked={form.pinned}
                    onCheckedChange={(pinned) => setForm((current) => ({ ...current, pinned }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="size-4" /> Mention users
                  </Label>
                  <div className="gwero-scrollbar max-h-48 space-y-1 overflow-y-auto rounded-xl border bg-white p-2">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted"
                      >
                        <Checkbox
                          checked={form.mentions.includes(user.id)}
                          onCheckedChange={(checked) =>
                            setForm((current) => ({
                              ...current,
                              mentions: checked
                                ? [...current.mentions, user.id]
                                : current.mentions.filter((id) => id !== user.id),
                            }))
                          }
                        />
                        <Avatar className="size-8">
                          <AvatarFallback>{initials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {user.full_name}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {form.mentions.length ? (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <BellRing className="size-3.5" /> {form.mentions.length} user
                      {form.mentions.length === 1 ? "" : "s"} will be notified.
                    </p>
                  ) : null}
                </div>
                <Button
                  className="w-full"
                  disabled={!form.body.trim() || save.isPending}
                  onClick={() => save.mutate()}
                >
                  {save.isPending ? "Saving…" : editing ? "Save changes" : "Add sticky note"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
