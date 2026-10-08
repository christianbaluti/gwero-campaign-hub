import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useLocation } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRing,
  Edit3,
  GripHorizontal,
  Maximize2,
  Pin,
  PinOff,
  Plus,
  StickyNote,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createStickyNote,
  deleteStickyNote,
  getStickyNotes,
  getStickyNoteUsers,
  updateStickyNote,
  updateStickyNoteLayout,
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

type NoteLayout = {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  isOpen: boolean;
  isPinned: boolean;
};

function noteLayout(note: StickyNoteRecord): NoteLayout {
  return {
    positionX: note.position_x,
    positionY: note.position_y,
    width: note.width,
    height: note.height,
    zIndex: note.z_index,
    isOpen: note.is_open,
    isPinned: note.is_pinned,
  };
}

function LiveStickyNote({
  note,
  highestZ,
  focused,
  onEdit,
  onDelete,
  onLayoutChange,
}: {
  note: StickyNoteRecord;
  highestZ: number;
  focused: boolean;
  onEdit: () => void;
  onDelete: () => Promise<unknown>;
  onLayoutChange: (layout: Partial<NoteLayout>) => void;
}) {
  const [layout, setLayout] = useState(() => noteLayout(note));
  const [viewport, setViewport] = useState({ width: 1920, height: 1080 });
  const layoutRef = useRef(layout);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interaction = useRef<{
    kind: "move" | "resize";
    pointerId: number;
    startX: number;
    startY: number;
    layout: NoteLayout;
  } | null>(null);

  useEffect(() => {
    if (interaction.current) return;
    const next = noteLayout(note);
    layoutRef.current = next;
    setLayout(next);
  }, [note]);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const minLeft = viewport.width >= 768 ? 264 : 8;
  const displayWidth = Math.max(210, Math.min(layout.width, viewport.width - minLeft - 8));
  const displayHeight = Math.max(180, Math.min(layout.height, viewport.height - 92));
  const displayX = Math.max(minLeft, Math.min(viewport.width - displayWidth - 8, layout.positionX));
  const displayY = Math.max(84, Math.min(viewport.height - 64, layout.positionY));

  const persist = (next: NoteLayout, immediate = false) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (immediate) {
      onLayoutChange(next);
      return;
    }
    saveTimer.current = setTimeout(() => onLayoutChange(next), 300);
  };

  const applyLayout = (next: NoteLayout, immediate = false) => {
    layoutRef.current = next;
    setLayout(next);
    persist(next, immediate);
  };

  const begin = (kind: "move" | "resize", event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const raised = {
      ...layoutRef.current,
      positionX: displayX,
      positionY: displayY,
      width: displayWidth,
      height: displayHeight,
      zIndex: Math.max(highestZ + 1, layoutRef.current.zIndex),
    };
    layoutRef.current = raised;
    setLayout(raised);
    interaction.current = {
      kind,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      layout: raised,
    };
  };

  const move = (event: PointerEvent<HTMLElement>) => {
    const active = interaction.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const dx = event.clientX - active.startX;
    const dy = event.clientY - active.startY;
    const minLeft = window.innerWidth >= 768 ? 264 : 8;
    let next: NoteLayout;
    if (active.kind === "move") {
      next = {
        ...active.layout,
        positionX: Math.max(
          minLeft,
          Math.min(window.innerWidth - active.layout.width - 8, active.layout.positionX + dx),
        ),
        positionY: Math.max(84, Math.min(window.innerHeight - 64, active.layout.positionY + dy)),
      };
    } else {
      next = {
        ...active.layout,
        width: Math.max(210, Math.min(700, active.layout.width + dx)),
        height: Math.max(180, Math.min(700, active.layout.height + dy)),
      };
    }
    applyLayout(next);
  };

  const finish = (event: PointerEvent<HTMLElement>) => {
    if (!interaction.current || interaction.current.pointerId !== event.pointerId) return;
    interaction.current = null;
    applyLayout(layoutRef.current, true);
  };

  const fontSize = Math.max(12, Math.min(22, Math.min(displayWidth / 17, displayHeight / 13)));
  const tilt = ((note.id.charCodeAt(0) % 5) - 2) * 0.35;

  return (
    <article
      aria-label={note.title || "Sticky note"}
      className={`pointer-events-auto absolute flex touch-none select-none flex-col overflow-hidden border shadow-[0_14px_35px_rgba(15,23,42,.22)] ${colours[note.color as Colour] || colours.yellow} ${focused ? "ring-4 ring-primary/50" : ""}`}
      style={{
        left: displayX,
        top: displayY,
        width: displayWidth,
        height: displayHeight,
        zIndex: layout.zIndex,
        transform: `rotate(${tilt}deg)`,
        fontSize,
        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%)",
      }}
    >
      <header
        className="flex cursor-grab items-center gap-1 border-b border-black/10 px-2 py-1.5 active:cursor-grabbing"
        onPointerDown={(event) => begin("move", event)}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <GripHorizontal className="size-[1em] shrink-0 opacity-50" />
        <strong className="min-w-0 flex-1 truncate leading-tight">
          {note.title || "Sticky note"}
        </strong>
        {note.can_edit ? (
          <button
            type="button"
            className="rounded p-1 hover:bg-black/10"
            aria-label="Edit sticky note"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={onEdit}
          >
            <Edit3 className="size-[.9em]" />
          </button>
        ) : null}
        {note.can_edit ? (
          <ConfirmAction
            title="Delete this sticky note?"
            description="It will be permanently removed for everyone who can view this page."
            onConfirm={onDelete}
            trigger={
              <button
                type="button"
                className="rounded p-1 text-rose-800 hover:bg-black/10"
                aria-label="Delete sticky note"
                onPointerDown={(event) => event.stopPropagation()}
              >
                <Trash2 className="size-[.9em]" />
              </button>
            }
          />
        ) : null}
        <button
          type="button"
          className="rounded p-1 hover:bg-black/10"
          aria-label="Close sticky note"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => applyLayout({ ...layoutRef.current, isOpen: false }, true)}
        >
          <X className="size-[.95em]" />
        </button>
      </header>
      <div className="gwero-scrollbar min-h-0 flex-1 overflow-auto px-[1em] py-[.8em]">
        <p className="whitespace-pre-wrap font-medium leading-[1.45]">{note.body}</p>
        {note.mentions.length ? (
          <p className="mt-[.8em] text-[.72em] opacity-70">
            {note.mentions.map((mention) => `@${mention.full_name}`).join("  ")}
          </p>
        ) : null}
      </div>
      <p className="px-[1em] pb-[.7em] text-[.62em] opacity-55">{note.created_by_name}</p>
      <div className="absolute bottom-0 right-0 size-[18px] border-l border-t border-black/10 bg-white/35" />
      <button
        type="button"
        aria-label="Resize sticky note"
        className="absolute bottom-0 right-0 grid size-8 cursor-nwse-resize place-items-end p-1"
        onPointerDown={(event) => begin("resize", event)}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        <Maximize2 className="size-3 rotate-90 opacity-55" />
      </button>
    </article>
  );
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
    refetchInterval: 3_000,
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
        const result = await updateStickyNote({
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
        return { id: editing, email: result.email };
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
    onSuccess: async (result) => {
      const emailed = result.email?.sent || 0;
      const failed = result.email?.failed || 0;
      const skipped = result.email?.skipped;
      if (emailed) {
        toast.success(
          `${editing ? "Sticky note updated" : "Sticky note added"}. Email sent to ${emailed} tagged ${emailed === 1 ? "user" : "users"}.`,
        );
      } else if (failed || skipped) {
        toast.warning(
          `${editing ? "Sticky note updated" : "Sticky note added"}. Mention email is queued for automatic retry.`,
        );
      } else {
        toast.success(editing ? "Sticky note updated." : "Sticky note added to this page.");
      }
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
  const changeLayout = useCallback(
    (noteId: string, patch: Partial<NoteLayout>) => {
      qc.setQueryData<StickyNoteRecord[]>(queryKey, (current = []) =>
        current.map((note) =>
          note.id === noteId
            ? {
                ...note,
                position_x: patch.positionX ?? note.position_x,
                position_y: patch.positionY ?? note.position_y,
                width: patch.width ?? note.width,
                height: patch.height ?? note.height,
                z_index: patch.zIndex ?? note.z_index,
                is_open: patch.isOpen ?? note.is_open,
                is_pinned: patch.isPinned ?? note.is_pinned,
              }
            : note,
        ),
      );
      void updateStickyNoteLayout({
        data: {
          noteId,
          ...(patch.positionX === undefined ? {} : { positionX: patch.positionX }),
          ...(patch.positionY === undefined ? {} : { positionY: patch.positionY }),
          ...(patch.width === undefined ? {} : { width: patch.width }),
          ...(patch.height === undefined ? {} : { height: patch.height }),
          ...(patch.zIndex === undefined ? {} : { zIndex: patch.zIndex }),
          ...(patch.isOpen === undefined ? {} : { isOpen: patch.isOpen }),
          ...(patch.isPinned === undefined ? {} : { isPinned: patch.isPinned }),
        },
      }).catch((error: Error) => {
        toast.error(error.message);
        void qc.invalidateQueries({ queryKey });
      });
    },
    [qc, queryKey],
  );
  const visibleNotes = notes.filter((note) => note.is_pinned && note.is_open);
  const highestZ = Math.max(0, ...notes.map((note) => note.z_index));

  useEffect(() => {
    const noteId = new URLSearchParams(location.searchStr).get("note");
    if (!noteId) return;
    const note = notes.find((item) => item.id === noteId);
    if (note && (!note.is_open || !note.is_pinned))
      changeLayout(note.id, { isOpen: true, isPinned: true, zIndex: highestZ + 1 });
  }, [changeLayout, highestZ, location.searchStr, notes]);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40">
        {visibleNotes.map((note) => (
          <LiveStickyNote
            key={note.id}
            note={note}
            highestZ={highestZ}
            focused={focused === note.id}
            onEdit={() => edit(note)}
            onDelete={() => remove.mutateAsync(note.id)}
            onLayoutChange={(layout) => changeLayout(note.id, layout)}
          />
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
              Shared notes stay where your team leaves them on this page. Mentioned users receive an
              in-app notification and an immediate email with a link back to this note.
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
                    <div className="mt-4 flex flex-wrap justify-end gap-1 border-t border-black/10 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          changeLayout(note.id, {
                            isOpen: !(note.is_open && note.is_pinned),
                            isPinned: true,
                            zIndex: highestZ + 1,
                          })
                        }
                      >
                        {note.is_open && note.is_pinned ? (
                          <>
                            <X className="mr-1 size-3.5" /> Close
                          </>
                        ) : (
                          <>
                            <Pin className="mr-1 size-3.5" /> Show on page
                          </>
                        )}
                      </Button>
                      {note.can_edit ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => edit(note)}
                          >
                            <Edit3 className="mr-1 size-3.5" /> Edit
                          </Button>
                          <ConfirmAction
                            title="Delete this sticky note?"
                            description="It will be removed for everyone who can view this page."
                            onConfirm={() => remove.mutateAsync(note.id)}
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
                        </>
                      ) : null}
                    </div>
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
                      Pinned notes appear as movable notes directly on this page.
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
