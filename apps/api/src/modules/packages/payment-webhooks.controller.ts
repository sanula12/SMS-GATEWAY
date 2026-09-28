import { Controller, Post, Body, Req } from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('payments')
export class PaymentWebhooksController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post('onepay/webhook')
  async handleOnePayWebhook(@Body() payload: any) {
    return this.packagesService.handleOnePayCallback(payload);
  }
}
