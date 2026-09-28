import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, CreateGroupDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Contacts')
@ApiBearerAuth('JWT')
@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contacts, optionally filtered by group' })
  @ApiQuery({ name: 'groupId', required: false, description: 'Filter by group ID' })
  findAll(@CurrentUser() user: any, @Query('groupId') groupId?: string) {
    return this.contactsService.findAll(user.id, groupId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  create(@Body() dto: CreateContactDto, @CurrentUser() user: any) {
    return this.contactsService.create(dto, user.id);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Import multiple contacts at once' })
  bulkImport(
    @Body() dto: { rows: any[], groupId?: string },
    @CurrentUser() user: any
  ) {
    return this.contactsService.bulkImport(dto.rows, user.id, dto.groupId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact' })
  update(@Param('id') id: string, @Body() dto: UpdateContactDto, @CurrentUser() user: any) {
    return this.contactsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.remove(id, user.id);
  }

  @Get('groups/all')
  @ApiOperation({ summary: 'Get all contact groups' })
  getGroups(@CurrentUser() user: any) {
    return this.contactsService.getGroups(user.id);
  }

  @Post('groups')
  @ApiOperation({ summary: 'Create a new contact group' })
  createGroup(@Body() dto: CreateGroupDto, @CurrentUser() user: any) {
    return this.contactsService.createGroup(dto, user.id);
  }

  @Delete('groups/:id')
  @ApiOperation({ summary: 'Delete a contact group' })
  deleteGroup(@Param('id') id: string, @CurrentUser() user: any) {
    return this.contactsService.deleteGroup(id, user.id);
  }
}