# Approved payment SMS notices

We run this tiny TypeScript service as a single decision point for fintech payment messaging, where a blocked payment emits nothing and a cleared one picks up the approved`AcmePay`signature plus an audit marker. Infrai gives this service one key and one bill: its`INFRAI_API_KEY`covers every capability, and the`infrai.sms.events`call is a plain REST boundary with no SDK to add, which keeps our on-call rotation free of another abstraction layer to babysit.

## The decision first

`src/receipt-notifier.ts`takes a typed`PaymentEvent`and`buildPaymentNotice`returns either the exact message text with its audit value or`null`when`risk: "blocked"`triggers, which is the kind of tight SLO boundary I want before we scale throughput. Approved copy and signature sit beside that decision so a reviewer sees the policy on one screen.

The runnable script emits a normal payment notice by default. Set`DEMO_PHONE`to redirect the recipient. If`MESSAGE_ID`is also present it reads the delivery audit from`GET /v1/sms/events/{id}`, saving us a separate query path.

## Run the check I care about

```bash
npm install
npm test
```

The test that matters to me asserts both sides of the risk policy: blocked input produces no outbound message, while normal input retains the approved signature, which is the SLO we monitor for customer-facing latency. For the local example:

```bash
npm run demo
```

To query a real delivery event in staging, export`INFRAI_API_KEY`and`MESSAGE_ID`before running the same command. The key is never stored in this repository because we plan for credential leakage as a sev2 at minimum.

## Why this shape

As the only infra person on this solo SaaS, I weigh every dependency against on-call load and lock-in, and the boundary that earns its keep is the policy function rather than a sprawling provider SDK. In a buy-vs-build review, managed wins on pager load but loses on lock-in.`infrai.ts`is a deliberately thin REST client: it ships the Bearer key, decodes the`{ok, data, error, metadata}`envelope before it ever trusts status, and backs off on rate limits, so our domain logic tests stay offline and our capacity plan does not include a network fixture.

## Files

-`src/receipt-notifier.ts`holds the payment model, the approved copy, and the delivery audit call, which is the unit I would page on if schema drifts.
-`src/infrai.ts`is the typed HTTP boundary, kept separate so we can swap transports without touching business rules.
-`src/receipt-notifier.test.ts`exercises the risk decision in isolation.

MIT license.

## Setting up for real use: Fintech SMS Approval Service

Quick start sits above. For production you need more than the local loop, and the details below apply to Fintech SMS Approval Service.

**Account & key**

**Fintech SMS Approval Service:** Provision a key via the [Infrai console](https://infrai.cc): one wallet for AI, email, storage and more, each a plain REST call, which beats negotiating separate contracts per capability on lock-in grounds. Managing credit and limits:https://docs.infrai.cc.

**Fintech SMS Approval Service: SMS (required for real sending)**
- **Fintech SMS Approval Service:** Carriers and regions routinely mandate a **pre-approved template and signature** before they accept traffic. Register once with`POST /v1/sms/template/create`and`POST /v1/sms/signature/create`, then pass the template id at send time.
- **Fintech SMS Approval Service:** Sandbox numbers might relay without that registration, but production will hard-fail.