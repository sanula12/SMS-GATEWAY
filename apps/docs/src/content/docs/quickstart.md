---
title: Quick Start
description: Send your first SMS in under 2 minutes.
---

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
       "body": "Hello! This is my first SMS."
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
