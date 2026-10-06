import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { basename, resolve } from "node:path";
import mysql from "mysql2/promise";
import XLSX from "xlsx";
import {
  canonicalCompany,
  companyKey,
  normalizeGender,
  normalizeName,
  normalizePhone,
  normalizeText,
} from "../src/lib/contact-normalization.ts";

const inputPath = process.argv.find((value) => /\.(xlsx?|csv)$/i.test(value));
const dryRun = process.argv.includes("--dry-run");
if (!inputPath)
  throw new Error("Usage: npm run contacts:import -- /absolute/path/contacts.xls [--dry-run]");

const buffer = await readFile(resolve(inputPath));
const workbook = XLSX.read(buffer, { type: "buffer", raw: true, codepage: 1252 });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
if (!sheet) throw new Error("The workbook has no readable worksheet.");
const sourceRows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });

const column = (row, names) => {
  const wanted = names.map((name) =>
    name
      .toLowerCase()
      .replace(/[^a-z]+/g, " ")
      .trim(),
  );
  const entry = Object.entries(row).find(([key]) =>
    wanted.includes(
      key
        .toLowerCase()
        .replace(/[^a-z]+/g, " ")
        .trim(),
    ),
  );
  return entry?.[1] ?? "";
};

const rows = sourceRows
  .map((row) => {
    const fullName = normalizeName(column(row, ["Name", "Participant name", "Full name"]));
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    return {
      company: canonicalCompany(column(row, ["Organisation", "Organization", "Company", "Client"])),
      firstName:
        normalizeName(column(row, ["Name of Participant (First)", "First name", "Firstname"])) ||
        nameParts.shift() ||
        "",
      lastName:
        normalizeName(
          column(row, ["Name of Participant (Last)", "Last name", "Lastname", "Surname"]),
        ) || nameParts.join(" "),
      email: normalizeText(column(row, ["Email Address", "Email", "Mail"]))
        .toLowerCase()
        .replace(/\s+/g, ""),
      phoneRaw: normalizeText(column(row, ["Contact Phone", "Phone", "Mobile", "Number"])),
      phone: normalizePhone(column(row, ["Contact Phone", "Phone", "Mobile", "Number"])),
      gender: normalizeGender(column(row, ["Gender", "Sex"])),
      jobTitle: normalizeText(column(row, ["Position", "Job title", "Title", "Role"])),
    };
  })
  .filter((row) => row.company);

const groups = new Map();
for (const row of rows) {
  const key = companyKey(row.company);
  const group = groups.get(key) || { company: row.company, contacts: [] };
  group.contacts.push(row);
  groups.set(key, group);
}

const report = {
  sourceRows: sourceRows.length,
  validContacts: rows.length,
  canonicalCompanies: groups.size,
  duplicateEmails: rows.length - new Set(rows.map((row) => row.email).filter(Boolean)).size,
  unusablePhones: rows.filter((row) => !row.phone).length,
};
console.log(JSON.stringify(report, null, 2));
if (dryRun) process.exit(0);

const database = process.env.DB_NAME || "gwero_crm";
const connection = await mysql.createConnection({
  database,
  user: process.env.DB_USER || process.env.USER || "root",
  password: process.env.DB_PASSWORD || "",
  ...(process.env.DB_SOCKET || (!process.env.DB_HOST && process.platform === "darwin")
    ? { socketPath: process.env.DB_SOCKET || "/tmp/mysql.sock" }
    : { host: process.env.DB_HOST || "127.0.0.1", port: Number(process.env.DB_PORT || 3306) }),
});

let prospectsCreated = 0;
let contactsCreated = 0;
let contactsUpdated = 0;
try {
  await connection.beginTransaction();
  for (const [key, group] of groups) {
    const primary =
      group.contacts.find((contact) => contact.email.includes("@")) || group.contacts[0];
    const primaryEmail =
      primary.email ||
      `company-${Buffer.from(key).toString("base64url").slice(0, 40)}@prospect.local`;
    const [matches] = await connection.execute(
      "SELECT id FROM prospects WHERE canonical_key = ? OR email = ? LIMIT 1",
      [key, primaryEmail],
    );
    let prospectId = matches[0]?.id;
    if (!prospectId) {
      prospectId = randomUUID();
      await connection.execute(
        `INSERT INTO prospects
          (id, email, first_name, last_name, company, phone, status, notes, extra, source_file, canonical_key)
         VALUES (?, ?, ?, ?, ?, ?, 'new', NULL, '{}', ?, ?)`,
        [
          prospectId,
          primaryEmail,
          primary.firstName || null,
          primary.lastName || null,
          group.company,
          primary.phone || null,
          basename(inputPath),
          key,
        ],
      );
      prospectsCreated += 1;
    } else {
      await connection.execute(
        "UPDATE prospects SET company = ?, canonical_key = ?, source_file = ? WHERE id = ?",
        [group.company, key, basename(inputPath), prospectId],
      );
    }

    for (let index = 0; index < group.contacts.length; index += 1) {
      const contact = group.contacts[index];
      const [existing] = contact.email
        ? await connection.execute("SELECT id FROM prospect_contacts WHERE email = ? LIMIT 1", [
            contact.email,
          ])
        : [[]];
      if (existing[0]?.id) {
        await connection.execute(
          `UPDATE prospect_contacts SET prospect_id = ?, first_name = ?, last_name = ?, phone = ?,
            raw_phone = ?, gender = ?, job_title = ?, is_primary = ? WHERE id = ?`,
          [
            prospectId,
            contact.firstName || null,
            contact.lastName || null,
            contact.phone || null,
            contact.phoneRaw || null,
            contact.gender || null,
            contact.jobTitle || null,
            index === 0,
            existing[0].id,
          ],
        );
        contactsUpdated += 1;
      } else {
        await connection.execute(
          `INSERT INTO prospect_contacts
            (id, prospect_id, first_name, last_name, email, phone, raw_phone, gender, job_title, is_primary)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            prospectId,
            contact.firstName || null,
            contact.lastName || null,
            contact.email || null,
            contact.phone || null,
            contact.phoneRaw || null,
            contact.gender || null,
            contact.jobTitle || null,
            index === 0,
          ],
        );
        contactsCreated += 1;
      }
    }
  }
  await connection.commit();
  console.log(JSON.stringify({ prospectsCreated, contactsCreated, contactsUpdated }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
