import {
  Controller, Get, Post, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { WhitelabelService } from './whitelabel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('whitelabel')
export class WhitelabelController {
  constructor(private readonly whitelabelService: WhitelabelService) {}

  // ── PUBLIC: Used by Next.js middleware — NO auth required ─────────────────
  // The middleware calls this server-to-server to look up domain branding
  @Get('by-domain')
  async findByDomain(@Query('domain') domain: string) {
    return this.whitelabelService.findByDomain(domain);
  }

  // ── PROTECTED: Reseller reads their own branding ──────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'reseller')
  getMySettings(@Request() req: any) {
    return this.whitelabelService.getMySettings(req.user.id);
  }

  // ── PROTECTED: Reseller creates / updates their branding ──────────────────
  @Post('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'reseller')
  upsert(
    @Body() dto: { domain?: string; companyName: string; logoUrl?: string; primaryColor?: string; supportEmail?: string },
    @Request() req: any,
  ) {
    return this.whitelabelService.upsert(dto, req.user.id, req.user.role);
  }

  // ── ADMIN: List all whitelabel configs ────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findAll() {
    return this.whitelabelService.findAll();
  }
}
