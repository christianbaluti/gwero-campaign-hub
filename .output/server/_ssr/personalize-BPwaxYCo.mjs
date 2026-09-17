//#region node_modules/.nitro/vite/services/ssr/assets/personalize-BPwaxYCo.js
var BASE_PLACEHOLDERS = [
	"first_name",
	"last_name",
	"full_name",
	"email",
	"company",
	"job_title",
	"phone"
];
function personalize(template, prospect) {
	const values = {
		first_name: prospect.first_name ?? "",
		last_name: prospect.last_name ?? "",
		full_name: [prospect.first_name, prospect.last_name].filter(Boolean).join(" "),
		email: prospect.email ?? "",
		company: prospect.company ?? "",
		job_title: prospect.job_title ?? "",
		phone: prospect.phone ?? ""
	};
	for (const [key, value] of Object.entries(prospect.extra ?? {})) if (value != null && values[key] === void 0) values[key] = String(value);
	return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key) => values[key] ?? "");
}
function htmlToText(html) {
	return html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\n{3,}/g, "\n\n").trim();
}
//#endregion
export { htmlToText as n, personalize as r, BASE_PLACEHOLDERS as t };
