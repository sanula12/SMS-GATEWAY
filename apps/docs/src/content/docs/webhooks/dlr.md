---
title: Delivery Receipts
description: Receive real-time delivery status updates via webhooks.
---

V SMS posts a delivery receipt (DLR) to your registered webhook URL whenever a message status changes.

## Register a webhook

From your dashboard go to **Settings → Webhooks** and add your endpoint URL, or via the API:
```bash
curl https://send.virgincareer.lk/api/v1/webhooks \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My DLR Handler",
    "url": "https://yourapp.com/webhooks/sms"
  }'
```

## Payload
```json
{
  "event": "dlr.delivered",
  "timestamp": "2026-03-24T10:30:00.000Z",
  "messageId": "550e8400-...",
  "to": "+94771234567",
  "status": "delivered",
  "providerMessageId": "gateway_abc123"
}
```

## Status values

| Status | Description |
|---|---|
| `sent` | Accepted by the provider |
| `delivered` | Confirmed delivered to handset |
| `failed` | Could not be delivered |
| `undelivered` | Sent but undeliverable (number inactive etc.) |


## Security (HMAC Signature)

V SMS secures webhook payloads by sending an `X-Webhook-Signature` header. 
You should always verify this signature using your webhook's secret key (found in the dashboard).

Example in Node.js:
```javascript
const crypto = require('crypto');

function verifySignature(req, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  return signature === req.headers['x-webhook-signature'];
}
```

## Responding to webhooks

Your endpoint must return a `2xx` status code within **5 seconds**. V SMS will retry failed deliveries up to 3 times with exponential backoff.
