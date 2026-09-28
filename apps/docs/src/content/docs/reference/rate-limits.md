---
title: Rate Limits
description: API rate limits and how to handle them.
---

To protect the platform and ensure high performance for all users, rate limits are applied globally per API key using a sliding window counter.

## Global Limits

All API keys, regardless of account balance, are subject to the following maximums:

- **Requests per minute:** 600 requests
- **Bulk recipients per request:** 10,000 phone numbers

By bundling your numbers into the `/bulk` endpoint, a single API key can safely queue up to 6,000,000 messages per minute without hitting the rate limit.

## Rate limit headers

Every response includes these headers:
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
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
