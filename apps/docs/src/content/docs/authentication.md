---
title: Authentication
description: How to authenticate with the V SMS API.
---

All API requests must include your API key in the `Authorization` header.

## Getting your API key

1. Log in to your [customer dashboard](https://send.virgincareer.lk)
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Copy the key — it is shown only once

## Using your API key

Pass your key in the `Authorization` header on every request:
```http
Authorization: Bearer sk_your_api_key_here
```

## Example
```bash
curl https://send.virgincareer.lk/api/v1/sms/send \
  -H "Authorization: Bearer sk_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"to": "+94771234567", "body": "Hello from V SMS!"}'
```

## Scopes

When creating an API key you can restrict it to specific scopes:

| Scope | Description |
|---|---|
| `sms:send` | Send SMS messages |
| `sms:read` | Read message history |
| `contacts:read` | Read contacts and groups |
| `contacts:write` | Create and update contacts |
| `campaigns:read` | Read campaigns |
| `campaigns:write` | Create and manage campaigns |

## Security tips

- Never expose your API key in frontend code or public repositories
- Rotate keys regularly from your dashboard
- Use scoped keys — give each integration only the permissions it needs
