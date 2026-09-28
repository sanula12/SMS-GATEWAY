import { IsString, IsOptional, IsDateString, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendSmsDto {
  @ApiProperty({ example: '+94771234567', description: 'Recipient phone in E.164 format' })
  @IsString()
  to: string;

  @ApiProperty({ example: 'Hello! Your OTP is 1234' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'MYAPP', description: 'Sender ID or number' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '2026-04-01T09:00:00.000Z', description: 'Leave empty to send immediately' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class SendBulkSmsDto {
  @ApiPropertyOptional({ example: ['+94771234567'], description: 'Array of recipient numbers (if not using groupId)' })
  @IsOptional()
  @IsArray()
  to?: string[];

  @ApiPropertyOptional({ example: 'group-uuid', description: 'Contact Group ID (if using merge fields / groups)' })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ example: 'Hello! Special offer just for you.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'MYAPP' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: 'default' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '2026-04-01T09:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 'April Promo Campaign' })
  @IsOptional()
  @IsString()
  campaignName?: string;
}
// ```

// Save everything. Once it compiles visit:
// ```
// http://localhost:3001/api/docs