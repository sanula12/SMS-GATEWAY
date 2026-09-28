import { Controller, All, Query, Body, Req, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { SmsService } from './sms.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class SmsWebhookController {
  private readonly logger = new Logger(SmsWebhookController.name);

  constructor(private readonly smsService: SmsService) {}

  @All('hutch/dlr')       // ← URL Hutch has whitelisted: /api/v1/webhooks/hutch/dlr
  @All('sms/hutch/dlr')   // ← original path kept for backward compat
  @ApiOperation({ summary: 'Delivery Report Webhook for Hutch Gateway' })
  async handleHutchDlr(@Req() req: Request, @Query() query: any, @Body() body: any) {
    this.logger.log(`Received Hutch DLR: query=${JSON.stringify(query)}, body=${JSON.stringify(body)}`);

    const payload = Object.keys(body || {}).length > 0 ? body : query;
    
    // Hutch might send server_ref, serverRef, messageId, etc.
    const serverRef = payload.server_ref || payload.serverRef || payload.messageId;
    const number = payload.number || payload.msisdn || payload.to;
    const type = payload.type || payload.status;

    if (!serverRef || !number || type === undefined) {
      this.logger.warn(`Hutch DLR missing parameters. Payload: ${JSON.stringify(payload)}`);
      return { success: false, error: 'Missing required parameters' };
    }

    // Map Hutch DLR types to our standard statuses
    let status: 'delivered' | 'failed' | 'rejected' = 'delivered';
    const typeStr = String(type).toLowerCase();
    
    if (typeStr === '1' || typeStr === 'delivered') status = 'delivered';
    else if (typeStr === '2' || typeStr === 'failed' || typeStr === 'undelivered') status = 'failed';
    else if (typeStr === '3' || typeStr === 'rejected' || typeStr === 'expired') status = 'rejected'; 

    await this.smsService.processDeliveryReport(serverRef, number, status);

    // Return a 200 OK so Hutch knows we received it
    return { success: true };
  }
}
