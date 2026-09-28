import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Inject
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/drizzle.module';
import { whitelabelSettings, accounts } from '../../database/schema';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly  db: any,
    private readonly  jwtService: JwtService,
    private readonly  configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    // Check if email already exists
    const existing = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already registered');
    }

    // Determine parent and registration source
    let parentId: string | null = null;
    let registrationSource: 'direct' | 'reseller_invite' | 'reseller_created' = 'direct';

    if (dto.referralCode) {
      const reseller = await this.db
        .select()
        .from(accounts)
        .where(eq(accounts.id, dto.referralCode))
        .limit(1);

      if (reseller.length > 0 && reseller[0].role === 'reseller') {
        parentId = reseller[0].id;
        registrationSource = 'reseller_invite';
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const id = uuidv4();

    await this.db.transaction(async (tx: any) => {
      await tx.insert(accounts).values({
        id,
        name: dto.name,
        email,
        password: hashedPassword,
        role: 'customer',
        status: 'active',
        parentId,
        registrationSource,
        creditBalance: '10', // 10 Free SMS points for testing
      });

      // Log the free signup bonus transaction
      const { creditTransactions } = require('../../database/schema');
      await tx.insert(creditTransactions).values({
        id: uuidv4(),
        accountId: id,
        type: 'topup',
        amount: '10',
        balanceBefore: '0',
        balanceAfter: '10',
        description: 'Signup Bonus - 10 Free SMS',
      });
    });

    const newUser = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    return this.generateTokens(newUser[0]);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);

    if (user.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const account = user[0];

    // TENANT ISOLATION LOGIC
    if (dto.domain) {
      const mainDomains = ['localhost', 'V SMS.lk', 'www.V SMS.lk', 'send.virgincareer.lk'];
      const rawDomain = dto.domain.split(':')[0]; // strip port for local dev
      
      if (!mainDomains.includes(rawDomain)) {
        // Look up the reseller who owns this domain
        const resellerSettings = await this.db
          .select()
          .from(whitelabelSettings)
          .where(eq(whitelabelSettings.domain, rawDomain))
          .limit(1);
          
        if (resellerSettings.length > 0) {
          const resellerId = resellerSettings[0].accountId;
          
          // The user MUST either be the Reseller themselves OR a customer of the Reseller
          if (account.id !== resellerId && account.parentId !== resellerId) {
            // Throw a very specific exception so the user knows WHY they are blocked
            throw new UnauthorizedException('Tenant Isolation: This account does not belong to this platform.');
          }
        }
      } else {
        // They are logging into the main domain (e.g. send.virgincareer.lk)
        // A customer that belongs to a reseller MUST log into their reseller's white-label domain.
        // Resellers and direct customers are allowed.
        if (account.role === 'customer' && account.parentId !== null) {
          throw new UnauthorizedException('Tenant Isolation: Please log in through your provider\'s specific portal.');
        }
      }
    }

    if (account.status === 'suspended') {
      throw new UnauthorizedException('Your account has been suspended');
    }

    const passwordMatch = await bcrypt.compare(dto.password, account.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(account);
  }

  async validateUserById(id: string) {
    const user = await this.db
      .select({
        id: accounts.id,
        name: accounts.name,
        email: accounts.email,
        role: accounts.role,
        status: accounts.status,
        parentId: accounts.parentId,
        creditBalance: accounts.creditBalance,
        phone: accounts.phone,
        timezone: accounts.timezone,
      })
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);

    return user.length > 0 ? user[0] : null;
  }

  async getProfile(userId: string) {
    const user = await this.validateUserById(userId);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private generateTokens(account: any) {
    const payload = {
      sub: account.id,
      email: account.email,
      role: account.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Sanitize — never return password
    const { password, ...safeAccount } = account;

    return {
      accessToken,
      refreshToken,
      user: safeAccount,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.validateUserById(payload.sub);
      if (!user) throw new UnauthorizedException('User not found');
      
      return this.generateTokens(user);
    } catch (error) {
      console.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
      
    }
  }
}