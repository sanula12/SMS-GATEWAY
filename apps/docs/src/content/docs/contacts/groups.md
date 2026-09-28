---
title: Groups
description: Organise your contacts into groups for targeted campaigns.
---

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

Deleting a group does not delete the contacts inside it — they are simply unassigned.
```bash
curl -X DELETE \
  https://send.virgincareer.lk/api/v1/contacts/groups/your-group-id \
  -H "Authorization: Bearer sk_your_key"
```
