import { Inject, Injectable } from '@nestjs/common';
import { eq, count, sum, sql, and, inArray } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from 'src/database/drizzle.module';
import * as schema from 'src/database/schema';

function getDateCondition(column: any, range?: string, defaultDays: string = '30') {
    if (range === 'all' || range === 'lifetime') return undefined;
    const days = parseInt(range || defaultDays, 10);
    return sql`${column} >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`;
}

@Injectable()
export class StatsService {
    constructor(@Inject(DRIZZLE) private readonly db: MySql2Database<typeof schema>) {}

    async getDashboardStats(accountId: string, range?: string) {
        const [counts] = await this.db
            .select({
                messages: count(),
                delivered: sum(sql`CASE WHEN status = 'delivered' OR status = 'sent' THEN 1 ELSE 0 END`),
            })
            .from(schema.messages)
            .where(and(eq(schema.messages.accountId, accountId), getDateCondition(schema.messages.createdAt, range, '7')));

        const [contactsCount] = await this.db
            .select({ count: count() })
            .from(schema.contacts)
            .where(eq(schema.contacts.accountId, accountId));

        const [campaignsCount] = await this.db
            .select({ count: count() })
            .from(schema.campaigns)
            .where(eq(schema.campaigns.accountId, accountId));

        const dailySmsRaw = await this.db
            .select({
                date: sql`DATE(created_at)`.as('date'),
                count: count().as('count')
            })
            .from(schema.messages)
            .where(
                and(
                    eq(schema.messages.accountId, accountId),
                    getDateCondition(schema.messages.createdAt, range, '7')
                )
            )
            .groupBy(sql`DATE(created_at)`)
            .orderBy(sql`DATE(created_at) ASC`);

        return {
            messages: Number(counts.messages) || 0,
            delivered: Number(counts.delivered) || 0,
            contacts: Number(contactsCount.count) || 0,
            campaigns: Number(campaignsCount.count) || 0,
            dailySms: dailySmsRaw.map(r => ({ date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date), val: Number(r.count) || 0 }))
        };
    }

    async getAdminDashboardStats(range?: string) {
        const [revenueResult] = await this.db
            .select({ total: sum(schema.paymentTransactions.amount) })
            .from(schema.paymentTransactions)
            .where(and(eq(schema.paymentTransactions.status, 'completed'), getDateCondition(schema.paymentTransactions.createdAt, range, '30')));
        
        const totalGrossRevenue = parseFloat(revenueResult.total as string || '0');

        const [smsResult] = await this.db
            .select({ 
                delivered: sum(sql`CASE WHEN status IN ('delivered', 'sent') THEN 1 ELSE 0 END`),
                failed: sum(sql`CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END`),
                total: count()
            })
            .from(schema.messages).where(getDateCondition(schema.messages.createdAt, range, '30'));
        
        const totalDeliveredSms = Number(smsResult.delivered) || 0;
        const totalFailedSms = Number(smsResult.failed) || 0;
        const totalSms = Number(smsResult.total) || 0;
        
        // Fetch dynamic base cost from settings
        const [costSetting] = await this.db.select()
            .from(schema.systemSettings)
            .where(and(eq(schema.systemSettings.category, 'gateway'), eq(schema.systemSettings.key, 'hutch_base_cost')));
        
        const baseCost = costSetting?.value ? Number(costSetting.value) : 0.30;
        const totalCost = totalDeliveredSms * baseCost;
        const totalProfit = totalGrossRevenue - totalCost;

        const dailyRevenueRaw = await this.db
            .select({
                date: sql`DATE(created_at)`.as('date'),
                revenue: sum(schema.paymentTransactions.amount).as('revenue')
            })
            .from(schema.paymentTransactions)
            .where(
                and(eq(schema.paymentTransactions.status, 'completed'), getDateCondition(schema.paymentTransactions.createdAt, range, '30'))
            )
            .groupBy(sql`DATE(created_at)`)
            .orderBy(sql`DATE(created_at) ASC`);

        const dailySmsRaw = await this.db
            .select({
                date: sql`DATE(created_at)`.as('date'),
                delivered: sum(sql`CASE WHEN status IN ('delivered', 'sent') THEN 1 ELSE 0 END`).as('delivered'),
                failed: sum(sql`CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END`).as('failed'),
            })
            .from(schema.messages)
            .where(getDateCondition(schema.messages.createdAt, range, '30'))
            .groupBy(sql`DATE(created_at)`)
            .orderBy(sql`DATE(created_at) ASC`);

        return {
            overall: {
                totalGrossRevenue,
                totalCost,
                totalProfit,
                totalDeliveredSms,
                totalFailedSms,
                totalSms,
            },
            dailyRevenue: dailyRevenueRaw.map(r => ({
                date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
                revenue: parseFloat(r.revenue as string || '0')
            })),
            dailySms: dailySmsRaw.map(r => ({
                date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
                delivered: parseInt(r.delivered as string || '0'),
                failed: parseInt(r.failed as string || '0')
            }))
        };
    }

    async getResellerStats(resellerId: string, range?: string) {
        const customers = await this.db
            .select({ id: schema.accounts.id, name: schema.accounts.name })
            .from(schema.accounts)
            .where(eq(schema.accounts.parentId, resellerId));

        const customerIds = customers.map((c: any) => c.id);

        if (customerIds.length === 0) {
            return {
                overall: { totalSms: 0, totalDelivered: 0, totalFailed: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0, totalCustomers: 0, activeCustomers: 0 },
                dailySms: [],
                topCustomers: [],
            };
        }

        const [smsResult] = await this.db
            .select({
                total: count(),
                delivered: sum(sql`CASE WHEN status IN ('delivered', 'sent') THEN 1 ELSE 0 END`),
                failed: sum(sql`CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END`),
            })
            .from(schema.messages)
            .where(and(inArray(schema.messages.accountId, customerIds), getDateCondition(schema.messages.createdAt, range, '30')));

        const totalSms = Number(smsResult.total) || 0;
        const totalDelivered = Number(smsResult.delivered) || 0;
        const totalFailed = Number(smsResult.failed) || 0;

        // Retail Revenue: Sum of packages bought by customers from this reseller
        const [revenueResult] = await this.db
            .select({ total: sum(schema.paymentTransactions.amount) })
            .from(schema.paymentTransactions)
            .where(
                and(
                    and(eq(schema.paymentTransactions.status, 'completed'), getDateCondition(schema.paymentTransactions.createdAt, range, '30')),
                    inArray(schema.paymentTransactions.accountId, customerIds)
                )
            );
        const totalRevenue = parseFloat(revenueResult.total as string || '0');

        // Wholesale Cost: Sum of packages bought by this reseller from admin
        const [costResult] = await this.db
            .select({ total: sum(schema.paymentTransactions.amount) })
            .from(schema.paymentTransactions)
            .where(
                and(
                    eq(schema.paymentTransactions.status, 'completed'),
                    eq(schema.paymentTransactions.accountId, resellerId),
                    getDateCondition(schema.paymentTransactions.createdAt, range, '30')
                )
            );
        const totalCost = parseFloat(costResult.total as string || '0');
        const totalProfit = totalRevenue - totalCost;

        const [activeResult] = await this.db
            .select({ count: count() })
            .from(schema.accounts)
            .where(
                and(
                    eq(schema.accounts.parentId, resellerId),
                    eq(schema.accounts.status, 'active')
                )
            );

        const dailySmsRaw = await this.db
            .select({
                date: sql`DATE(created_at)`.as('date'),
                delivered: sum(sql`CASE WHEN status IN ('delivered', 'sent') THEN 1 ELSE 0 END`).as('delivered'),
                failed: sum(sql`CASE WHEN status IN ('failed', 'rejected') THEN 1 ELSE 0 END`).as('failed'),
            })
            .from(schema.messages)
            .where(
                and(
                    inArray(schema.messages.accountId, customerIds),
                    getDateCondition(schema.messages.createdAt, range, '30')
                )
            )
            .groupBy(sql`DATE(created_at)`)
            .orderBy(sql`DATE(created_at) ASC`);

        const topCustomersRaw = await this.db
            .select({
                accountId: schema.messages.accountId,
                accountName: schema.accounts.name,
                total: count(),
                delivered: sum(sql`CASE WHEN ${schema.messages.status} IN ('delivered', 'sent') THEN 1 ELSE 0 END`),
            })
            .from(schema.messages)
            .leftJoin(schema.accounts, eq(schema.messages.accountId, schema.accounts.id))
            .where(and(inArray(schema.messages.accountId, customerIds), getDateCondition(schema.messages.createdAt, range, '30')))
            .groupBy(schema.messages.accountId, schema.accounts.name)
            .orderBy(sql`count(*) DESC`)
            .limit(5);

        return {
            overall: {
                totalSms,
                totalDelivered,
                totalFailed,
                totalRevenue,
                totalProfit,
                totalCustomers: customers.length,
                activeCustomers: Number(activeResult.count) || 0,
            },
            dailySms: dailySmsRaw.map((r: any) => ({
                date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date),
                delivered: parseInt(r.delivered || '0'),
                failed: parseInt(r.failed || '0'),
            })),
            topCustomers: topCustomersRaw.map((r: any) => ({
                accountId: r.accountId,
                accountName: r.accountName,
                total: Number(r.total),
                delivered: parseInt(r.delivered || '0'),
            })),
        };
    }
}
