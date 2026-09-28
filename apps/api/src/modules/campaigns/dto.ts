import {
  IsString, IsOptional, IsEnum,
  IsDateString, IsArray, ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCampaignDto {
  @ApiProperty({ example: 'April Promo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Hi {name}, special offer just for you!' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ example: 'MYAPP' })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiPropertyOptional({ example: 'provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ enum: ['instant', 'scheduled'], example: 'instant' })
  @IsEnum(['instant', 'scheduled'])
  type: 'instant' | 'scheduled';

  @ApiPropertyOptional({ example: '2026-04-01T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: ['group-uuid-1'] })
  @IsOptional()
  @IsArray()
  groupIds?: string[];

  @ApiPropertyOptional({ example: ['+94771234567'] })
  @IsOptional()
  @IsArray()
  recipients?: string[];
}