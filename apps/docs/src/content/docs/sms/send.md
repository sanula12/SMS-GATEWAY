---
title: Send a Message
description: Send a single SMS message via the API.
---

## Endpoint
```http
POST /api/v1/sms/send
```

## Request body

| Field | Type | Required | Description |
|---|---|---|---|
| `to` | string | ✅ | Recipient phone number in E.164 format (e.g. `+94771234567`) |
| `body` | string | ✅ | Message content (max 1600 characters) |
| `from` | string | ❌ | Sender ID (must be approved on your account) |
| `scheduledAt` | ISO 8601 string | ❌ | Schedule for a future time instead of sending immediately |

## Example
```bash
curl https://send.virgincareer.lk/api/v1/sms/send \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+94771234567",
    "body": "Your OTP is 482910. Valid for 5 minutes.",
    "from": "MYAPP"
  }'
```

## Response
```json
{
  "messageId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "sent",
  "provider": "default"
}
```

## Phone number format

All numbers must be in **E.164 format**: `+` followed by country code and number, no spaces or dashes.

| ✅ Valid | ❌ Invalid |
|---|---|
| `+94771234567` | `0771234567` |
| `+447911123456` | `07911 123456` |
