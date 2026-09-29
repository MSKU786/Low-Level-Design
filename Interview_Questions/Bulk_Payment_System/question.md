# Backend Interview — Bulk Payment Implementation (45 Minutes)

<aside>
⏱️

**Duration:** 45 minutes

</aside>

## Problem

You are building a backend service that allows a company to submit multiple payments in a single request.

Implement the core logic for processing a **bulk payment**.

### Example request

```json
{
  "bulkPaymentId": "bulk-123",
  "payments": [
    {
      "id": "payment-1",
      "beneficiaryId": "beneficiary-101",
      "amount": 1000,
      "currency": "AED"
    },
    {
      "id": "payment-2",
      "beneficiaryId": "beneficiary-102",
      "amount": 2500,
      "currency": "AED"
    },
    {
      "id": "payment-3",
      "beneficiaryId": "beneficiary-103",
      "amount": 500,
      "currency": "AED"
    }
  ]
}
```

## Available Payment API

Assume the following function is already available:

```tsx
async function sendPayment(payment: Payment): Promise<PaymentResult>
```

It sends one payment to an external payment provider and returns the result.

## Requirement

Implement:

```tsx
async function processBulkPayment(
  request: BulkPaymentRequest
): Promise<BulkPaymentResult>
```

The function should:

- accept a bulk payment request;
- process the payments using `sendPayment`;
- return the result of the bulk operation, including the outcome of individual payments.

An example response could look like:

```json
{
  "bulkPaymentId": "bulk-123",
  "status": "COMPLETED",
  "payments": [
    {
      "id": "payment-1",
      "status": "SUCCESS"
    },
    {
      "id": "payment-2",
      "status": "SUCCESS"
    },
    {
      "id": "payment-3",
      "status": "SUCCESS"
    }
  ]
}
```

## Expectations

- You may use **TypeScript / Node.js**.
- Focus on the backend implementation and design of the core flow.
- You can introduce classes, interfaces, repositories, queues, database models, or other components if you think they are needed.
- You are free to make reasonable assumptions.
- Please explain important assumptions and trade-offs while implementing.
- Ask questions whenever you believe the requirement is incomplete or ambiguous.

<aside>
💡

We are interested in **how you reason about the problem**, not just whether you finish all the code.

</aside>