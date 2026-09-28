import { Injectable, Logger } from '@nestjs/common';
import { SmsProvider, SmsPayload, SmsResult } from './provider.interface';

export interface GenericHttpConfig {
  name: string;
  url: string;
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  // Map our fields to the provider's field names
  fieldMap: {
    to: string;
    from?: string;
    body: string;
  };
  // Static extra fields the provider requires
  extraFields?: Record<string, string>;
  // How to read the response
  responseMap: {
    successField?: string;
    successValue?: string;
    messageIdField?: string;
  };
}

@Injectable()
export class GenericHttpProvider implements SmsProvider {
  name: string;
  private readonly logger = new Logger(GenericHttpProvider.name);
  private config: GenericHttpConfig;

  constructor(config: GenericHttpConfig) {
    this.config = config;
    this.name = config.name;
  }

  async send(payload: SmsPayload): Promise<SmsResult> {
    try {
      const body: Record<string, string> = {
        [this.config.fieldMap.to]: payload.to,
        [this.config.fieldMap.body]: payload.body,
        ...this.config.extraFields,
      };

      if (payload.from && this.config.fieldMap.from) {
        body[this.config.fieldMap.from] = payload.from;
      }

      const response = await fetch(this.config.url, {
        method: this.config.method,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...this.config.headers,
        },
        body: new URLSearchParams(body),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          providerResponse: data,
        };
      }

      // Check success field if configured
      if (this.config.responseMap.successField) {
        const isSuccess = String(data[this.config.responseMap.successField]) 
          === String(this.config.responseMap.successValue ?? 'true');

        if (!isSuccess) {
          return {
            success: false,
            error: JSON.stringify(data),
            providerResponse: data,
          };
        }
      }

      return {
        success: true,
        providerMessageId: this.config.responseMap.messageIdField
          ? data[this.config.responseMap.messageIdField]
          : undefined,
        providerResponse: data,
      };
    } catch (error: any) {
      this.logger.error(`${this.name} send error`, error);
      return { success: false, error: error.message };
    }
  }
}