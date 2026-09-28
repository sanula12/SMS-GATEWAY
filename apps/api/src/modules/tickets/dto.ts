import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({ example: 'API not working' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'I am getting a 401 error...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({ example: 'https://cdn.example.com/img.png' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class ReplyTicketDto {
  @ApiProperty({ example: 'Here is my reply...' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/img.png' })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}

export class UpdateTicketStatusDto {
  @ApiProperty({ enum: ['open', 'pending', 'resolved', 'closed'] })
  @IsEnum(['open', 'pending', 'resolved', 'closed'])
  status: 'open' | 'pending' | 'resolved' | 'closed';
}
