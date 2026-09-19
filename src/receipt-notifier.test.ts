import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentNotice } from "./receipt-notifier.js";

test("blocked payments never produce an approved SMS", () => {
  assert.equal(buildPaymentNotice({ paymentId: "pay-risk", recipient: "+15550001111", amountCents: 9900, risk: "blocked" }), null);
});

test("normal payments use the approved signature and audit marker", () => {
  const result = buildPaymentNotice({ paymentId: "pay-ok", recipient: "+15550001111", amountCents: 9900, risk: "normal" });
  assert.equal(result?.signature, "AcmePay");
  assert.match(result?.audit ?? "", /pay-ok/);
});
