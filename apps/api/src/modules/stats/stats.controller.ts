import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { StatsService } from './stats.service';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {

    constructor(private readonly statsService: StatsService){}

    @Get('dashboard')
    getDashboardStats(@Req() req: any, @Query('range') range?: string) {
        return this.statsService.getDashboardStats(req.user.id, range);
    }

    @Get('admin')
    @UseGuards(RolesGuard)
    @Roles('super_admin')
    getAdminDashboardStats(@Query('range') range?: string) {
        return this.statsService.getAdminDashboardStats(range);
    }

    @Get('reseller')
    @UseGuards(RolesGuard)
    @Roles('reseller')
    getResellerDashboardStats(@Req() req: any, @Query('range') range?: string) {
        return this.statsService.getResellerStats(req.user.id, range);
    }
}
