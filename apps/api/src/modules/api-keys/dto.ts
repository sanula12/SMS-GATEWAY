import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'My App Integration' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: ['sms:send', 'contacts:read'] })
  @IsOptional()
  @IsArray()
  permissions?: string[];

  @ApiPropertyOptional({ example: '2027-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}