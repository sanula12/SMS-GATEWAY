import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.module';
import { resellerInquiries } from '../../database/schema';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class InquiriesService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
  ) {}

  async createInquiry(data: { name: string; company: string; email: string; phone?: string; message: string }) {
    const id = uuidv4();
    await this.db.insert(resellerInquiries).values({
      id,
      ...data,
      status: 'pending',
    });

    // In-app notification to all super admins
    this.notificationsService.notifySuperAdmins(
      'New Reseller Inquiry',
      `${data.name} from ${data.company} submitted a reseller inquiry.`,
      'inquiry',
    ).catch(e => console.error('Failed to dispatch inquiry notification', e));

    // Notify support asynchronously (fire and forget)
    this.emailService.sendEmail({
      to: 'support@virgincareer.lk',
      subject: `New Reseller Inquiry: ${data.company}`,
      html: `
        <h3>New Reseller Inquiry</h3>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Phone:</strong> ${data.phone || 'N/A'}</p>
        <hr/>
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
    }).catch(e => console.error('Failed to send inquiry email', e));

    return { id, success: true };
  }

  async getInquiries() {
    return this.db.query.resellerInquiries.findMany({
      orderBy: [desc(resellerInquiries.createdAt)],
    });
  }

  async updateStatus(id: string, status: 'pending' | 'reviewed' | 'contacted' | 'rejected') {
    await this.db.update(resellerInquiries)
      .set({ status })
      .where(eq(resellerInquiries.id, id));
    return { success: true };
  }
}
