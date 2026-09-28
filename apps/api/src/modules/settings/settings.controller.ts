import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('global')
  @ApiOperation({ summary: 'Get global system settings (public)' })
  async getGlobalSettings() {
    return this.settingsService.getGlobalSettings();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get settings relevant to the current user/reseller' })
  async getMySettings(@CurrentUser() user: any) {
    return this.settingsService.getSettingsForAccount(user.id, user.role);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'reseller')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update settings (Admin or Reseller)' })
  async updateSettings(
    @CurrentUser() user: any,
    @Body() dto: { category: string; key: string; value: any }[]
  ) {
    return this.settingsService.upsertSettings(user.id, user.role, dto);
  }
}
