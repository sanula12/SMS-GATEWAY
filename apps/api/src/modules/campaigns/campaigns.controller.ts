import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@ApiBearerAuth('JWT')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get('admin/pending')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Get all campaigns pending approval (Admin only)' })
  getPendingCampaigns() {
    return this.campaignsService.getPendingCampaigns();
  }

  @Get('admin/sync-stats')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Sync and recalculate stats for all campaigns (Admin only)' })
  syncStats() {
    return this.campaignsService.syncAllStats();
  }

  @Post('admin/:id/approve')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Approve a pending campaign (Admin only)' })
  approveCampaign(@Param('id') id: string) {
    return this.campaignsService.approveCampaign(id);
  }

  @Post('admin/:id/reject')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Reject a pending campaign (Admin only)' })
  rejectCampaign(@Param('id') id: string) {
    return this.campaignsService.rejectCampaign(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all campaigns for current account' })
  findAll(@CurrentUser() user: any) {
    return this.campaignsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single campaign by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.findOne(id, user.id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get all messages in a campaign' })
  getMessages(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.getCampaignMessages(id, user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get delivery stats for a campaign' })
  getStats(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.getStats(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create and launch a new campaign' })
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: any) {
    return this.campaignsService.create(dto, user.id);
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel a scheduled or processing campaign' })
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.campaignsService.cancel(id, user.id);
  }
}