---
title: Bulk SMS
description: Send SMS to multiple recipients at once.
---

## Endpoint
```http
POST /api/v1/sms/bulk
```

## Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string[] | ✅ | Array of recipient phone numbers in E.164 format |
| `body` | string | ✅ | Message content |
| `from` | string | ❌ | Sender ID |
| `campaignName` | string | ❌ | Label this send as a named campaign |
| `scheduledAt` | ISO 8601 string | ❌ | Schedule the bulk send for a future time |

## Example
```bash
curl https://send.virgincareer.lk/api/v1/sms/bulk \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["+94771234567", "+94779876543", "+94712345678"],
    "body": "Flash sale! 30% off everything this weekend.",
    "from": "MYSTORE",
    "campaignName": "Weekend Sale March 2026"
  }'
```

## Response
```json
{
  "campaignId": "a1b2c3d4-...",
  "totalCount": 3,
  "sentCount": 3,
  "failedCount": 0
}
```

## Limits

- Maximum **10,000 recipients** per bulk request
- Messages are sent in batches of 50 to respect provider rate limits
- Credits are deducted upfront for the full batch
