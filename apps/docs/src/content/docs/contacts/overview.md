---
title: Managing Contacts
description: Store and manage your recipient phonebook.
---

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
| `phone` | string | E.164 phone number — required, unique per account |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address |
| `groupId` | string | Assign to a contact group |
| `isOptedOut` | boolean | If true, this contact won't receive messages |
| `variables` | object | Custom key-value pairs for message personalisation |
