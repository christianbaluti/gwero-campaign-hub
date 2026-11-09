import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Download,
  FileStack,
  GripVertical,
  LoaderCircle,
  PenLine,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentMarkingDialog, type MarkingResult } from "@/components/DocumentMarkingDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  mergeOpportunityDocuments,
  type MergePageRef,
  type MergeSourceKind,
} from "@/lib/document-merge.functions";
import type { OpportunityKind } from "@/lib/opportunities.functions";

export type MergeCandidate = {
  kind: MergeSourceKind;
  id: string;
  name: string;
  path: string;
  detail?: string;
};

type PageItem = MergePageRef & {
  key: string;
  number: number;
  name: string;
  thumbnail: string;
};

type MergeOutput = MarkingResult & { pageCount?: number };
type Step = "select" | "pages" | "result";

function attachmentUrl(path: string) {
  const [ownerId, fileId] = path.split("/");
  return `/api/attachments/${encodeURIComponent(ownerId || "")}/${encodeURIComponent(fileId || "")}`;
}

function move<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

function downloadUrl(path: string) {
  return attachmentUrl(path);
}

export function DocumentMergeDialog({
  open,
  onOpenChange,
  kind,
  opportunityId,
  opportunityTitle,
  candidates,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: OpportunityKind;
  opportunityId: string;
  opportunityTitle: string;
  candidates: MergeCandidate[];
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("select");
  const [outputName, setOutputName] = useState(`${opportunityTitle} merged.pdf`);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [output, setOutput] = useState<MergeOutput | null>(null);
  const [marking, setMarking] = useState<MergeOutput | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragged, setDragged] = useState<number | null>(null);
  const cancelledRef = useRef(false);

  const byKey = useMemo(
    () => new Map(candidates.map((item) => [`${item.kind}:${item.id}`, item])),
    [candidates],
  );
  const ordered = selected.map((key) => byKey.get(key)).filter(Boolean) as MergeCandidate[];
  const tender = candidates.filter((item) => item.kind === "tender");
  const library = candidates.filter((item) => item.kind === "library");

  useEffect(() => {
    if (open) return;
    cancelledRef.current = true;
    setSelected([]);
    setStep("select");
    setPages([]);
    setOutput(null);
    setPreparing(false);
    setSaving(false);
    setProgress(0);
  }, [open]);

  function toggle(candidate: MergeCandidate) {
    const key = `${candidate.kind}:${candidate.id}`;
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  async function preparePages(): Promise<void> {
    if (ordered.length < 2) {
      toast.error("Choose at least two PDF documents.");
      return;
    }
    cancelledRef.current = false;
    setPreparing(true);
    setProgress(0);
    const next: PageItem[] = [];
    let worker: Worker | null = null;
    let pdfjsModule: typeof import("pdfjs-dist") | null = null;
    try {
      const [pdfjs, workerModule] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?worker"),
      ]);
      pdfjsModule = pdfjs;
      worker = new workerModule.default();
      pdfjs.GlobalWorkerOptions.workerPort = worker;
      for (let sourceIndex = 0; sourceIndex < ordered.length; sourceIndex += 1) {
        if (cancelledRef.current) return;
        const source = ordered[sourceIndex]!;
        const response = await fetch(`${attachmentUrl(source.path)}?inline=1`);
        if (!response.ok) throw new Error(`${source.name} could not be opened.`);
        const loadingTask = pdfjs.getDocument({
          data: new Uint8Array(await response.arrayBuffer()),
        });
        try {
          const pdfDocument = await loadingTask.promise;
          if (next.length + pdfDocument.numPages > 300)
            throw new Error("A merged document can contain up to 300 pages.");
          for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
            if (cancelledRef.current) return;
            const page = await pdfDocument.getPage(pageNumber);
            const base = page.getViewport({ scale: 1 });
            const viewport = page.getViewport({ scale: Math.min(0.8, 160 / base.width) });
            const canvas = window.document.createElement("canvas");
            canvas.width = Math.max(1, Math.ceil(viewport.width));
            canvas.height = Math.max(1, Math.ceil(viewport.height));
            await page.render({ canvas, viewport }).promise;
            next.push({
              kind: source.kind,
              id: source.id,
              pageIndex: pageNumber - 1,
              key: `${source.kind}:${source.id}:${pageNumber - 1}`,
              number: pageNumber,
              name: source.name,
              thumbnail: canvas.toDataURL("image/jpeg", 0.72),
            });
            page.cleanup();
          }
        } finally {
          await loadingTask.destroy();
        }
        setProgress(Math.round(((sourceIndex + 1) / ordered.length) * 100));
      }
      setPages(next);
      setStep("pages");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The PDF pages could not be prepared.");
    } finally {
      if (pdfjsModule?.GlobalWorkerOptions.workerPort === worker)
        pdfjsModule.GlobalWorkerOptions.workerPort = null;
      worker?.terminate();
      setPreparing(false);
    }
  }

  async function merge(customPages?: PageItem[]): Promise<void> {
    if (ordered.length < 2) {
      toast.error("Choose at least two PDF documents.");
      return;
    }
    setSaving(true);
    try {
      const result = await mergeOpportunityDocuments({
        data: {
          kind,
          opportunityId,
          outputName,
          sources: ordered.map(({ kind: sourceKind, id }) => ({ kind: sourceKind, id })),
          ...(customPages
            ? {
                pages: customPages.map(({ kind: sourceKind, id, pageIndex }) => ({
                  kind: sourceKind,
                  id,
                  pageIndex,
                })),
              }
            : {}),
        },
      });
      setOutput(result);
      setStep("result");
      onSaved();
      toast.success("Merged PDF saved to this tender.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "The PDFs could not be merged.");
    } finally {
      setSaving(false);
    }
  }

  const candidateList = (title: string, items: MergeCandidate[]) => (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border p-2">
        {items.length ? (
          items.map((candidate) => {
            const key = `${candidate.kind}:${candidate.id}`;
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
              >
                <Checkbox
                  checked={selected.includes(key)}
                  onCheckedChange={() => toggle(candidate)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{candidate.name}</span>
                  {candidate.detail ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {candidate.detail}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        ) : (
          <p className="p-3 text-sm text-muted-foreground">No PDF documents available.</p>
        )}
      </div>
    </section>
  );

  return (
    <>
      <Dialog open={open && !marking} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-6xl flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileStack className="size-5 text-primary" /> Merge tender documents
            </DialogTitle>
            <DialogDescription>
              Combine PDFs without changing their originals. The result is saved back to this
              tender.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {step === "select" ? (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.72fr)]">
                <div className="space-y-5">
                  {candidateList("This tender", tender)}
                  {candidateList("Documents library", library)}
                </div>
                <section className="space-y-3 rounded-xl border bg-muted/30 p-4">
                  <div>
                    <h3 className="font-semibold">Merge order</h3>
                    <p className="text-xs text-muted-foreground">
                      Documents and their pages will follow this order.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {ordered.map((item, index) => (
                      <div
                        key={`${item.kind}:${item.id}`}
                        className="flex items-center gap-2 rounded-lg bg-background p-2 shadow-sm"
                      >
                        <span className="w-6 text-center text-xs font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          aria-label={`Move ${item.name} up`}
                          onClick={() => setSelected((current) => move(current, index, index - 1))}
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === ordered.length - 1}
                          aria-label={`Move ${item.name} down`}
                          onClick={() => setSelected((current) => move(current, index, index + 1))}
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                      </div>
                    ))}
                    {!ordered.length ? (
                      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                        Select PDFs from either list.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="merged-output-name">Merged filename</Label>
                    <Input
                      id="merged-output-name"
                      value={outputName}
                      onChange={(event) => setOutputName(event.target.value)}
                    />
                  </div>
                  {preparing ? (
                    <div className="space-y-2 rounded-lg border bg-background p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" /> Preparing page previews…{" "}
                        {progress}%
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            ) : null}

            {step === "pages" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                  <div>
                    <h3 className="font-semibold">Arrange individual pages</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag pages or use the arrow buttons. Remove pages you do not want.
                    </p>
                  </div>
                  <Badge variant="secondary">{pages.length} pages</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {pages.map((page, index) => (
                    <article
                      key={page.key}
                      draggable
                      onDragStart={() => setDragged(index)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (dragged !== null) setPages((current) => move(current, dragged, index));
                        setDragged(null);
                      }}
                      className="group overflow-hidden rounded-xl border bg-background shadow-sm"
                    >
                      <div className="relative flex aspect-[0.72] items-center justify-center overflow-hidden bg-muted p-2">
                        <img
                          src={page.thumbnail}
                          alt={`${page.name}, page ${page.number}`}
                          className="max-h-full max-w-full object-contain shadow"
                        />
                        <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[11px] font-semibold shadow">
                          {index + 1}
                        </span>
                        <GripVertical className="absolute right-2 top-2 size-4 text-muted-foreground" />
                      </div>
                      <div className="space-y-2 p-2">
                        <p className="truncate text-xs font-medium" title={page.name}>
                          {page.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Original page {page.number}
                        </p>
                        <div className="flex justify-between">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => setPages((current) => move(current, index, index - 1))}
                            aria-label="Move page left"
                          >
                            <ArrowUp className="size-3.5 -rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={index === pages.length - 1}
                            onClick={() => setPages((current) => move(current, index, index + 1))}
                            aria-label="Move page right"
                          >
                            <ArrowDown className="size-3.5 -rotate-90" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setPages((current) =>
                                current.filter((_, itemIndex) => itemIndex !== index),
                              )
                            }
                            aria-label="Remove page"
                          >
                            <Trash2 className="size-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {step === "result" && output ? (
              <div className="mx-auto max-w-2xl space-y-5 py-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Merged PDF is ready</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {output.name}
                    {output.pageCount ? ` · ${output.pageCount} pages` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild variant="outline">
                    <a href={attachmentUrl(output.path)} target="_blank" rel="noreferrer">
                      Open in app
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a
                      href={downloadUrl(output.path)}
                      download={output.name}
                      data-document-download="true"
                    >
                      <Download className="mr-2 size-4" /> Download
                    </a>
                  </Button>
                  <Button onClick={() => setMarking(output)}>
                    <PenLine className="mr-2 size-4" /> Stamp or sign
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setOutput(null);
                    setStep("select");
                  }}
                >
                  <RotateCcw className="mr-2 size-4" /> Merge another set
                </Button>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t pt-4">
            {step === "select" ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  disabled={ordered.length < 2 || preparing || saving}
                  onClick={() => void preparePages()}
                >
                  Arrange pages
                </Button>
                <Button
                  disabled={ordered.length < 2 || preparing || saving}
                  onClick={() => void merge()}
                >
                  {saving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileStack className="mr-2 size-4" />
                  )}
                  Merge and save
                </Button>
              </>
            ) : null}
            {step === "pages" ? (
              <>
                <Button variant="outline" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button disabled={!pages.length || saving} onClick={() => void merge(pages)}>
                  {saving ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <FileStack className="mr-2 size-4" />
                  )}
                  Save arranged PDF
                </Button>
              </>
            ) : null}
            {step === "result" ? <Button onClick={() => onOpenChange(false)}>Done</Button> : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DocumentMarkingDialog
        source={marking}
        onOpenChange={(isOpen) => {
          if (!isOpen) setMarking(null);
        }}
        onApplied={(signed) => {
          setOutput(signed);
          setMarking(null);
          onSaved();
          toast.success("The signed or stamped copy was saved to this tender.");
        }}
      />
    </>
  );
}
