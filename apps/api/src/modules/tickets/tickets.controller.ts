import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto, ReplyTicketDto, UpdateTicketStatusDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tickets')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  async createTicket(@CurrentUser() user: any, @Body() dto: CreateTicketDto) {
    return this.ticketsService.createTicket(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of tickets' })
  async getTickets(@CurrentUser() user: any) {
    return this.ticketsService.getTickets(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific ticket thread' })
  async getTicket(@CurrentUser() user: any, @Param('id') id: string) {
    return this.ticketsService.getTicket(id, user);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply to a ticket' })
  async replyToTicket(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: ReplyTicketDto) {
    return this.ticketsService.replyToTicket(id, user, dto);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'reseller')
  @ApiOperation({ summary: 'Update ticket status (Admin or Reseller)' })
  async updateStatus(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.ticketsService.updateStatus(id, user, dto);
  }
}
