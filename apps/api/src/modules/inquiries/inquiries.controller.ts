import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateInquiryDto {
  @IsString() @MinLength(2) @MaxLength(100) name!: string;
  @IsString() @MinLength(2) @MaxLength(100) company!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsString() @MinLength(10) @MaxLength(2000) message!: string;
}

export class UpdateInquiryStatusDto {
  @IsString() status!: 'pending' | 'reviewed' | 'contacted' | 'rejected';
}

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  // Public — anyone can submit a reseller inquiry
  @Post()
  create(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.createInquiry(dto);
  }

  // Admin-only — list all inquiries
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  findAll() {
    return this.inquiriesService.getInquiries();
  }

  // Admin-only — update inquiry status
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateInquiryStatusDto) {
    return this.inquiriesService.updateStatus(id, dto.status);
  }
}
