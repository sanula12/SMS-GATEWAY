import { IsString, IsOptional, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWebhookDto {
  @ApiProperty({ example: 'https://myapp.com/webhooks/sms' })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({ example: ['dlr.delivered', 'dlr.failed'] })
  @IsOptional()
  @IsArray()
  events?: string[];

  @ApiPropertyOptional({ example: 'my-webhook-secret' })
  @IsOptional()
  @IsString()
  secret?: string;
}

export class DlrCallbackDto {
  @IsString()
  messageId: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  providerMessageId?: string;

  @IsOptional()
  @IsString()
  toPhone?: string;
}