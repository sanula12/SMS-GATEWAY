---
title: API Reference
description: Complete list of all public V SMS API endpoints for developer integrations.
---

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
| DELETE | `/api/v1/campaigns/:id/cancel` | Cancel campaign |
| GET | `/api/v1/campaigns/:id/messages` | Get campaign messages |

## Webhooks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/webhooks` | List webhooks |
| POST | `/api/v1/webhooks` | Create webhook |
| DELETE | `/api/v1/webhooks/:id` | Delete webhook |

## Sender IDs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/sender-ids` | List your approved sender IDs |
| POST | `/api/v1/sender-ids` | Request a new sender ID |
| PATCH | `/api/v1/sender-ids/:id/set-default` | Set as default sender ID |
| DELETE | `/api/v1/sender-ids/:id` | Delete a sender ID |
