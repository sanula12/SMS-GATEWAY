import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSenderIdDto {
  @ApiProperty({ example: 'MYBRAND' })
  @IsString()
  senderId: string;

  @ApiPropertyOptional({ example: 'LK', default: 'LK' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Bunny CDN URL for NIC document' })
  @IsOptional()
  @IsString()
  nicUrl?: string;

  @ApiPropertyOptional({ description: 'Bunny CDN URL for Business Registration' })
  @IsOptional()
  @IsString()
  brUrl?: string;

  @ApiPropertyOptional({ description: 'Bunny CDN URL for signed Request Letter' })
  @IsOptional()
  @IsString()
  requestLetterUrl?: string;
}

export class UpdateSenderIdStatusDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  status: string;
}

export class ResellerReviewDto {
  @ApiProperty({ enum: ['approved', 'rejected'] })
  @IsEnum(['approved', 'rejected'])
  resellerStatus: string;
}