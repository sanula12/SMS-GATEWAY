import {
  Controller, Post, Get, Patch, Delete,
  Body, Param, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto, UpdateRecurringDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Recurring Campaigns')
@ApiBearerAuth('JWT')
@Controller('recurring-campaigns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecurringController {
  constructor(private recurringService: RecurringService) {}

  @Post('import')
  @ApiOperation({ summary: 'Create a recurring campaign from an Excel file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async createFromExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateRecurringDto,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No Excel file uploaded');
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only .xlsx and .xls files are allowed');
    }
    return this.recurringService.createFromExcel(dto, file.buffer, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all recurring campaigns' })
  findAll(@CurrentUser() user: any) {
    return this.recurringService.findAll(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update recurring campaign (e.g. pause/resume)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecurringDto,
    @CurrentUser() user: any,
  ) {
    return this.recurringService.update(id, dto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete recurring campaign and its contacts' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.recurringService.remove(id, user.id);
  }
}
