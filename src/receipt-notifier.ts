import { infrai } from "./infrai.js";
import { z } from "zod";

export const paymentEventBody = z.object({
  paymentId: z.string().min(1),
  recipient: z.string().min(1),
  amountCents: z.number().int().nonnegative(),
  risk: z.enum(["normal", "review", "blocked"]),
});

export type PaymentEvent = {
  paymentId: string;
  recipient: string;
  amountCents: number;
  risk: "normal" | "review" | "blocked";
};

type ApprovedMessage = { template: string; signature: string; text: string; audit: string };

const approved = {
  payment_received: { template: "payment_received", signature: "AcmePay" },
} as const;

export function buildPaymentNotice(event: PaymentEvent): ApprovedMessage | null {
  if (event.risk === "blocked") return null;
  const choice = approved.payment_received;
  const text = `${choice.signature}: Payment ${event.paymentId} received ${(event.amountCents / 100).toFixed(2)}.`;
  return { ...choice, text, audit: `payment:${event.paymentId}:sms-approved` };
}

export async function readDeliveryAudit(messageId: string) {
  return infrai.sms.events(messageId);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const event: PaymentEvent = { paymentId: "pay_2048", recipient: process.env.DEMO_PHONE ?? "+15550001111", amountCents: 12500, risk: "normal" };
  const notice = buildPaymentNotice(event);
  console.log(JSON.stringify({ recipient: event.recipient, notice }, null, 2));
  if (process.env.INFRAI_API_KEY && process.env.MESSAGE_ID) console.log(await readDeliveryAudit(process.env.MESSAGE_ID));
}
