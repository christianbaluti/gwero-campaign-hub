export interface ProspectLike {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  company?: string | null;
  job_title?: string | null;
  phone?: string | null;
  extra?: Record<string, unknown> | null;
}

export const BASE_PLACEHOLDERS = [
  "first_name",
  "last_name",
  "full_name",
  "email",
  "company",
  "job_title",
  "phone",
];

export function personalize(template: string, prospect: ProspectLike): string {
  const values: Record<string, string> = {
    first_name: prospect.first_name ?? "",
    last_name: prospect.last_name ?? "",
    full_name: [prospect.first_name, prospect.last_name].filter(Boolean).join(" "),
    email: prospect.email ?? "",
    company: prospect.company ?? "",
    job_title: prospect.job_title ?? "",
    phone: prospect.phone ?? "",
  };
  for (const [key, value] of Object.entries(prospect.extra ?? {})) {
    if (value != null && values[key] === undefined) values[key] = String(value);
  }
  return template.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key: string) => values[key] ?? "");
}

export function htmlToText(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
