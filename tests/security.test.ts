import test from "node:test";
import assert from "node:assert/strict";
import { requiredTablePermission } from "../src/lib/security-policy.ts";
import { attachmentHeaders, validateAttachmentBytes } from "../src/lib/attachment-policy.ts";
test("sensitive modules and unknown tables fail closed", () => {
  assert.equal(requiredTablePermission("payroll_items", "select"), "finance.manage");
  assert.equal(requiredTablePermission("employees", "delete"), "hr.manage");
  assert.equal(requiredTablePermission("mailboxes", "update"), "settings.manage");
  assert.equal(requiredTablePermission("prospects", "select"), "prospects.view");
  assert.equal(requiredTablePermission("prospects", "insert"), "prospects.manage");
  assert.equal(requiredTablePermission("supplier_quotes", "update"), "procurement.manage");
  assert.equal(requiredTablePermission("cost_sheet_columns", "delete"), "opportunities.manage");
  assert.equal(
    requiredTablePermission("opportunity_comment_mentions", "insert"),
    "opportunities.manage",
  );
  for (const table of ["mailbox_secrets", "auth_sessions", "__proto__", "constructor", "new_table"])
    assert.throws(() => requiredTablePermission(table, "select"));
  assert.throws(() => requiredTablePermission("prospects", "execute"));
});
test("active content is rejected even with misleading extensions or MIME", () => {
  const svg = new TextEncoder().encode(
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  );
  assert.throws(() => validateAttachmentBytes("image.svg", svg));
  assert.throws(() => validateAttachmentBytes("fake.png", svg));
  assert.throws(() => validateAttachmentBytes("page.html", svg));
  assert.equal(
    validateAttachmentBytes("brief.pdf", new TextEncoder().encode("%PDF-1.7\n")),
    "application/pdf",
  );
});
test("legacy uploads are forced to inert downloads and filenames cannot inject headers", () => {
  const headers = attachmentHeaders('unsafe"\r\nContent-Type: text/html.svg', 50);
  assert.equal(headers["content-type"], "application/octet-stream");
  assert.match(headers["content-disposition"], /^attachment;/);
  assert.doesNotMatch(headers["content-disposition"], /[\r\n]/);
  assert.match(headers["content-security-policy"], /sandbox/);
  assert.match(headers["cache-control"], /no-store/);
});
