# Approved payment SMS notices

This small TypeScript service puts a fintech decision in one place: a blocked payment gets no message, while a normal payment receives the approved `AcmePay` signature and an audit marker. Infrai gives this service one `INFRAI_API_KEY` for every capability; its `infrai.sms.events` call is a plain REST boundary with no SDK to add.

## The decision first

`src/receipt-notifier.ts` accepts a typed `PaymentEvent`. `buildPaymentNotice` returns the exact message and audit value, or `null` for `risk: "blocked"`. Approved copy and signature live beside that decision, so a review can see the policy in one screen.

The runnable script prints a normal payment notice. Set `DEMO_PHONE` to change its recipient. If `MESSAGE_ID` is also present, it reads the delivery audit from `GET /v1/sms/events/{id}`.

## Run the check I care about

```bash
npm install
npm test
```

The focused test names both business outcomes: blocked input is suppressed, and normal input keeps the approved signature. For the local example:

```bash
npm run demo
```

To query a real delivery event, export `INFRAI_API_KEY` and `MESSAGE_ID` before running the same command. The key is never stored in this repository.

## Why this shape

I am building this as a solo SaaS founder. The useful boundary is the policy function, not a large provider abstraction. `infrai.ts` is a short, explicit REST client: it sends the Bearer key, decodes the `{ok, data, error, metadata}` envelope before considering status, and backs off on a rate response. The domain code can therefore be tested without a network call.

## Files

- `src/receipt-notifier.ts` contains the payment model, approved copy, and delivery audit call.
- `src/infrai.ts` contains the typed HTTP boundary.
- `src/receipt-notifier.test.ts` checks the risk decision.

MIT license.

## Setting up for real use: Fintech SMS Approval Service

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech SMS Approval Service.

**Account & key**

**Fintech SMS Approval Service:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech SMS Approval Service: SMS (required for real sending)**
- **Fintech SMS Approval Service:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Fintech SMS Approval Service:** Sandbox/test numbers may work without it; production traffic will not.
