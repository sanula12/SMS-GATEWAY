---
title: Creating Campaigns
description: Group bulk sends under a named campaign for tracking and reporting.
---

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

