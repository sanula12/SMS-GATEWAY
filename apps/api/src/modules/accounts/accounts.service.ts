import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/drizzle.module';
import { accounts, creditTransactions } from '../../database/schema';
import { CreateAccountDto, UpdateAccountDto, TopUpCreditsDto, TransferCreditsDto } from './dto';

@Injectable()
export class AccountsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── Get all accounts the caller is allowed to see ──────────────────────────
  async findAll(callerId: string, callerRole: string) {
    if (callerRole === 'super_admin') {
      return this.db
        .select({
          id: accounts.id,
          name: accounts.name,
          email: accounts.email,
          role: accounts.role,
          status: accounts.status,
          parentId: accounts.parentId,
          creditBalance: accounts.creditBalance,
          registrationSource: accounts.registrationSource,
          createdAt: accounts.createdAt,
        })
        .from(accounts)
        .orderBy(desc(accounts.createdAt));
    }

    // Resellers only see their own customers
    return this.db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        status: accounts.status,
        parentId: accounts.parentId,
        creditBalance: accounts.creditBalance,
        registrationSource: accounts.registrationSource,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.parentId, callerId))
      .orderBy(desc(accounts.createdAt));
  }

  // ── Get single account ─────────────────────────────────────────────────────
  async findOne(id: string, callerId: string, callerRole: string) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Account not found');

    const account = result[0];

    // Customers can only see themselves
    if (callerRole === 'customer' && account.id !== callerId) {
      throw new ForbiddenException();
    }

    // Resellers can only see their own children
    if (callerRole === 'reseller' && account.parentId !== callerId && account.id !== callerId) {
      throw new ForbiddenException();
    }

    const { password, ...safe } = account;
    return safe;
  }

  // ── Admin or reseller creates a new account ────────────────────────────────
  async create(dto: CreateAccountDto, callerId: string, callerRole: string) {
    const existing = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, dto.email))
      .limit(1);

    if (existing.length > 0) throw new ConflictException('Email already exists');

    // Resellers can only create customers, not other resellers
    if (callerRole === 'reseller' && dto.role === 'reseller') {
      throw new ForbiddenException('Resellers cannot create other resellers');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const id = uuidv4();

    await this.db.insert(accounts).values({
      id,
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      role: dto.role ?? 'customer',
      status: 'active',
      parentId: callerId,
      registrationSource: 'reseller_created',
      creditBalance: '0',
    });

    const newAccount = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    const { password, ...safe } = newAccount[0];
    return safe;
  }

  // ── Update account ─────────────────────────────────────────────────────────
  // ── Update account ─────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateAccountDto, callerId: string, callerRole: string) {
    await this.findOne(id, callerId, callerRole);

    // Security: Only Admins can change account statuses and roles!
    if ((dto.status || dto.role) && callerRole !== 'super_admin') {
      throw new ForbiddenException('Only admins can change account status and role');
    }

    const updateData: any = { ...dto, updatedAt: new Date() };

    // Security: If they are trying to update their password, we MUST encrypt it!
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 12);
    }

    await this.db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id));

    return this.findOne(id, callerId, callerRole);
  }

  // ── Top up credits (admin only) ────────────────────────────────────────────
  async topUpCredits(id: string, dto: TopUpCreditsDto, callerId: string) {
    return await this.db.transaction(async (tx: any) => {
      const [account] = await tx.select().from(accounts).where(eq(accounts.id, id));
      if (!account) throw new NotFoundException('Account not found');

      const balanceBefore = parseFloat(account.creditBalance);
      const balanceAfter = balanceBefore + dto.amount;

      const [updateResult] = await tx
        .update(accounts)
        .set({ 
          creditBalance: sql`${accounts.creditBalance} + ${dto.amount}`,
          lowBalanceNotified: false
        })
        .where(eq(accounts.id, id));

      if (updateResult.affectedRows === 0) throw new NotFoundException('Account not found');

      await tx.insert(creditTransactions).values({
        id: uuidv4(),
        accountId: id,
        type: 'topup',
        amount: dto.amount.toFixed(4),
        balanceBefore: balanceBefore.toFixed(4),
        balanceAfter: balanceAfter.toFixed(4),
        description: dto.description ?? 'Manual top-up',
        referenceId: callerId,
      });

      return { creditBalance: balanceAfter.toFixed(4) };
    });
  }

  // ── Transfer credits (reseller to customer) ────────────────────────────────
  async transferCredits(dto: TransferCreditsDto, callerId: string, callerRole: string) {
    return await this.db.transaction(async (tx: any) => {
      const [sender] = await tx.select().from(accounts).where(eq(accounts.id, callerId));
      if (!sender) throw new NotFoundException('Sender account not found');

      const senderBalance = parseFloat(sender.creditBalance);
      if (senderBalance < dto.amount) {
        throw new BadRequestException('Insufficient credit balance');
      }

      const [recipient] = await tx.select().from(accounts).where(eq(accounts.id, dto.toAccountId));
      if (!recipient) throw new NotFoundException('Recipient account not found');

      if (callerRole === 'reseller' && recipient.parentId !== callerId) {
        throw new ForbiddenException('You can only transfer credits to your own customers');
      }

      const recipientBalance = parseFloat(recipient.creditBalance);
      const newSenderBalance = senderBalance - dto.amount;
      const newRecipientBalance = recipientBalance + dto.amount;

      const [senderUpdate] = await tx
        .update(accounts)
        .set({ creditBalance: sql`${accounts.creditBalance} - ${dto.amount}` })
        .where(and(eq(accounts.id, callerId), sql`${accounts.creditBalance} >= ${dto.amount}`));

      if (senderUpdate.affectedRows === 0) {
        throw new BadRequestException('Insufficient credit balance during transfer');
      }

      await tx
        .update(accounts)
        .set({ 
          creditBalance: sql`${accounts.creditBalance} + ${dto.amount}`,
          lowBalanceNotified: false
        })
        .where(eq(accounts.id, dto.toAccountId));

      await tx.insert(creditTransactions).values([
        {
          id: uuidv4(),
          accountId: callerId,
          type: 'transfer',
          amount: (-dto.amount).toFixed(4),
          balanceBefore: senderBalance.toFixed(4),
          balanceAfter: newSenderBalance.toFixed(4),
          description: dto.description ?? `Transfer to ${recipient.name}`,
          referenceId: dto.toAccountId,
        },
        {
          id: uuidv4(),
          accountId: dto.toAccountId,
          type: 'transfer',
          amount: dto.amount.toFixed(4),
          balanceBefore: recipientBalance.toFixed(4),
          balanceAfter: newRecipientBalance.toFixed(4),
          description: dto.description ?? `Transfer from ${sender.name}`,
          referenceId: callerId,
        },
      ]);

      return {
        message: 'Credits transferred successfully',
        senderBalance: newSenderBalance.toFixed(4),
      };
    });
  }

  // ── Credit transaction history ─────────────────────────────────────────────
  async getCreditHistory(accountId: string, callerId: string, callerRole: string) {
    await this.findOne(accountId, callerId, callerRole);

    return this.db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.accountId, accountId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(100);
  }
}