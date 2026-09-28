import {
  IsString, IsOptional, IsEmail,
  IsBoolean, IsObject
} from 'class-validator';

export class CreateContactDto {
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsBoolean()
  isOptedOut?: boolean;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}