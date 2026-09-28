---
title: Introduction
description: Welcome to the V SMS API documentation.
---

V SMS is a multi-tenant SMS gateway that lets you send single messages, bulk campaigns, and personalized scheduled SMS — all through a simple REST API.

## Base URL
```
https://send.virgincareer.lk/api/v1
```

## What you can do

- **Send SMS** — single messages or bulk to thousands of recipients
- **Schedule messages** — set a future date and time for any message
- **Excel import** — upload a spreadsheet with per-row send dates and personalized content
- **Manage contacts** — store phonebooks and groups
- **Track delivery** — receive real-time delivery receipts via webhooks
- **Campaigns** — group bulk sends under a named campaign for reporting

## SDKs

The API is REST-based — any HTTP client works. We recommend:

- **JavaScript / TypeScript** — native `fetch` or `axios`
- **Python** — `requests` or `httpx`
- **PHP** — `GuzzleHttp`
