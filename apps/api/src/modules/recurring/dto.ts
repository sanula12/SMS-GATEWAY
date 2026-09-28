import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRecurringDto {
  @ApiProperty({ example: 'Customer Birthdays' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Happy Birthday {name}!' })
  @IsString()
  messageTemplate: string;

  @ApiPropertyOptional({ example: 'MYBRAND' })
  @IsOptional()
  @IsString()
  senderId?: string;

  @ApiProperty({ example: '08:00', description: 'HH:mm format (24-hour)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'sendTime must be in HH:mm format' })
  sendTime: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export class UpdateRecurringDto {
  @ApiPropertyOptional({ enum: ['active', 'paused'] })
  @IsOptional()
  @IsEnum(['active', 'paused'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  sendTime?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'yearly'])
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}
