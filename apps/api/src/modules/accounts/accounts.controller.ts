import {
  Controller, Get, Post, Patch, Body,
  Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, TopUpCreditsDto, TransferCreditsDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@ApiBearerAuth('JWT')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @Roles('super_admin', 'reseller')
  @ApiOperation({ summary: 'Get all accounts visible to caller' })
  async findAll(@CurrentUser() user: any) {
    return this.accountsService.findAll(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single account by ID' })
  @ApiParam({ name: 'id', description: 'Account UUID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.findOne(id, user.id, user.role);
  }

  @Post()
  @Roles('super_admin', 'reseller')
  @ApiOperation({ summary: 'Create a new account (admin or reseller)' })
  async create(@Body() dto: CreateAccountDto, @CurrentUser() user: any) {
    return this.accountsService.create(dto, user.id, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update account details' })
  async update(@Param('id') id: string, @Body() dto: UpdateAccountDto, @CurrentUser() user: any) {
    return this.accountsService.update(id, dto, user.id, user.role);
  }

  @Post(':id/credits/topup')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Top up credits for an account (admin only)' })
  async topUp(@Param('id') id: string, @Body() dto: TopUpCreditsDto, @CurrentUser() user: any) {
    return this.accountsService.topUpCredits(id, dto, user.id);
  }

  @Post('credits/transfer')
  @Roles('super_admin', 'reseller')
  @ApiOperation({ summary: 'Transfer credits to a customer account' })
  async transfer(@Body() dto: TransferCreditsDto, @CurrentUser() user: any) {
    return this.accountsService.transferCredits(dto, user.id, user.role);
  }

  @Get(':id/credits/history')
  @ApiOperation({ summary: 'Get credit transaction history for an account' })
  async creditHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.accountsService.getCreditHistory(id, user.id, user.role);
  }
}