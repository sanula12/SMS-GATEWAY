import { Controller, Post, Get, Body, UseGuards, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto, SendBulkSmsDto } from './dto';
import { ApiAuthGuard } from '../auth/api-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('SMS')
@ApiBearerAuth('JWT')
@Controller('sms')
@UseGuards(ApiAuthGuard, RolesGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a single SMS immediately or schedule it' })
  async sendSingle(@Body() dto: SendSmsDto, @CurrentUser() user: any) {
    return this.smsService.sendSingle(dto, user.id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Send bulk SMS to multiple recipients' })
  async sendBulk(@Body() dto: SendBulkSmsDto, @CurrentUser() user: any) {
    return this.smsService.sendBulk(dto, user.id);
  }

  @Get('messages/:id')
  @ApiOperation({ summary: 'Get detailed trace for a single message' })
  async getMessageTrace(@Param('id') id: string, @CurrentUser() user: any) {
    return this.smsService.getMessageTrace(id, user.id, user.role);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get message history for current account' })
  async getMessages(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.smsService.getMessages(user.id, user.role, user.id, page, limit, status, search);
  }

  @Get('admin/logs')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get global message history (Admin only)' })
  async getGlobalLogs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.smsService.getGlobalLogs(undefined, page, limit, status, search);
  }

  @Get('admin/health')
  @UseGuards(RolesGuard)
  @Roles('super_admin')
  @ApiOperation({ summary: 'Check Hutch API health' })
  async checkHealth() {
    return this.smsService.checkProviderHealth();
  }

  @Get('reseller/logs')
  @UseGuards(RolesGuard)
  @Roles('reseller')
  @ApiOperation({ summary: 'Get message history for all customers of the reseller' })
  async getResellerLogs(@CurrentUser() user: any, @Query('page') page?: string, @Query('limit') limit?: string, @Query('status') status?: string, @Query('search') search?: string) {
    return this.smsService.getGlobalLogs(user.id, page, limit, status, search);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get list of configured SMS providers' })
  getProviders() {
    return this.smsService.getProviders();
  }
}