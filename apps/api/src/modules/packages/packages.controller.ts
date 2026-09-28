import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request, Query,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  // ── List packages for the current user ──────────────────────────────────
  @Get()
  findAll(@Request() req: any) {
    return this.packagesService.findAll(req.user.id, req.user.role);
  }

  // ── List wholesale packages (resellers only) ─────────────────────────────
  @Get('wholesale')
  @Roles('reseller', 'super_admin')
  findWholesale() {
    return this.packagesService.findWholesale();
  }

  // ── List all payment transactions ────────────────────────────────────────
  @Get('transactions')
  getTransactions(@Request() req: any, @Query('type') type?: string) {
    return this.packagesService.getTransactions(req.user.id, req.user.role, type);
  }

  // ── Get invoice details for a transaction ─────────────────────────────────
  @Get('transactions/:txId/invoice')
  getInvoiceDetails(@Param('txId') txId: string, @Request() req: any) {
    return this.packagesService.getInvoiceDetails(txId, req.user.id, req.user.role);
  }

  // ── Create a package (admin or reseller) ─────────────────────────────────
  @Post()
  @Roles('super_admin', 'reseller')
  create(@Body() dto: CreatePackageDto, @Request() req: any) {
    return this.packagesService.create(dto, req.user.id, req.user.role);
  }

  // ── Update a package ─────────────────────────────────────────────────────
  @Patch(':id')
  @Roles('super_admin', 'reseller')
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto, @Request() req: any) {
    return this.packagesService.update(id, dto, req.user.id, req.user.role);
  }

  // ── Deactivate a package ─────────────────────────────────────────────────
  @Delete(':id')
  @Roles('super_admin', 'reseller')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.packagesService.remove(id, req.user.id, req.user.role);
  }

  // ── Customer initiates a bank transfer purchase ───────────────────────────
  @Post(':id/purchase/bank-transfer')
  initiateBankTransfer(@Param('id') packageId: string, @Request() req: any) {
    return this.packagesService.initiateBankTransfer(packageId, req.user.id);
  }

  // ── Customer initiates a OnePay purchase ──────────────────────────────────
  @Post(':id/purchase/onepay')
  initiateOnePay(@Param('id') packageId: string, @Request() req: any) {
    // The frontend sends Origin in the headers (e.g. https://frontend.com)
    // Fallback to referer or local dev url if missing
    let baseUrl = req.headers.origin;
    if (!baseUrl && req.headers.referer) {
      baseUrl = new URL(req.headers.referer).origin;
    }
    if (!baseUrl) {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      baseUrl = `${protocol}://${host}`.replace(':3001', ':3000');
    }

    return this.packagesService.initiateOnePay(packageId, req.user.id, baseUrl, req.user.role);
  }

  // ── Upload payment slip ───────────────────────────────────────────────────
  @Patch('transactions/:txId/slip')
  attachSlip(
    @Param('txId') txId: string,
    @Body('slipUrl') slipUrl: string,
    @Request() req: any,
  ) {
    return this.packagesService.attachSlip(txId, slipUrl, req.user.id);
  }

  // ── Approve a payment ─────────────────────────────────────────────────────
  @Patch('transactions/:txId/approve')
  @Roles('super_admin', 'reseller')
  approveTransaction(@Param('txId') txId: string, @Request() req: any) {
    return this.packagesService.approveTransaction(txId, req.user.id, req.user.role);
  }

  // ── Reject a payment ──────────────────────────────────────────────────────
    // -- Cancel a payment ----------------------------
  @Patch('transactions/:txId/cancel')
  @Roles('super_admin', 'reseller', 'customer')
  cancelTransaction(@Param('txId') txId: string, @Request() req: any) {
    return this.packagesService.cancelTransaction(txId, req.user.id, req.user.role);
  }

  @Patch('transactions/:txId/reject')
  @Roles('super_admin', 'reseller')
  rejectTransaction(
    @Param('txId') txId: string,
    @Body('notes') notes: string,
    @Request() req: any,
  ) {
    return this.packagesService.rejectTransaction(txId, notes, req.user.id, req.user.role);
  }
}


