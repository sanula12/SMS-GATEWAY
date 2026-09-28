import {
  IsEmail, IsString, IsOptional, IsEnum,
  MinLength, IsNumber, Min
} from 'class-validator';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(['reseller', 'customer'])
  role?: 'reseller' | 'customer';
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(['active', 'suspended', 'pending'])
  status?: 'active' | 'suspended' | 'pending';

  @IsOptional()
  @IsEnum(['super_admin', 'reseller', 'customer'])
  role?: 'super_admin' | 'reseller' | 'customer';

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  lowBalanceThreshold?: number;
}

export class TopUpCreditsDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TransferCreditsDto {
  @IsString()
  toAccountId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}