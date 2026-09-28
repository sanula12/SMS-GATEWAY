import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePackageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['retail', 'wholesale'])
  @IsOptional()
  type?: 'retail' | 'wholesale';

  @IsNumber()
  price: number;

  @IsNumber()
  creditAmount: number;

  @IsOptional()
  features?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdatePackageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['retail', 'wholesale'])
  @IsOptional()
  type?: 'retail' | 'wholesale';

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  creditAmount?: number;

  @IsOptional()
  features?: any;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
