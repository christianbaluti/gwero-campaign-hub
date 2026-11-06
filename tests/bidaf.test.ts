import test from "node:test";
import assert from "node:assert/strict";
import {
  bidafSourceNotes,
  mapBidafOpportunityKind,
  shouldImportBidafLifecycle,
  type BidafOpportunity,
} from "../src/lib/bidaf.server.ts";

test("BidAF procurement types route to the correct Gwero opportunity module", () => {
  assert.equal(mapBidafOpportunityKind("RFQ"), "rfq");
  assert.equal(mapBidafOpportunityKind("Request for Quotations"), "rfq");
  assert.equal(mapBidafOpportunityKind("Request for Proposal"), "rfp");
  assert.equal(mapBidafOpportunityKind("Request for Proposals"), "rfp");
  assert.equal(mapBidafOpportunityKind("Expression of Interest"), "eoi");
  assert.equal(mapBidafOpportunityKind("Pre-Qualification"), "eoi");
  assert.equal(mapBidafOpportunityKind("RFB"), "bid");
  assert.equal(mapBidafOpportunityKind("National Competitive Tender"), "bid");
});

test("only actionable BidAF lifecycles are imported", () => {
  for (const lifecycle of ["VERIFIED_OPEN", "UPCOMING", "NEEDS_VERIFICATION"])
    assert.equal(shouldImportBidafLifecycle(lifecycle), true);
  for (const lifecycle of ["EXPIRED", "CANCELLED", "AWARDED", "HISTORICAL", null])
    assert.equal(shouldImportBidafLifecycle(lifecycle), false);
});

test("source notes retain the BidAF identity and authoritative URL", () => {
  const item = {
    id: "bidaf-123",
    title: "Network equipment",
    reference: "RFQ-1",
    buyer: { id: "buyer-1", name: "Example Council" },
    procurement_type: "RFQ",
    lifecycle: "VERIFIED_OPEN",
    published_at: null,
    closing_at: null,
    closing_date: null,
    estimated_amount: null,
    currency: null,
    original_source_url: "https://publisher.example/notice",
    first_seen_at: null,
    last_seen_at: null,
    version: "v1",
    sectors: ["ICT"],
  } satisfies BidafOpportunity;
  const notes = bidafSourceNotes(item);
  assert.match(notes, /BidAF ID: bidaf-123/);
  assert.match(notes, /Source: https:\/\/publisher\.example\/notice/);
  assert.match(notes, /Sectors: ICT/);
});
