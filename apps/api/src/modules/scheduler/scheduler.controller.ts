import {
  Controller, Post, Get, Delete,
  Body, Param, UseGuards,
  UseInterceptors, UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiConsumes, ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SchedulerService } from './scheduler.service';
import { ScheduleSmsDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Scheduler')
@ApiBearerAuth('JWT')
@Controller('scheduler')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchedulerController {
  constructor(private schedulerService: SchedulerService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a single SMS for future delivery' })
  schedule(@Body() dto: ScheduleSmsDto, @CurrentUser() user: any) {
    return this.schedulerService.scheduleSms(dto, user.id);
  }

  @Delete('cancel/:messageId')
  @ApiOperation({ summary: 'Cancel a scheduled SMS' })
  cancel(@Param('messageId') messageId: string, @CurrentUser() user: any) {
    return this.schedulerService.cancelScheduled(messageId, user.id);
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get all scheduled (pending) messages' })
  getScheduled(@CurrentUser() user: any) {
    return this.schedulerService.getScheduled(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get BullMQ queue statistics' })
  getStats() {
    return this.schedulerService.getQueueStats();
  }

  @Post('import-excel')
  @ApiOperation({ summary: 'Upload Excel file to schedule bulk SMS per row' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx) with columns: phone, name, message, send_at',
        },
        senderId: { type: 'string', description: 'Optional sender ID override' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
    @Body('senderId') senderId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only .xlsx and .xls files are allowed');
    }
    return this.schedulerService.importExcel(file.buffer, user.id, senderId || undefined);
  }
}