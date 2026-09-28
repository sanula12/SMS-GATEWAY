export interface SmsPayload {
  to: string;
  from?: string;
  body: string;
}

export interface SmsResult {
  success: boolean;
  providerMessageId?: string;
  providerResponse?: any;
  error?: string;
  segmentCount?: number;
}

export interface SmsProvider {
  name: string;
  send(payload: SmsPayload): Promise<SmsResult>;
  sendBatch?(payloads: SmsPayload[]): Promise<SmsResult[]>;
}