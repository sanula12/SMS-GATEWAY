import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SenderIdsService } from './sender-ids.service';
import { CreateSenderIdDto, UpdateSenderIdStatusDto, ResellerReviewDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sender IDs')
@ApiBearerAuth('JWT')
@Controller('sender-ids')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SenderIdsController {
  constructor(private senderIdsService: SenderIdsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sender IDs (admin sees all, others see own)' })
  findAll(@CurrentUser() user: any) {
    return this.senderIdsService.findAll(user.id, user.role);
  }

  @Get('customer-requests')
  @Roles('reseller')
  @ApiOperation({ summary: 'Get sender ID requests from customers (Reseller only)' })
  findCustomerRequests(@CurrentUser() user: any) {
    return this.senderIdsService.findCustomerRequests(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Request a new sender ID' })
  create(@Body() dto: CreateSenderIdDto, @CurrentUser() user: any) {
    return this.senderIdsService.create(dto, user.id);
  }

  @Patch(':id/reseller-review')
  @Roles('reseller')
  @ApiOperation({ summary: 'Approve or reject a customer sender ID (Reseller only)' })
  resellerReview(
    @Param('id') id: string,
    @Body() dto: ResellerReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.senderIdsService.resellerReview(id, dto, user.id);
  }

  @Patch(':id/status')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Approve or reject a sender ID (admin only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSenderIdStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.senderIdsService.updateStatus(id, dto, user.role);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set a sender ID as default' })
  setDefault(@Param('id') id: string, @CurrentUser() user: any) {
    return this.senderIdsService.setDefault(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sender ID' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.senderIdsService.remove(id, user.id);
  }
}