import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.module';
import {
  packages, accounts, creditTransactions, paymentTransactions,
} from '../../database/schema';
import { CreatePackageDto, UpdatePackageDto } from './dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class PackagesService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly config: ConfigService,
  ) {}

  // ── List packages visible to the caller ──────────────────────────────────
  async findAll(callerId: string, callerRole: string) {
    if (callerRole === 'super_admin') {
      // Admin sees ONLY their own packages (ownerId is NULL)
      return this.db
        .select()
        .from(packages)
        .where(isNull(packages.ownerId))
        .orderBy(desc(packages.createdAt));
    }

    if (callerRole === 'reseller') {
      // Resellers see ONLY their own packages (ownerId = callerId)
      return this.db
        .select()
        .from(packages)
        .where(eq(packages.ownerId, callerId))
        .orderBy(desc(packages.createdAt));
    }

    // Customers see packages belonging to their direct parent (reseller or admin)
    const [account] = await this.db
      .select({ parentId: accounts.parentId })
      .from(accounts)
      .where(eq(accounts.id, callerId));

    const parentId = account?.parentId;

    if (parentId) {
      // Customer of a reseller: show ONLY the reseller's packages
      return this.db
        .select()
        .from(packages)
        .where(
          and(
            eq(packages.isActive, true),
            eq(packages.type, 'retail'),
            eq(packages.ownerId, parentId),
          ),
        )
        .orderBy(packages.price);
    }

    // Direct customer of the admin: show ONLY admin retail packages
    return this.db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.isActive, true),
          eq(packages.type, 'retail'),
          isNull(packages.ownerId),
        ),
      )
      .orderBy(packages.price);
  }

  // ── Wholesale packages (resellers only) ──────────────────────────────────
  async findWholesale() {
    return this.db
      .select()
      .from(packages)
      .where(
        and(
          eq(packages.isActive, true),
          eq(packages.type, 'wholesale'),
          isNull(packages.ownerId),
        ),
      )
      .orderBy(packages.price);
  }

  // ── Create package (admin or reseller) ──────────────────────────────────
  async create(dto: CreatePackageDto, callerId: string, callerRole: string) {
    if (callerRole === 'customer') {
      throw new ForbiddenException('Customers cannot create packages');
    }

    // Resellers can only create retail packages (not wholesale)
    if (callerRole === 'reseller' && dto.type === 'wholesale') {
      throw new ForbiddenException('Resellers cannot create wholesale packages');
    }

    const id = uuidv4();
    const ownerId = callerRole === 'super_admin' ? null : callerId;

    await this.db.insert(packages).values({
      id,
      name: dto.name,
      ownerId,
      type: dto.type ?? 'retail',
      price: dto.price.toFixed(2),
      creditAmount: dto.creditAmount,
      features: dto.features ?? null,
      isActive: dto.isActive ?? true,
    });

    const [created] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    return created;
  }

  // ── Update package ───────────────────────────────────────────────────────
  async update(id: string, dto: UpdatePackageDto, callerId: string, callerRole: string) {
    const [pkg] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    if (!pkg) throw new NotFoundException('Package not found');

    // Only admin or the reseller who owns it can edit
    if (callerRole !== 'super_admin' && pkg.ownerId !== callerId) {
      throw new ForbiddenException('You do not own this package');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.price !== undefined) updateData.price = dto.price.toFixed(2);
    if (dto.creditAmount !== undefined) updateData.creditAmount = dto.creditAmount;
    if (dto.features !== undefined) updateData.features = dto.features;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    updateData.updatedAt = new Date();

    await this.db.update(packages).set(updateData).where(eq(packages.id, id));

    const [updated] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    return updated;
  }

  // ── Delete / deactivate package ──────────────────────────────────────────
  async remove(id: string, callerId: string, callerRole: string) {
    const [pkg] = await this.db
      .select()
      .from(packages)
      .where(eq(packages.id, id));

    if (!pkg) throw new NotFoundException('Package not found');

    if (callerRole !== 'super_admin' && pkg.ownerId !== callerId) {
      throw new ForbiddenException('You do not own this package');
    }

    await this.db
      .update(packages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(packages.id, id));

    return { message: 'Package deactivated' };
  }

  // ── Customer purchases a retail package (Bank Transfer) ──────────────────
  // Slip URL is set after upload; admin/reseller approves the transaction later
  async initiateBankTransfer(packageId: string, callerId: string) {
    const [pkg] = await this.db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)));

    if (!pkg) throw new NotFoundException('Package not found or inactive');

    const txId = uuidv4();
    await this.db.insert(paymentTransactions).values({
      id: txId,
      accountId: callerId,
      packageId,
      amount: pkg.price,
      paymentMethod: 'bank_transfer',
      status: 'pending',
    });

    return { transactionId: txId, amount: pkg.price, status: 'pending' };
  }

  // ── Initiate OnePay Checkout ──────────────────────────────────────────────
  async initiateOnePay(packageId: string, callerId: string, baseUrl: string, role?: string) {
    const [pkg] = await this.db
      .select()
      .from(packages)
      .where(and(eq(packages.id, packageId), eq(packages.isActive, true)));

    if (!pkg) throw new NotFoundException('Package not found or inactive');
    // Only allow OnePay for Admin-owned packages
    if (pkg.ownerId !== null) {
      throw new ForbiddenException('OnePay is only available for direct packages. Please use bank transfer for reseller packages.');
    }

    const [account] = await this.db.select().from(accounts).where(eq(accounts.id, callerId));
    if (!account) throw new NotFoundException('Account not found');

    const txId = uuidv4();
    await this.db.insert(paymentTransactions).values({
      id: txId,
      accountId: callerId,
      packageId,
      amount: pkg.price,
      paymentMethod: 'onepay',
      status: 'pending',
    });

    const appId = (this.config.get<string>('onePay.appId') || '').trim();
    const hashSalt = (this.config.get<string>('onePay.hashSalt') || '').trim();
    const appToken = (this.config.get<string>('onePay.appToken') || '').trim();
    const onePayApi = (this.config.get<string>('onePay.apiUrl') || '').trim();

    if (!appId || !hashSalt || !appToken) {
      throw new BadRequestException('OnePay gateway is not configured correctly on this server');
    }

    const amountStr = parseFloat(pkg.price).toFixed(2);
    const rawString = `${appId}LKR${amountStr}${hashSalt}`;
    const hash = crypto.createHash('sha256').update(rawString).digest('hex');

    const payload = {
      app_id: appId,
      amount: parseFloat(amountStr),
      currency: 'LKR',
      hash: hash,
      reference: txId.replace(/-/g, '').substring(0, 20),
      customer_first_name: account.name?.split(' ')[0] || 'Customer',
      customer_last_name: account.name?.split(' ').slice(1).join(' ') || 'Name',
      customer_phone_number: account.phone || '+94700000000',
      customer_email: account.email || 'customer@smsgate.local',
      transaction_redirect_url: `${baseUrl}${role === "reseller" ? "/reseller/topup" : "/dashboard/topup"}?txId=${txId}`
    };

    const resp = await fetch(`${onePayApi}/v3/checkout/link/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': appToken || '' 
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json() as any;

    if (!resp.ok || data.status !== 200) {
      console.error("OnePay Validation Error:", data);
      const exactError = data.error ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error)) : '';
      throw new BadRequestException(`OnePay error: ${data.message} - ${exactError}`);
    }

    if (data.data?.ipg_transaction_id) {
       await this.db.update(paymentTransactions)
         .set({ gatewayReference: data.data.ipg_transaction_id })
         .where(eq(paymentTransactions.id, txId));
    }

    return { transactionId: txId, redirectUrl: data.data?.gateway?.redirect_url };
  }

  // ── Handle OnePay Webhook Callback ────────────────────────────────────────
  async handleOnePayCallback(payload: any) {
    const gatewayRef = payload.transaction_id;
    if (!gatewayRef) return { received: false };

    const [tx] = await this.db.select().from(paymentTransactions)
      .where(eq(paymentTransactions.gatewayReference, gatewayRef));
    
    if (!tx || tx.status !== 'pending') return { received: true };

    const appId = (this.config.get<string>('onePay.appId') || '').trim();
    const appToken = (this.config.get<string>('onePay.appToken') || '').trim();
    const onePayApi = (this.config.get<string>('onePay.apiUrl') || '').trim();

    try {
      const verifyResp = await fetch(`${onePayApi}/v3/transaction/status/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': appToken
        },
        body: JSON.stringify({
          app_id: appId,
          onepay_transaction_id: gatewayRef
        })
      });

      const verifyData = await verifyResp.json() as any;

      if (verifyResp.ok && verifyData.status === 200 && verifyData.data?.status === true) {
        // Payment verified successful. Auto-approve it.
        await this.approveTransaction(tx.id, 'SYSTEM_ONEPAY', 'super_admin');
      } else if (payload.status_message === 'FAILED') {
        await this.db.update(paymentTransactions).set({ status: 'failed' }).where(eq(paymentTransactions.id, tx.id));
      }
    } catch (e) {
      console.error('OnePay verification failed:', e);
    }

    return { received: true };
  }

  // ── Upload slip URL to a pending transaction ──────────────────────────────
  async attachSlip(txId: string, slipUrl: string, callerId: string) {
    const [tx] = await this.db
      .select()
      .from(paymentTransactions)
      .where(and(eq(paymentTransactions.id, txId), eq(paymentTransactions.accountId, callerId)));

    if (!tx) throw new NotFoundException('Transaction not found');
    if (tx.status !== 'pending') throw new BadRequestException('Transaction is no longer pending');

    await this.db
      .update(paymentTransactions)
      .set({ slipUrl, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, txId));

    return { message: 'Slip uploaded. Awaiting approval.' };
  }

  // ── Admin/Reseller approves a payment and credits the account ────────────
  async approveTransaction(txId: string, approverId: string, approverRole: string) {
    return await this.db.transaction(async (tx: any) => {
      const [payTx] = await tx
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.id, txId));

      if (!payTx) throw new NotFoundException('Transaction not found');
      if (payTx.status !== 'pending') throw new BadRequestException('Transaction already processed');

      const [customer] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.id, payTx.accountId));

      if (!customer) throw new NotFoundException('Customer account not found');

      // Verify approver has permission over this account
      if (approverRole !== 'super_admin' && customer.parentId !== approverId) {
        throw new ForbiddenException('You cannot approve this transaction');
      }

      const [pkg] = await tx
        .select()
        .from(packages)
        .where(eq(packages.id, payTx.packageId));

      if (!pkg) throw new NotFoundException('Package not found');

      // If a reseller is approving, they must have enough credits to transfer
      if (approverRole === 'reseller') {
        const [reseller] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, approverId));
          
        const resellerBalanceBefore = parseFloat(reseller.creditBalance);
        if (resellerBalanceBefore < pkg.creditAmount) {
          throw new BadRequestException('Insufficient wholesale balance to approve this top-up. Please top-up your reseller account first.');
        }

        const resellerBalanceAfter = resellerBalanceBefore - pkg.creditAmount;

        // Deduct from reseller
        await tx
          .update(accounts)
          .set({ creditBalance: sql`${accounts.creditBalance} - ${pkg.creditAmount}` })
          .where(eq(accounts.id, approverId));

        // Log reseller transfer
        await tx.insert(creditTransactions).values({
          id: uuidv4(),
          accountId: approverId,
          type: 'transfer',
          amount: pkg.creditAmount.toFixed(4),
          balanceBefore: resellerBalanceBefore.toFixed(4),
          balanceAfter: resellerBalanceAfter.toFixed(4),
          description: `Transfer to customer ${customer.name} (Package: ${pkg.name})`,
          referenceId: txId,
        });
      }

      // Credit the customer
      const customerBalanceBefore = parseFloat(customer.creditBalance);
      const customerBalanceAfter = customerBalanceBefore + pkg.creditAmount;

      await tx
        .update(accounts)
        .set({ 
          creditBalance: sql`${accounts.creditBalance} + ${pkg.creditAmount}`,
          lowBalanceNotified: false,
        })
        .where(eq(accounts.id, payTx.accountId));

      // Log customer topup
      await tx.insert(creditTransactions).values({
        id: uuidv4(),
        accountId: payTx.accountId,
        type: 'topup',
        amount: pkg.creditAmount.toFixed(4),
        balanceBefore: customerBalanceBefore.toFixed(4),
        balanceAfter: customerBalanceAfter.toFixed(4),
        description: `Package purchase: ${pkg.name}`,
        referenceId: txId,
      });

      await tx
        .update(paymentTransactions)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(paymentTransactions.id, txId));

      return { message: 'Payment approved. Credits added.', creditsAdded: pkg.creditAmount };
    });
  }

  // ── Reject a payment transaction ─────────────────────────────────────────
      // -- Cancel a payment -----------------------------------------------------
  async cancelTransaction(txId: string, callerId: string, callerRole: string) {
    const [payTx] = await this.db.select().from(paymentTransactions).where(eq(paymentTransactions.id, txId));
    if (!payTx) throw new NotFoundException('Transaction not found');
    if (payTx.status !== 'pending') throw new BadRequestException('Transaction already processed or canceled');
    if (callerRole !== 'super_admin') {
      if (payTx.accountId !== callerId) {
        const [customer] = await this.db.select().from(accounts).where(eq(accounts.id, payTx.accountId));
        if (!customer || customer.parentId !== callerId) throw new ForbiddenException('You cannot cancel this transaction');
      }
    }
    await this.db.update(paymentTransactions).set({ status: 'canceled', updatedAt: new Date() }).where(eq(paymentTransactions.id, txId));
    return { message: 'Transaction canceled' };
  }
  async rejectTransaction(txId: string, notes: string, approverId: string, approverRole: string) {
    const [payTx] = await this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.id, txId));

    if (!payTx) throw new NotFoundException('Transaction not found');
    if (payTx.status !== 'pending') throw new BadRequestException('Transaction already processed');

    if (approverRole !== 'super_admin') {
      const [customer] = await this.db
        .select()
        .from(accounts)
        .where(eq(accounts.id, payTx.accountId));
      if (customer?.parentId !== approverId) {
        throw new ForbiddenException('You cannot reject this transaction');
      }
    }

    await this.db
      .update(paymentTransactions)
      .set({ status: 'rejected', notes, updatedAt: new Date() })
      .where(eq(paymentTransactions.id, txId));

    return { message: 'Transaction rejected' };
  }

  // ── List payment transactions ─────────────────────────────────────────────
  async getTransactions(callerId: string, callerRole: string, type?: string) {
    const cols = {
      id: paymentTransactions.id,
      accountId: paymentTransactions.accountId,
      accountName: accounts.name,
      packageId: paymentTransactions.packageId,
      packageName: packages.name,
      amount: paymentTransactions.amount,
      paymentMethod: paymentTransactions.paymentMethod,
      status: paymentTransactions.status,
      slipUrl: paymentTransactions.slipUrl,
      notes: paymentTransactions.notes,
      createdAt: paymentTransactions.createdAt,
    };

    if (callerRole === 'super_admin') {
      return this.db
        .select(cols)
        .from(paymentTransactions)
        .leftJoin(accounts, eq(paymentTransactions.accountId, accounts.id))
        .leftJoin(packages, eq(paymentTransactions.packageId, packages.id))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(200);
    }

    if (callerRole === 'reseller' && type !== 'own') {
      const customers = await this.db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.parentId, callerId));

      const customerIds = customers.map((c: any) => c.id);
      if (customerIds.length === 0) return [];

      return this.db
        .select(cols)
        .from(paymentTransactions)
        .leftJoin(accounts, eq(paymentTransactions.accountId, accounts.id))
        .leftJoin(packages, eq(paymentTransactions.packageId, packages.id))
        .where(sql`${paymentTransactions.accountId} IN (${sql.join(customerIds.map((id: string) => sql`${id}`), sql`, `)})`)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(200);
    }

    // Customer: own transactions only
    return this.db
      .select(cols)
      .from(paymentTransactions)
      .leftJoin(accounts, eq(paymentTransactions.accountId, accounts.id))
      .leftJoin(packages, eq(paymentTransactions.packageId, packages.id))
      .where(eq(paymentTransactions.accountId, callerId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(50);
  }

  // ── Get single invoice details ────────────────────────────────────────────
  async getInvoiceDetails(txId: string, callerId: string, callerRole: string) {
    const [tx] = await this.db
      .select({
        id: paymentTransactions.id,
        amount: paymentTransactions.amount,
        status: paymentTransactions.status,
        paymentMethod: paymentTransactions.paymentMethod,
        createdAt: paymentTransactions.createdAt,
        accountName: accounts.name,
        accountEmail: accounts.email,
        accountPhone: accounts.phone,
        accountId: accounts.id,
        accountParentId: accounts.parentId,
        packageName: packages.name,
        packageCredits: packages.creditAmount,
      })
      .from(paymentTransactions)
      .leftJoin(accounts, eq(paymentTransactions.accountId, accounts.id))
      .leftJoin(packages, eq(paymentTransactions.packageId, packages.id))
      .where(eq(paymentTransactions.id, txId));

    if (!tx) {
      throw new NotFoundException('Transaction not found');
    }

    // Security check
    if (callerRole !== 'super_admin' && tx.accountId !== callerId && tx.accountParentId !== callerId) {
      throw new ForbiddenException('You cannot view this invoice');
    }

    const companyConfig = this.config.get('company');

    return {
      transaction: tx,
      company: companyConfig,
    };
  }
}


