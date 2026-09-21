import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAdAccountId } from "../src/config.js";

test("normalizes numeric ad account IDs for Marketing API paths", () => {
  assert.equal(normalizeAdAccountId("123456789012345"), "act_123456789012345");
  assert.equal(normalizeAdAccountId(" act_123456789012345 "), "act_123456789012345");
});
test("rejects unsafe Meta ad account IDs", () => {
  assert.throws(() => normalizeAdAccountId("act_123/../other"));
  assert.throws(() => normalizeAdAccountId("not-an-account"));
});
