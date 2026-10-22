import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_QUALIFICATION, demoReview } from "../lib/demo.ts";
import { defaultWorkspaceMode } from "../lib/workspace-mode.ts";

test("Demo needs no external request and never presents sample figures as model results", () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("Demo must not call an external service"); };
  try {
    const result = demoReview("Shortlist electives");
    assert.equal(result.replyType, "demo");
    assert.equal(result.assessment.evaluator.status, "sample");
    assert.equal(result.assessment.sources.length, 0);
    assert.match(result.reply, /fixed illustrations, not JEV results/);
    assert.equal(result.assessment.units.length, 3);
    for (const unit of result.assessment.assessments) {
      assert.equal(unit.confidence, null);
      assert.equal(unit.evidenceId, null);
      assert.match(unit.rules.label, /unchecked/);
    }
    assert.equal(DEMO_QUALIFICATION.status, "sample");
  } finally { globalThis.fetch = originalFetch; }
});

test("Demo respects sample selections and rejects codes outside its prepared scenario", () => {
  const result = demoReview("What evidence is needed?", ["BSBLDR411"]);
  assert.deepEqual(result.assessment.units.map(u => u.code), ["BSBLDR411"]);
  assert.match(result.reply, /does not state official assessment requirements/);
  assert.throws(() => demoReview("Review", ["UNKNOWN123"]), /switch to Studio/);
});

test("Only an explicit Studio default selects the live workspace", () => {
  assert.equal(defaultWorkspaceMode("studio"), "studio");
  assert.equal(defaultWorkspaceMode(" STUDIO "), "studio");
  for (const value of [undefined, "", "demo", "replace-me"]) assert.equal(defaultWorkspaceMode(value), "demo");
});
