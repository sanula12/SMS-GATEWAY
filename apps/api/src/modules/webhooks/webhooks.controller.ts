import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, DlrCallbackDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get all registered webhook endpoints' })
  findAll(@CurrentUser() user: any) {
    return this.webhooksService.findAll(user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Register a new webhook endpoint' })
  create(@Body() dto: CreateWebhookDto, @CurrentUser() user: any) {
    return this.webhooksService.create(dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.webhooksService.remove(id, user.id);
  }

  // Public endpoint — called by SMS provider (no auth)
  @Post('dlr/callback')
  @ApiOperation({ summary: 'Inbound DLR callback from SMS provider (public)' })
  handleDlr(@Body() dto: DlrCallbackDto) {
    return this.webhooksService.handleDlr(dto);
  }

  @Get('hutch/dlr')
  @ApiOperation({ summary: 'Hutch Delivery Report Webhook (GET)'})
  handleHutchDlr(@Query() query: any) {

    return this.webhooksService.handleHutchDlr(query);
  }
}