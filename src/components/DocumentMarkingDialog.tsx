import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, FileSignature, LoaderCircle, MousePointer2, Stamp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyDocumentMark, getDocumentMarkWorkspace } from "@/lib/document-marks.functions";
import { renderStampDataUrl } from "@/lib/document-mark-renderer";
import type { DocumentMark } from "@/lib/document-marks.types";

export type MarkingSource = { path: string; name: string };
export type MarkingResult = { path: string; name: string; type: string; size: number };

function attachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}

function today() {
  const value = new Date();
  const offset = value.getTimezoneOffset();
  return new Date(value.valueOf() - offset * 60_000).toISOString().slice(0, 10);
}

export function DocumentMarkingDialog({
  source,
  onOpenChange,
  onApplied,
}: {
  source: MarkingSource | null;
  onOpenChange: (open: boolean) => void;
  onApplied?: (output: MarkingResult) => void;
}) {
  const queryClient = useQueryClient();
  const [markId, setMarkId] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageRatio, setPageRatio] = useState(1.414);
  const [xRatio, setXRatio] = useState(0.75);
  const [yRatio, setYRatio] = useState(0.82);
  const [widthRatio, setWidthRatio] = useState(0.24);
  const [rotation, setRotation] = useState(0);
  const [appliedDate, setAppliedDate] = useState(today());
  const [reading, setReading] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["document-mark-workspace"],
    queryFn: () => getDocumentMarkWorkspace(),
    enabled: Boolean(source),
  });
  const marks = useMemo(() => data?.marks || [], [data?.marks]);
  const mark = marks.find((item) => item.id === markId) || null;

  useEffect(() => {
    if (!source) return;
    setPageNumber(1);
    setXRatio(0.75);
    setYRatio(0.82);
    setWidthRatio(0.24);
    setRotation(0);
    setAppliedDate(today());
  }, [source]);

  useEffect(() => {
    if (!markId && marks[0]) setMarkId(marks[0].id);
    if (markId && marks.length && !marks.some((item) => item.id === markId))
      setMarkId(marks[0]!.id);
  }, [markId, marks]);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setReading(true);
    void (async () => {
      try {
        const response = await fetch(`${attachmentUrl(source.path)}?inline=1`);
        if (!response.ok) throw new Error("The PDF could not be opened.");
        const { PDFDocument } = await import("pdf-lib");
        const pdf = await PDFDocument.load(await response.arrayBuffer(), {
          ignoreEncryption: true,
        });
        if (cancelled) return;
        setPageCount(pdf.getPageCount());
        const page = pdf.getPage(Math.max(0, Math.min(pdf.getPageCount() - 1, pageNumber - 1)));
        setPageRatio(page.getHeight() / page.getWidth());
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "The PDF could not be opened.");
      } finally {
        if (!cancelled) setReading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageNumber, source]);

  const previewUrl = useMemo(() => {
    if (!mark) return "";
    if (mark.type === "signature") return `${attachmentUrl(mark.imagePath)}?inline=1`;
    return mark.design ? renderStampDataUrl(mark.design, appliedDate, 0.7) : "";
  }, [appliedDate, mark]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!source || !mark) throw new Error("Choose a stamp or signature first.");
      return applyDocumentMark({
        data: {
          sourcePath: source.path,
          markId: mark.id,
          pageNumber,
          xRatio,
          yRatio,
          widthRatio,
          rotation,
          appliedDate,
          ...(mark.type === "stamp" && mark.design
            ? { stampPng: renderStampDataUrl(mark.design, appliedDate, 2) }
            : {}),
        },
      });
    },
    onSuccess: (result) => {
      toast.success(
        `${mark?.type === "signature" ? "Signature" : "Stamp"} applied. The original document is unchanged.`,
      );
      void queryClient.invalidateQueries({ queryKey: ["document-mark-workspace"] });
      void queryClient.invalidateQueries({ queryKey: ["document-workspace"] });
      onApplied?.(result.output);
      onOpenChange(false);
    },
    onError: (cause) =>
      toast.error(cause instanceof Error ? cause.message : "The document could not be updated."),
  });

  const place = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setXRatio(Math.max(0.02, Math.min(0.98, (event.clientX - bounds.left) / bounds.width)));
    setYRatio(Math.max(0.02, Math.min(0.98, (event.clientY - bounds.top) / bounds.height)));
  };

  return (
    <Dialog open={Boolean(source)} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[94vh] w-[96vw] max-w-7xl grid-rows-none flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="size-5 text-violet-700" /> Stamp or sign document
          </DialogTitle>
          <DialogDescription className="truncate">
            {source?.name} · the result is saved as a new protected PDF
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-h-[42vh] border-b bg-slate-200 lg:border-b-0 lg:border-r">
            {source ? (
              <iframe
                title="PDF page preview"
                src={`${attachmentUrl(source.path)}?inline=1#page=${pageNumber}&toolbar=0&view=Fit`}
                className="h-full min-h-[42vh] w-full"
              />
            ) : null}
          </div>
          <div className="gwero-scrollbar overflow-y-auto p-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Stamp or signature</Label>
                <Select value={markId} onValueChange={setMarkId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from your library" />
                  </SelectTrigger>
                  <SelectContent>
                    {marks.map((item: DocumentMark) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.type === "stamp" ? "Stamp" : "Signature"} · {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isLoading && !marks.length ? (
                  <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    Create a stamp or signature in the Stamps & signatures section first.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="mark-page">Page</Label>
                  <Input
                    id="mark-page"
                    type="number"
                    min={1}
                    max={pageCount}
                    value={pageNumber}
                    onChange={(event) =>
                      setPageNumber(
                        Math.max(1, Math.min(pageCount, Number(event.target.value) || 1)),
                      )
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">of {pageCount} pages</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mark-date">Date to show</Label>
                  <Input
                    id="mark-date"
                    type="date"
                    value={appliedDate}
                    onChange={(event) => setAppliedDate(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Position on page {pageNumber}</Label>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MousePointer2 className="size-3" /> click to place
                  </span>
                </div>
                <div className="rounded-xl bg-slate-100 p-3">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Choose stamp position"
                    className="relative mx-auto w-full max-w-[245px] cursor-crosshair overflow-hidden border bg-white shadow-sm"
                    style={{ aspectRatio: `1 / ${pageRatio}` }}
                    onPointerDown={place}
                    onPointerMove={(event) => event.buttons === 1 && place(event)}
                  >
                    <div className="absolute inset-x-4 top-5 space-y-2 opacity-20">
                      {Array.from({ length: 12 }).map((_, index) => (
                        <div
                          key={index}
                          className="h-1 rounded bg-slate-400"
                          style={{ width: `${65 + (index % 4) * 8}%` }}
                        />
                      ))}
                    </div>
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Selected mark"
                        draggable={false}
                        className="pointer-events-none absolute h-auto select-none object-contain"
                        style={{
                          left: `${xRatio * 100}%`,
                          top: `${yRatio * 100}%`,
                          width: `${widthRatio * 100}%`,
                          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                          opacity: mark?.type === "stamp" ? 0.86 : 0.96,
                        }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-xl border p-4">
                <div>
                  <div className="flex justify-between text-xs">
                    <Label>Size</Label>
                    <span>{Math.round(widthRatio * 100)}%</span>
                  </div>
                  <input
                    className="mt-2 w-full accent-violet-700"
                    type="range"
                    min="8"
                    max="55"
                    value={Math.round(widthRatio * 100)}
                    onChange={(event) => setWidthRatio(Number(event.target.value) / 100)}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs">
                    <Label>Rotation</Label>
                    <span>{rotation}°</span>
                  </div>
                  <input
                    className="mt-2 w-full accent-violet-700"
                    type="range"
                    min="-20"
                    max="20"
                    value={rotation}
                    onChange={(event) => setRotation(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="border-t px-5 py-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {reading
              ? "Reading PDF pages…"
              : "Placement is recorded in the document audit history."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!mark || reading || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : mark?.type === "signature" ? (
                <Check className="mr-2 size-4" />
              ) : (
                <Stamp className="mr-2 size-4" />
              )}
              {mark?.type === "signature" ? "Apply signature" : "Apply stamp"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
