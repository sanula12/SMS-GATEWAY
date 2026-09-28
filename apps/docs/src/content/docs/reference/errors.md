---
title: Error Codes
description: Standard error responses from the V SMS API.
---

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
| `400` | Bad request — check your request body |
| `401` | Unauthorized — missing or invalid API key |
| `403` | Forbidden — insufficient credits or wrong role |
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
