# SMSGate API Documentation



---

# Introduction

SMSGate is a multi-tenant SMS gateway that lets you send single messages, bulk campaigns, and personalized scheduled SMS - all through a simple REST API.

## Base URL
```
https://send.virgincareer.lk/api/v1
```

## What you can do

- **Send SMS** - single messages or bulk to thousands of recipients
- **Schedule messages** - set a future date and time for any message
- **Excel import** - upload a spreadsheet with per-row send dates and personalized content
- **Manage contacts** - store phonebooks and groups
- **Track delivery** - receive real-time delivery receipts via webhooks
- **Campaigns** - group bulk sends under a named campaign for reporting

## SDKs

The API is REST-based - any HTTP client works. We recommend:

- **JavaScript / TypeScript** - native `fetch` or `axios`
- **Python** - `requests` or `httpx`
- **PHP** - `GuzzleHttp`

---

# Authentication

All API requests must include your API key in the `Authorization` header.

## Getting your API key

1. Log in to your [customer dashboard](https://send.virgincareer.lk)
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Copy the key - it is shown only once

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
  -d '{"to": "+94771234567", "body": "Hello from SMSGate!"}'
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
- Use scoped keys - give each integration only the permissions it needs

---

# Quick Start

import { Steps } from '@astrojs/starlight/components';

<Steps>

1. **Get your API key**

   Log in to your dashboard, go to **Settings → API Keys**, and create a key with the `sms:send` scope.

2. **Send your first message**
```bash
   curl https://send.virgincareer.lk/api/v1/sms/send \
     -H "Authorization: Bearer sk_your_key" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+94771234567",
       "body": "Hello! This is my first SMS via SMSGate."
     }'
```

3. **Check the response**
```json
   {
     "messageId": "550e8400-e29b-41d4-a716-446655440000",
     "status": "sent",
     "provider": "provider"
   }
```

4. **Check delivery status**
```bash
   curl https://send.virgincareer.lk/api/v1/sms/messages \
     -H "Authorization: Bearer sk_your_key"
```

</Steps>

That's it! You've sent your first SMS. Next, explore [bulk sending](/sms/bulk) or [scheduling](/sms/scheduled).

---

# Send a Message

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

---

# Bulk SMS

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

---

# Scheduled SMS

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
| `scheduledAt` | ISO 8601 string | ✅ | When to send - must be in the future |

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

---

# Excel Import

This is SMSGate's most powerful feature - upload an Excel file where each row is a separate recipient with their own message and send date.

## Endpoint
```http
POST /api/v1/scheduler/import-excel
Content-Type: multipart/form-data
```

## Spreadsheet format

Your `.xlsx` file must have these columns:

| Column | Required | Description |
|---|---|---|
| `phone` | ✅ | Recipient number in E.164 format |
| `message` | ✅ | Message text. Use `{name}` to personalise |
| `send_at` | ✅ | Send date/time (Excel date or ISO string) |
| `name` | ❌ | Recipient name - replaces `{name}` in message |

### Example spreadsheet

| phone | name | message | send_at |
|---|---|---|---|
| +94771234567 | Kasun | Hi {name}, your renewal is due tomorrow! | 2026-04-01 09:00 |
| +94779876543 | Dilani | Hi {name}, your renewal is due tomorrow! | 2026-04-02 10:00 |
| +94712345678 | Nuwan | Hi {name}, don't forget your appointment! | 2026-04-03 08:30 |

## Example request
```bash
curl https://send.virgincareer.lk/api/v1/scheduler/import-excel \
  -H "Authorization: Bearer sk_your_key" \
  -F "file=@/path/to/contacts.xlsx"
```

## Response
```json
{
  "total": 3,
  "scheduled": 3,
  "skipped": 0,
  "errors": []
}
```

## Notes

- Dates in the past are skipped automatically
- Invalid phone numbers are skipped and reported in `errors`
- `{name}` in the message is replaced with the name column at send time
- Maximum **5,000 rows** per file

---

# Managing Contacts

Contacts let you store recipient details so you don't have to pass phone numbers manually every time you send.

## List contacts
```bash
curl https://send.virgincareer.lk/api/v1/contacts \
  -H "Authorization: Bearer sk_your_key"
```

## Create a contact
```bash
curl https://send.virgincareer.lk/api/v1/contacts \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+94771234567",
    "firstName": "Kasun",
    "lastName": "Perera",
    "email": "kasun@example.com"
  }'
```

## Update a contact
```bash
curl -X PATCH \
  https://send.virgincareer.lk/api/v1/contacts/contact-id \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Kasun", "isOptedOut": false}'
```

## Delete a contact
```bash
curl -X DELETE \
  https://send.virgincareer.lk/api/v1/contacts/contact-id \
  -H "Authorization: Bearer sk_your_key"
```

## Fields

| Field | Type | Description |
|---|---|---|
| `phone` | string | E.164 phone number - required, unique per account |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address |
| `groupId` | string | Assign to a contact group |
| `isOptedOut` | boolean | If true, this contact won't receive messages |
| `variables` | object | Custom key-value pairs for message personalisation |

---

# Groups

Groups let you segment your contacts so you can send campaigns to a specific audience without manually listing every number.

## Create a group
```bash
curl https://send.virgincareer.lk/api/v1/contacts/groups \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{"name": "VIP Customers", "description": "High value customers"}'
```

## List groups
```bash
curl https://send.virgincareer.lk/api/v1/contacts/groups/all \
  -H "Authorization: Bearer sk_your_key"
```

## Add a contact to a group

Pass the `groupId` when creating or updating a contact:
```bash
curl https://send.virgincareer.lk/api/v1/contacts \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+94771234567",
    "firstName": "Kasun",
    "groupId": "your-group-id"
  }'
```

## Send a campaign to a group

When creating a campaign, pass the `groupId` instead of a recipients list:
```bash
curl https://send.virgincareer.lk/api/v1/campaigns \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "VIP Promo",
    "message": "Exclusive offer for our VIP customers!",
    "type": "instant",
    "groupId": "your-group-id"
  }'
```

## Delete a group

Deleting a group does not delete the contacts inside it - they are simply unassigned.
```bash
curl -X DELETE \
  https://send.virgincareer.lk/api/v1/contacts/groups/your-group-id \
  -H "Authorization: Bearer sk_your_key"
```

---

# Creating Campaigns

Campaigns let you send to many recipients at once and track results under a single named record.

## Create an instant campaign
```bash
curl https://send.virgincareer.lk/api/v1/campaigns \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "March Promo",
    "message": "Get 20% off this weekend only!",
    "type": "instant",
    "recipients": ["+94771234567", "+94779876543"]
  }'
```

## Create a scheduled campaign
```bash
curl https://send.virgincareer.lk/api/v1/campaigns \
  -H "Authorization: Bearer sk_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "April Newsletter",
    "message": "Check out our April deals!",
    "type": "scheduled",
    "scheduledAt": "2026-04-01T08:00:00.000Z",
    "groupId": "your-group-id"
  }'
```

## List campaigns
```bash
curl https://send.virgincareer.lk/api/v1/campaigns \
  -H "Authorization: Bearer sk_your_key"
```

## Get campaign messages
```bash
curl https://send.virgincareer.lk/api/v1/campaigns/campaign-id/messages \
  -H "Authorization: Bearer sk_your_key"
```

## Campaign status values

| Status | Description |
|---|---|
| `processing` | Currently sending |
| `scheduled` | Waiting for scheduled time |
| `completed` | All messages processed |
| `failed` | Campaign encountered an error |

---

# Delivery Receipts

SMSGate posts a delivery receipt (DLR) to your registered webhook URL whenever a message status changes.

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
  "event": "dlr",
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

## Responding to webhooks

Your endpoint must return a `2xx` status code within **5 seconds**. SMSGate will retry failed deliveries up to 3 times with exponential backoff.

---

# API Reference

## SMS
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/sms/send` | Send a single SMS |
| POST | `/api/v1/sms/bulk` | Send bulk SMS |
| GET | `/api/v1/sms/messages` | Get message history |
| GET | `/api/v1/sms/providers` | List available providers |

## Scheduler
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/scheduler/schedule` | Schedule a single SMS |
| DELETE | `/api/v1/scheduler/cancel/:id` | Cancel a scheduled SMS |
| GET | `/api/v1/scheduler/scheduled` | List scheduled messages |
| POST | `/api/v1/scheduler/import-excel` | Upload Excel for bulk scheduling |
| GET | `/api/v1/scheduler/stats` | Get queue stats |

## Contacts & Groups
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/contacts` | List contacts |
| POST | `/api/v1/contacts` | Create contact |
| PATCH | `/api/v1/contacts/:id` | Update contact |
| DELETE | `/api/v1/contacts/:id` | Delete contact |
| GET | `/api/v1/contacts/groups/all` | List groups |
| POST | `/api/v1/contacts/groups` | Create group |
| DELETE | `/api/v1/contacts/groups/:id` | Delete group |

## Campaigns
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| PATCH | `/api/v1/campaigns/:id` | Update campaign |
| DELETE | `/api/v1/campaigns/:id` | Delete campaign |
| GET | `/api/v1/campaigns/:id/messages` | Get campaign messages |

## Webhooks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/webhooks` | List webhooks |
| POST | `/api/v1/webhooks` | Create webhook |
| PATCH | `/api/v1/webhooks/:id` | Update webhook |
| DELETE | `/api/v1/webhooks/:id` | Delete webhook |

## Sender IDs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sender-ids` | List your approved sender IDs |

---

# Error Codes

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Invalid phone number: 0771234567",
  "error": "Bad Request"
}
```

## HTTP status codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request - check your request body |
| `401` | Unauthorized - missing or invalid API key |
| `403` | Forbidden - insufficient credits or wrong role |
| `404` | Resource not found |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

## Common errors

| Message | Fix |
|---|---|
| `Invalid phone number` | Use E.164 format: `+94771234567` |
| `Insufficient credit balance` | Top up your account |
| `Scheduled time must be in the future` | Check your `scheduledAt` value |
| `SMS provider "default" is not configured` | Contact support |
| `Only .xlsx and .xls files are allowed` | Convert your file to Excel format |

---

# Rate Limits

Rate limits are applied per API key using a sliding window counter.

## Limits

| Plan | Requests per minute | Bulk recipients per request |
|---|---|---|
| Starter | 60 | 1,000 |
| Business | 300 | 5,000 |
| Enterprise | 1,000 | 10,000 |

## Rate limit headers

Every response includes these headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1711276800
```

## Handling 429 errors

When you hit a rate limit you'll receive a `429 Too Many Requests` response. Wait until the `X-RateLimit-Reset` timestamp before retrying.
```json
{
  "statusCode": 429,
  "message": "Too many requests, please slow down",
  "error": "Too Many Requests"
}
```