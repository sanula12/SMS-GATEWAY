---
title: Excel Import
description: Upload a spreadsheet to send personalized SMS at individual scheduled times.
---

This is V SMS's most powerful feature — upload an Excel file where each row is a separate recipient with their own message and send date.

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
| `name` | ❌ | Recipient name — replaces `{name}` in message |

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
