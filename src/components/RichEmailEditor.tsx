import { useEffect, useRef } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  RemoveFormatting,
  Underline,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RichEmailEditorProps = {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  minHeight?: string;
  ariaLabel?: string;
};

const commands = [
  ["bold", Bold, "Bold"],
  ["italic", Italic, "Italic"],
  ["underline", Underline, "Underline"],
  ["insertUnorderedList", List, "Bulleted list"],
  ["insertOrderedList", ListOrdered, "Numbered list"],
  ["justifyLeft", AlignLeft, "Align left"],
  ["justifyCenter", AlignCenter, "Align centre"],
  ["justifyRight", AlignRight, "Align right"],
  ["undo", Undo2, "Undo"],
  ["redo", Redo2, "Redo"],
  ["removeFormat", RemoveFormatting, "Clear formatting"],
] as const;

export function RichEmailEditor({
  value,
  onChange,
  disabled = false,
  minHeight = "260px",
  ariaLabel = "Email message",
}: RichEmailEditorProps) {
  const editor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor.current || document.activeElement === editor.current) return;
    if (editor.current.innerHTML !== value) editor.current.innerHTML = value;
  }, [value]);

  const run = (command: string, commandValue?: string) => {
    if (disabled) return;
    editor.current?.focus();
    document.execCommand(command, false, commandValue);
    if (editor.current) onChange(editor.current.innerHTML);
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 p-2">
        <select
          aria-label="Text style"
          disabled={disabled}
          className="h-8 rounded-md border bg-white px-2 text-xs"
          defaultValue="p"
          onChange={(event) => {
            run("formatBlock", event.target.value);
            event.target.value = "p";
          }}
        >
          <option value="p">Normal text</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="blockquote">Quote</option>
        </select>
        <span className="mx-1 h-6 w-px bg-slate-200" />
        {commands.map(([command, Icon, label]) => (
          <Button
            key={command}
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled}
            aria-label={label}
            title={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => run(command)}
          >
            <Icon className="size-4" />
          </Button>
        ))}
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={disabled}
          aria-label="Add link"
          title="Add link"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            const url = window.prompt("Paste the link address");
            if (url) run("createLink", url);
          }}
        >
          <Link2 className="size-4" />
        </Button>
        <label
          className="ml-1 flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-slate-600 hover:bg-slate-100"
          title="Text colour"
        >
          <span className="font-semibold">A</span>
          <input
            type="color"
            disabled={disabled}
            aria-label="Text colour"
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
            onChange={(event) => run("foreColor", event.target.value)}
          />
        </label>
      </div>
      <div className="bg-slate-100 p-3 sm:p-5">
        <div
          ref={editor}
          role="textbox"
          aria-label={ariaLabel}
          aria-multiline="true"
          contentEditable={!disabled}
          suppressContentEditableWarning
          className="mx-auto w-full max-w-[720px] overflow-wrap-anywhere rounded-lg bg-white px-5 py-6 text-[15px] leading-7 text-slate-800 shadow-sm outline-none ring-primary/20 focus:ring-4 [&_a]:text-blue-600 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:list-disc [&_ul]:pl-6"
          style={{ minHeight }}
          onInput={(event) => onChange(event.currentTarget.innerHTML)}
          data-placeholder="Write the email exactly as recipients should see it…"
        />
      </div>
      <div className="border-t bg-white px-3 py-2 text-xs text-muted-foreground">
        This canvas is the formatted email recipients will receive.
      </div>
    </div>
  );
}
