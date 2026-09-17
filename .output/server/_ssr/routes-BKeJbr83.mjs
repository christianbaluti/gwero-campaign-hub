import { r as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { S as ChartColumn, T as ArrowUpRight, _ as ContactRound, a as Settings, b as ChevronDown, c as Plus, d as LayoutDashboard, f as Inbox, g as Ellipsis, i as Sparkles, l as Menu, m as FileUp, n as Users, o as Send, r as Target, s as Search, t as X, u as Mail, v as CircleQuestionMark, w as Bell } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BKeJbr83.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var campaigns = [
	{
		name: "Q3 Partnership Outreach",
		audience: "Technology Leaders",
		sent: 284,
		open: 68,
		reply: 12,
		status: "Active"
	},
	{
		name: "SME Growth Programme",
		audience: "Malawi SMEs",
		sent: 196,
		open: 61,
		reply: 9,
		status: "Active"
	},
	{
		name: "August Follow-up",
		audience: "Warm prospects",
		sent: 83,
		open: 74,
		reply: 18,
		status: "Completed"
	}
];
var nav = [
	["Overview", LayoutDashboard],
	["Prospects", ContactRound],
	["Campaigns", Send],
	["Inbox", Inbox],
	["Analytics", ChartColumn],
	["Mailboxes", Mail]
];
function Index() {
	const [active, setActive] = (0, import_react.useState)("Overview");
	const [mobileOpen, setMobileOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const [composer, setComposer] = (0, import_react.useState)(false);
	const filtered = (0, import_react.useMemo)(() => campaigns.filter((c) => `${c.name} ${c.audience}`.toLowerCase().includes(query.toLowerCase())), [query]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#f6f8fb] text-slate-950",
		children: [
			mobileOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				"aria-label": "Close navigation",
				className: "fixed inset-0 z-30 bg-slate-950/30 lg:hidden",
				onClick: () => setMobileOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: `fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex h-20 items-center gap-3 border-b border-slate-100 px-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid size-10 place-items-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200",
								children: "G"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-lg font-bold leading-5",
								children: "Gwero"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-medium text-slate-400",
								children: "Campaign Hub"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "ml-auto lg:hidden",
								onClick: () => setMobileOpen(false),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex-1 space-y-1 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[.16em] text-slate-400",
							children: "Workspace"
						}), nav.map(([label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								setActive(label);
								setMobileOpen(false);
							},
							className: `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active === label ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-[18px]" }),
								label,
								label === "Inbox" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-auto rounded-full bg-blue-600 px-2 py-0.5 text-[10px] text-white",
									children: "7"
								})
							]
						}, label))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-slate-100 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							className: "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-[18px]" }), "Settings"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white",
									children: "GG"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-sm font-semibold",
										children: "Gwero Team"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-xs text-slate-400",
										children: "Administrator"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-slate-400" })
							]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "lg:pl-64",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "sticky top-0 z-20 flex h-20 items-center gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "rounded-lg border border-slate-200 p-2 lg:hidden",
							onClick: () => setMobileOpen(true),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative hidden max-w-md flex-1 sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (e) => setQuery(e.target.value),
								className: "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50",
								placeholder: "Search campaigns and prospects…"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "ml-auto flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "Help",
									className: "rounded-lg p-2.5 text-slate-500 hover:bg-slate-100",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleQuestionMark, { className: "size-5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									"aria-label": "Notifications",
									className: "relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-rose-500" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setComposer(true),
									className: "ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hidden sm:inline",
										children: "New campaign"
									})]
								})
							]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-[1500px] p-4 md:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mb-1 text-sm font-semibold text-blue-600",
									children: "Tuesday, 9 September"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-2xl font-bold tracking-tight md:text-3xl",
									children: "Good morning, Gwero team"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-slate-500",
									children: "Here’s how your outreach is performing today."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								className: "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm hover:bg-slate-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileUp, { className: "size-4" }), "Import prospects"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
							children: [
								[
									"Total prospects",
									"1,248",
									"+84 this month",
									Users,
									"blue"
								],
								[
									"Emails sent",
									"563",
									"+12.4%",
									Send,
									"violet"
								],
								[
									"Average open rate",
									"67.2%",
									"+5.8%",
									Target,
									"emerald"
								],
								[
									"Replies received",
									"74",
									"13.1% reply rate",
									Inbox,
									"amber"
								]
							].map(([label, value, detail, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-slate-500",
										children: label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-3 text-3xl font-bold tracking-tight",
										children: value
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-4 text-xs font-semibold text-emerald-600",
									children: detail
								})]
							}, label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.04)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between border-b border-slate-100 p-5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-bold",
										children: "Campaign performance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs text-slate-400",
										children: "Recent outreach activity"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "text-sm font-semibold text-blue-600",
										children: "View all"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "overflow-x-auto",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
										className: "w-full min-w-[620px] text-left",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-5 py-3 font-bold",
													children: "Campaign"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-bold",
													children: "Sent"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-bold",
													children: "Open rate"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-bold",
													children: "Replies"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
													className: "px-4 py-3 font-bold",
													children: "Status"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
											]
										}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
											className: "border-t border-slate-100 text-sm",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-5 py-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "font-semibold",
														children: c.name
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "mt-1 text-xs text-slate-400",
														children: c.audience
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-4 font-medium",
													children: c.sent
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-semibold",
														children: [c.open, "%"]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-1.5 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full rounded-full bg-blue-500",
															style: { width: `${c.open}%` }
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
													className: "px-4 py-4 font-medium",
													children: [c.reply, "%"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "px-4 py-4",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: `rounded-full px-2.5 py-1 text-xs font-semibold ${c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`,
														children: c.status
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
													className: "pr-4",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														className: "rounded-lg p-2 hover:bg-slate-50",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4 text-slate-400" })
													})
												})
											]
										}, c.name)) })]
									})
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.04)]",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-bold",
											children: "Recent activity"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-slate-400",
											children: "Latest engagement"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											className: "rounded-lg p-2 hover:bg-slate-50",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { className: "size-4" })
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-5 space-y-5",
										children: [
											[
												"TN",
												"Thoko Nyirenda replied",
												"Q3 Partnership Outreach",
												"8 min ago",
												"emerald"
											],
											[
												"CM",
												"Chikondi Mbewe opened",
												"SME Growth Programme",
												"24 min ago",
												"blue"
											],
											[
												"FM",
												"Frank Moyo clicked a link",
												"Q3 Partnership Outreach",
												"1 hr ago",
												"violet"
											],
											[
												"AG",
												"Agnes Gondwe replied",
												"August Follow-up",
												"3 hrs ago",
												"amber"
											]
										].map(([initials, action, campaign, time]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex gap-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700",
													children: initials
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-semibold",
														children: action
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "truncate text-xs text-slate-400",
														children: campaign
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "whitespace-nowrap text-[11px] text-slate-400",
													children: time
												})
											]
										}, action))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										className: "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100",
										children: ["Open inbox ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mt-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-lg shadow-blue-100 md:flex md:items-center md:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid size-11 shrink-0 place-items-center rounded-xl bg-white/15",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-bold",
									children: "Ready for your next conversation?"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 max-w-xl text-sm text-blue-100",
									children: "Import a prospect list, personalise your message, and start a campaign in minutes."
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setComposer(true),
								className: "mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-blue-700 md:mt-0",
								children: ["Create campaign ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-4" })]
							})]
						})
					]
				})]
			}),
			composer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl font-bold",
								children: "Create a campaign"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-slate-500",
								children: "Set up the basics. You can add recipients next."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setComposer(false),
								className: "rounded-lg p-2 hover:bg-slate-100",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm font-semibold",
									children: ["Campaign name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										autoFocus: true,
										className: "mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
										placeholder: "e.g. September partner outreach"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm font-semibold",
									children: ["Email subject", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50",
										placeholder: "A quick introduction from Gwero"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-sm font-semibold",
									children: ["Audience", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										className: "mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "All prospects" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "New prospects" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Warm prospects" })
										]
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-7 flex justify-end gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setComposer(false),
								className: "h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setComposer(false),
								className: "h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white",
								children: "Save draft"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { Index as component };
