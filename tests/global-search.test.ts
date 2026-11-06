import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSearchText,
  parseSearchQuery,
  rankSearchCandidate,
} from "../src/lib/global-search.server.ts";

test("global search normalizes punctuation and accents", () => {
  assert.equal(normalizeSearchText("  José's RFQ—2026  "), "jose s rfq 2026");
});

test("global search understands entity intent words", () => {
  assert.deepEqual(parseSearchQuery("client public procurement"), {
    tokens: ["client", "public", "procurement"],
    intents: ["client"],
    terms: ["public", "procurement"],
  });
  assert.deepEqual(parseSearchQuery("RFQ"), {
    tokens: ["rfq"],
    intents: ["rfq"],
    terms: [],
  });
});

test("global search ranks an exact title above a metadata-only match", () => {
  const exact = rankSearchCandidate(
    {
      kind: "client",
      typeLabel: "Client",
      title: "Public Procurement Authority",
      subtitle: "Government",
      meta: "active",
    },
    "Public Procurement Authority",
  );
  const metadata = rankSearchCandidate(
    {
      kind: "document",
      typeLabel: "Document",
      title: "Annual report",
      subtitle: "Owned by Public Procurement Authority",
      meta: "general",
    },
    "Public Procurement Authority",
  );
  assert.ok(exact > metadata);
});

test("global search boosts results matching the requested entity", () => {
  const plain = rankSearchCandidate(
    { kind: "client", typeLabel: "Client", title: "Acme", subtitle: "", meta: "active" },
    "Acme",
  );
  const intended = rankSearchCandidate(
    { kind: "client", typeLabel: "Client", title: "Acme", subtitle: "", meta: "active" },
    "Acme",
    ["client"],
  );
  assert.ok(intended > plain);
});
