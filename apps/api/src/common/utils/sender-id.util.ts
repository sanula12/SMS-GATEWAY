import { BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { senderIds } from '../../database/schema';

/**
 * Validates and resolves the final Sender ID to use.
 * If requestedSenderId is provided, verifies ownership and approval.
 * If missing, falls back to the account's default approved Sender ID.
 * Throws BadRequestException if missing or invalid.
 */
export async function resolveSenderId(db: any, accountId: string, requestedSenderId?: string): Promise<string> {
  if (requestedSenderId) {
    const [sender] = await db
      .select({ senderId: senderIds.senderId })
      .from(senderIds)
      .where(
        and(
          eq(senderIds.accountId, accountId),
          eq(senderIds.senderId, requestedSenderId),
          eq(senderIds.status, 'approved')
        )
      )
      .limit(1);

    if (!sender) {
      throw new BadRequestException(`Sender ID '${requestedSenderId}' is invalid, not approved, or does not belong to your account.`);
    }
    return sender.senderId;
  } else {
    const [defaultSender] = await db
      .select({ senderId: senderIds.senderId })
      .from(senderIds)
      .where(
        and(
          eq(senderIds.accountId, accountId),
          eq(senderIds.isDefault, true),
          eq(senderIds.status, 'approved')
        )
      )
      .limit(1);

    if (!defaultSender) {
      throw new BadRequestException('Sender ID is required. Please specify one or set a default in your dashboard.');
    }
    return defaultSender.senderId;
  }
}
