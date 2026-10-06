import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import mysql from "mysql2/promise";

const KNOWN_DOMAINS = new Map([
  ["electricity supply corporation of malawi", "escom.mw"],
  ["electricity generation company malawi", "egenco.mw"],
  ["public procurement and disposal of assets authority", "ppda.mw"],
  ["national oil company of malawi", "nocma.mw"],
  ["malawi communications regulatory authority", "macra.mw"],
  ["malawi revenue authority", "mra.mw"],
  ["central medical stores trust", "cmst.mw"],
  ["lilongwe water board", "lwb.mw"],
  ["malawi energy regulatory authority", "mera.mw"],
  ["public private partnership commission", "pppc.mw"],
  ["technical entrepreneurial and vocational education and training authority", "tevetamw.com"],
  ["tnm", "tnm.co.mw"],
  ["nbs bank", "nbs.mw"],
  ["fdh bank", "fdh.co.mw"],
  ["old mutual", "oldmutual.co.mw"],
]);

const FREE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
]);
const contentExtensions = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/svg+xml", ".svg"],
  ["image/gif", ".gif"],
  ["image/x-icon", ".ico"],
  ["image/vnd.microsoft.icon", ".ico"],
]);
const outputDirectory = resolve("public/prospect-logos");

const database = process.env.DB_NAME || "gwero_crm";
const connection = await mysql.createConnection({
  database,
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : { host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306) }),
});

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const slug = (value) => normalize(value).replace(/\s+/g, "-").slice(0, 80) || "prospect";
const fetchWithTimeout = (url, options = {}) =>
  fetch(url, {
    ...options,
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; GweroCRM/1.0; official-logo-discovery)",
      ...options.headers,
    },
  });

function corporateDomain(company, emails) {
  const companyName = normalize(company);
  for (const [key, domain] of KNOWN_DOMAINS) {
    if (companyName.includes(key) || key.includes(companyName)) return domain;
  }
  const domains = emails
    .map((email) =>
      String(email || "")
        .split("@")[1]
        ?.toLowerCase(),
    )
    .filter((domain) => domain && !FREE_DOMAINS.has(domain) && !domain.endsWith(".local"));
  return (
    domains.sort(
      (a, b) =>
        domains.filter((item) => item === b).length - domains.filter((item) => item === a).length,
    )[0] || null
  );
}

function imageCandidates(html, baseUrl) {
  const values = [];
  const tags = html.match(/<(?:img|link|meta)\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    const isLogo = /logo/.test(lower);
    const isIcon = /rel=["'][^"']*(?:icon|apple-touch-icon)/i.test(tag);
    const isOgImage = /property=["']og:image["']/i.test(tag);
    if (!isLogo && !isIcon && !isOgImage) continue;
    const match = tag.match(/(?:src|href|content)=["']([^"']+)["']/i);
    if (!match) continue;
    try {
      const url = new URL(match[1], baseUrl);
      if (["http:", "https:"].includes(url.protocol))
        values.push({ url: url.href, score: isLogo ? 3 : isIcon ? 2 : 1 });
    } catch {}
  }
  return values.sort((a, b) => b.score - a.score);
}

async function officialPage(domain) {
  for (const address of [`https://${domain}/`, `https://www.${domain}/`, `http://${domain}/`]) {
    try {
      const response = await fetchWithTimeout(address, { headers: { accept: "text/html" } });
      if (!response.ok || !String(response.headers.get("content-type")).includes("text/html"))
        continue;
      return { url: response.url, html: await response.text() };
    } catch {}
  }
  return null;
}

async function downloadLogo(company, page) {
  for (const candidate of imageCandidates(page.html, page.url)) {
    try {
      const response = await fetchWithTimeout(candidate.url, { headers: { accept: "image/*" } });
      if (!response.ok) continue;
      const type = String(response.headers.get("content-type") || "")
        .split(";")[0]
        .toLowerCase();
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!type.startsWith("image/") || buffer.length < 100 || buffer.length > 2_000_000) continue;
      const extension =
        contentExtensions.get(type) || extname(new URL(candidate.url).pathname).toLowerCase();
      if (!/[.](?:png|jpe?g|webp|svg|gif|ico)$/.test(extension)) continue;
      const filename = `${slug(company)}${extension === ".jpeg" ? ".jpg" : extension}`;
      await writeFile(resolve(outputDirectory, filename), buffer);
      return `/prospect-logos/${filename}`;
    } catch {}
  }
  return null;
}

await mkdir(outputDirectory, { recursive: true });
const [prospects] = await connection.execute(
  `SELECT p.id, p.company, p.website, p.logo_path, GROUP_CONCAT(pc.email SEPARATOR ',') AS contact_emails
     FROM prospects p LEFT JOIN prospect_contacts pc ON pc.prospect_id = p.id
    GROUP BY p.id, p.company, p.website, p.logo_path ORDER BY p.company`,
);
let enriched = 0;
let skipped = 0;
let cursor = 0;
async function enrichNext() {
  const prospect = prospects[cursor++];
  if (!prospect) return;
  if (prospect.logo_path) {
    skipped += 1;
    return enrichNext();
  }
  const emails = String(prospect.contact_emails || "")
    .split(",")
    .filter(Boolean);
  let domain = corporateDomain(prospect.company, emails);
  if (!domain && prospect.website) {
    try {
      domain = new URL(prospect.website).hostname.replace(/^www\./, "");
    } catch {}
  }
  if (!domain) {
    skipped += 1;
    return enrichNext();
  }
  const page = await officialPage(domain);
  if (!page) {
    skipped += 1;
    return enrichNext();
  }
  const logoPath = await downloadLogo(prospect.company, page);
  if (!logoPath) {
    skipped += 1;
    return enrichNext();
  }
  await connection.execute(
    "UPDATE prospects SET logo_path = ?, website = COALESCE(website, ?) WHERE id = ?",
    [logoPath, page.url, prospect.id],
  );
  await connection.execute(
    "UPDATE clients SET logo_path = ?, website = COALESCE(website, ?) WHERE prospect_id = ?",
    [logoPath, page.url, prospect.id],
  );
  enriched += 1;
  console.log(`Logo saved: ${prospect.company}`);
  return enrichNext();
}
await Promise.all(Array.from({ length: 10 }, () => enrichNext()));
await connection.end();
console.log(JSON.stringify({ prospects: prospects.length, enriched, skipped }, null, 2));
