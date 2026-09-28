import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storageZone: string;
  private apiKey: string;
  private region: string;
  private pullZoneUrl: string;

  constructor(private readonly config: ConfigService) {
    this.storageZone = this.config.get<string>('bunny.storageZone') || '';
    this.apiKey = this.config.get<string>('bunny.apiKey') || '';
    this.region = this.config.get<string>('bunny.region') || '';
    this.pullZoneUrl = (this.config.get<string>('bunny.pullZoneUrl') || '').replace(/\/+$/, '');

    if (!this.storageZone || !this.apiKey) {
      this.logger.warn('Bunny CDN Storage Zone or API Key is not configured yet. Uploads will be mocked or rejected.');
    } else {
      this.logger.log(`Bunny CDN storage initialized for zone: ${this.storageZone}`);
    }
  }

  private getStorageHost(): string {
    const region = this.region.toLowerCase().trim();
    if (['ny', 'la', 'sg', 'syd', 'uk', 'se', 'br', 'jh'].includes(region)) {
      return `${region}.storage.bunnycdn.com`;
    }
    return 'storage.bunnycdn.com';
  }

  /**
   * Uploads an image or file buffer directly to Bunny CDN Storage
   * @param file Express.Multer.File containing buffer, mimetype, and originalname
   * @param subfolder Subfolder path inside the storage zone (e.g. 'logos', 'slips')
   * @returns Public CDN URL of the uploaded asset
   */
  async uploadFile(file: Express.Multer.File, subfolder = 'logos'): Promise<{ url: string; key: string }> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided for upload');
    }

    // Clean subfolder path
    const folder = subfolder.replace(/^\/+|\/+$/g, '');
    
    // Generate clean unique filename
    const ext = file.originalname.includes('.') ? file.originalname.split('.').pop() : 'png';
    const cleanName = `${uuidv4()}.${ext}`;
    const filePath = folder ? `${folder}/${cleanName}` : cleanName;

    // If Bunny credentials are not yet set, provide a clear helpful fallback
    if (!this.storageZone || !this.apiKey) {
      this.logger.warn(`Bunny CDN credentials not provided. Returning local placeholder for ${filePath}`);
      const mockUrl = `https://mock-cdn.bunnycdn.com/${this.storageZone || 'demo'}/${filePath}`;
      return { url: mockUrl, key: filePath };
    }

    const host = this.getStorageHost();
    const uploadUrl = `https://${host}/${this.storageZone}/${filePath}`;

    this.logger.log(`Uploading asset to Bunny CDN: ${uploadUrl}`);

    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(file.buffer),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Bunny CDN upload failed with status ${response.status}: ${errorText}`);
        throw new BadRequestException(`Bunny CDN upload failed: ${response.statusText}`);
      }

      // Construct public delivery URL
      const publicBase = this.pullZoneUrl || `https://${this.storageZone}.b-cdn.net`;
      const publicUrl = `${publicBase}/${filePath}`;

      this.logger.log(`Asset successfully uploaded to Bunny CDN: ${publicUrl}`);
      return { url: publicUrl, key: filePath };
    } catch (err: any) {
      this.logger.error(`Bunny CDN upload exception: ${err.message}`, err.stack);
      throw new BadRequestException(`Failed to upload to Bunny CDN: ${err.message}`);
    }
  }
}
