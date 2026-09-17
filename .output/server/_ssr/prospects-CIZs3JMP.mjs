import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as X } from "../_libs/lucide-react.mjs";
import { i as CardContent, n as Button, r as Card, s as cn, t as AppShell } from "./card-CBzG8Uef.mjs";
import { t as Badge } from "./badge-Ci6XGb5B.mjs";
import { t as Input } from "./input-B7I4vy8H.mjs";
import { a as DialogOverlay$1, c as DialogTrigger$1, i as DialogDescription$1, n as DialogClose, o as DialogPortal$1, r as DialogContent$1, s as DialogTitle$1, t as Dialog$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-D6Lp5M71.mjs";
import { t as supabase } from "./client-BCblZ87S.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Label } from "./label-BAtza3LO.mjs";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-PceKd7UZ.mjs";
import { n as utils, t as readSync } from "../_libs/xlsx.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/prospects-CIZs3JMP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogTrigger = DialogTrigger$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var FIELDS = [
	{
		key: "email",
		label: "Email (required)"
	},
	{
		key: "first_name",
		label: "First name"
	},
	{
		key: "last_name",
		label: "Last name"
	},
	{
		key: "company",
		label: "Company"
	},
	{
		key: "job_title",
		label: "Job title"
	},
	{
		key: "phone",
		label: "Phone"
	}
];
var STATUSES = [
	"new",
	"contacted",
	"replied",
	"interested",
	"not_interested",
	"client"
];
function ImportDialog({ onDone }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [rows, setRows] = (0, import_react.useState)([]);
	const [headers, setHeaders] = (0, import_react.useState)([]);
	const [fileName, setFileName] = (0, import_react.useState)("");
	const [mapping, setMapping] = (0, import_react.useState)({});
	const [busy, setBusy] = (0, import_react.useState)(false);
	async function handleFile(file) {
		const buffer = await file.arrayBuffer();
		const book = readSync(buffer);
		const sheetName = book.SheetNames[0];
		if (!sheetName) return;
		const sheet = book.Sheets[sheetName];
		if (!sheet) return;
		const data = utils.sheet_to_json(sheet, { defval: "" });
		if (!data.length) {
			toast.error("That file has no rows.");
			return;
		}
		const cols = Object.keys(data[0]);
		setRows(data);
		setHeaders(cols);
		setFileName(file.name);
		const guess = {};
		for (const field of FIELDS) {
			const hit = cols.find((c) => c.toLowerCase().replace(/[^a-z]/g, "") === field.key.replace(/_/g, ""));
			if (hit) guess[field.key] = hit;
		}
		if (!guess["email"]) {
			const hit = cols.find((c) => c.toLowerCase().includes("mail"));
			if (hit) guess["email"] = hit;
		}
		if (!guess["first_name"]) {
			const hit = cols.find((c) => c.toLowerCase().includes("name"));
			if (hit) guess["first_name"] = hit;
		}
		setMapping(guess);
	}
	async function importRows() {
		if (!mapping["email"]) {
			toast.error("Choose which column holds the email address.");
			return;
		}
		setBusy(true);
		const mapped = rows.map((row) => {
			const used = new Set(Object.values(mapping));
			const extra = {};
			for (const [key, value] of Object.entries(row)) if (!used.has(key) && value !== "") extra[key] = value;
			const pick = (field) => {
				const col = mapping[field];
				const value = col ? row[col] : null;
				return value == null || value === "" ? null : String(value).trim();
			};
			const email = pick("email");
			if (!email || !email.includes("@")) return null;
			return {
				email: email.toLowerCase(),
				first_name: pick("first_name"),
				last_name: pick("last_name"),
				company: pick("company"),
				job_title: pick("job_title"),
				phone: pick("phone"),
				extra,
				source_file: fileName
			};
		}).filter(Boolean);
		if (!mapped.length) {
			setBusy(false);
			toast.error("No valid email addresses found in that column.");
			return;
		}
		const { error } = await supabase.from("prospects").upsert(mapped, { onConflict: "email" });
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success(`${mapped.length} prospects imported.`);
		setOpen(false);
		setRows([]);
		setHeaders([]);
		onDone();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
			asChild: true,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, { children: "Upload spreadsheet" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "max-h-[85vh] overflow-y-auto sm:max-w-2xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Import prospects" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Upload an Excel or CSV file, then tell us which column holds what." })] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "file",
					accept: ".xlsx,.xls,.csv",
					onChange: (e) => {
						const file = e.target.files?.[0];
						if (file) handleFile(file);
					}
				}),
				headers.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground",
							children: [
								rows.length,
								" rows found in ",
								fileName,
								". Anything you don't map is kept as extra details you can still use as placeholders."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid gap-3 sm:grid-cols-2",
							children: FIELDS.map((field) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, { children: field.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: mapping[field.key] ?? "__none",
									onValueChange: (v) => setMapping((m) => {
										const next = { ...m };
										if (v === "__none") delete next[field.key];
										else next[field.key] = v;
										return next;
									}),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Not used" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: "__none",
										children: "Not used"
									}), headers.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: h,
										children: h
									}, h))] })]
								})]
							}, field.key))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: () => void importRows(),
							disabled: busy,
							children: busy ? "Importing…" : `Import ${rows.length} rows`
						})
					]
				}) : null
			]
		})]
	});
}
function ProspectsPage() {
	const qc = useQueryClient();
	const [search, setSearch] = (0, import_react.useState)("");
	const { data: prospects = [] } = useQuery({
		queryKey: ["prospects"],
		queryFn: async () => {
			const { data, error } = await supabase.from("prospects").select("*").order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const setStatus = useMutation({
		mutationFn: async ({ id, status }) => {
			const { error } = await supabase.from("prospects").update({ status }).eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] })
	});
	const convert = useMutation({
		mutationFn: async (prospect) => {
			const { error } = await supabase.from("clients").insert({
				name: [prospect.first_name, prospect.last_name].filter(Boolean).join(" ") || prospect.email,
				company: prospect.company,
				email: prospect.email,
				phone: prospect.phone,
				prospect_id: prospect.id
			});
			if (error) throw error;
			await supabase.from("prospects").update({ status: "client" }).eq("id", prospect.id);
		},
		onSuccess: () => {
			toast.success("Prospect converted to a client.");
			qc.invalidateQueries({ queryKey: ["prospects"] });
			qc.invalidateQueries({ queryKey: ["clients"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const remove = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("prospects").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => qc.invalidateQueries({ queryKey: ["prospects"] })
	});
	const filtered = prospects.filter((p) => `${p.email} ${p.first_name ?? ""} ${p.last_name ?? ""} ${p.company ?? ""}`.toLowerCase().includes(search.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Prospects",
		description: "Everyone you might sell to, imported from your spreadsheets.",
		actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportDialog, { onDone: () => qc.invalidateQueries({ queryKey: ["prospects"] }) }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "pt-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					placeholder: "Search by name, email or company",
					value: search,
					onChange: (e) => setSearch(e.target.value),
					className: "mb-4 max-w-sm"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Name" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Email" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Company" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
							className: "text-right",
							children: "Actions"
						})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableBody, { children: [filtered.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "font-medium",
							children: [p.first_name, p.last_name].filter(Boolean).join(" ") || "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: p.email }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: p.company ?? "—" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: p.status,
							onValueChange: (status) => setStatus.mutate({
								id: p.id,
								status
							}),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
								className: "h-8 w-40",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
								value: s,
								children: s.replace("_", " ")
							}, s)) })]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, {
							className: "space-x-2 text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "outline",
								onClick: () => convert.mutate(p),
								children: "Make client"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "sm",
								variant: "ghost",
								onClick: () => remove.mutate(p.id),
								children: "Delete"
							})]
						})
					] }, p.id)), filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
						colSpan: 5,
						className: "py-10 text-center text-muted-foreground",
						children: "No prospects yet — upload a spreadsheet to get started."
					}) }) : null] })] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: "secondary",
						children: prospects.length
					}), " prospects in total"]
				})
			]
		}) })
	});
}
//#endregion
export { ProspectsPage as component };
