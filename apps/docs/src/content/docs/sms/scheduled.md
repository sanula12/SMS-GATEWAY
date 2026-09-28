---
title: Scheduled SMS
description: Schedule a message to be sent at a specific time.
---

## Endpoint
```http
POST /api/v1/scheduler/schedule
```

## Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | ✅ | Recipient phone number |
| `body` | string | ✅ | Message content |
| `from` | string | ❌ | Sender ID |
| `scheduledAt` | ISO 8601 string | ✅ | When to send — must be in the future |

## Example
```bash
curl https://send.virgincareer.lk/api/v1/scheduler/schedule \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+94771234567",
    "body": "Your appointment is tomorrow at 10am. Reply STOP to opt out.",
    "scheduledAt": "2026-04-01T09:00:00.000Z"
  }'
```

## Response
```json
{
  "messageId": "550e8400-...",
  "jobId": "1234",
  "scheduledAt": "2026-04-01T09:00:00.000Z",
  "status": "scheduled"
}
```

## Cancel a scheduled message
```http
DELETE /api/v1/scheduler/cancel/:messageId
```
```bash
curl -X DELETE \
  https://send.virgincareer.lk/api/v1/scheduler/cancel/550e8400-... \
  -H "Authorization: Bearer sk_your_key"
```
