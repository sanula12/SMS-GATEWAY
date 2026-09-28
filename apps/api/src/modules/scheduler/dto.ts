import {
  IsString, IsDateString, IsOptional,
  IsArray, ValidateNested, ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleSmsDto {
  @IsString()
  to: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsDateString()
  scheduledAt: string;
}

export class ExcelRowDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  message: string;

  @IsDateString()
  sendAt: string;
}

export class ImportExcelDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExcelRowDto)
  rows: ExcelRowDto[];

  @IsOptional()
  @IsString()
  from?: string;
}