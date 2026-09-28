import {
  Controller, Get, Post, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('API Keys')
@ApiBearerAuth('JWT')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys for current account' })
  findAll(@CurrentUser() user: any) {
    return this.apiKeysService.findAll(user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Generate a new API key' })
  create(@Body() dto: CreateApiKeyDto, @CurrentUser() user: any) {
    return this.apiKeysService.create(dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(@Param('id') id: string, @CurrentUser() user: any) {
    return this.apiKeysService.revoke(id, user.id);
  }
}