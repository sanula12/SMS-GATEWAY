import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StorageService } from './storage.service';

@ApiTags('Upload')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload an image asset to Bunny CDN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          return callback(new BadRequestException('Only image files (JPG, PNG, GIF, WebP, SVG) are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) throw new BadRequestException('Image file is required');
    return this.storageService.uploadFile(file, folder || 'logos');
  }

  @Post('document')
  @ApiOperation({ summary: 'Upload a document (PDF, Word, Images) to Bunny CDN' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
          return callback(new BadRequestException('Only PDFs, Word documents, and images are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File, @Query('folder') folder?: string) {
    if (!file) throw new BadRequestException('Document file is required');
    return this.storageService.uploadFile(file, folder || 'documents');
  }
}
