import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProvider } from './provider.interface';
import { HutchProvider } from './hutch.provider';
import { GenericHttpProvider } from './generic-http.provider';

@Injectable()
export class SmsProviderFactory {
  private providers: Map<string, SmsProvider> = new Map();
  private defaultProvider: string;

  constructor(private config: ConfigService) {
    this.defaultProvider = config.get<string>('sms.defaultProvider') ?? 'hutch';
    this.initProviders();
  }

  private initProviders() {
    // Hutch provider
    const hutchUsername = this.config.get<string>('sms.hutch.username');
    if (hutchUsername) {
      this.providers.set('hutch', new HutchProvider({
        apiUrl: this.config.get<string>('sms.hutch.apiUrl') || 'https://bsms.hutch.lk/api',
        username: hutchUsername,
        password: this.config.get<string>('sms.hutch.password') as string,
        senderId: this.config.get<string>('sms.hutch.senderId') as string,
      }));
    }

    // Generic HTTP provider (fallback / testing)
    const genericUrl = this.config.get<string>('sms.generic.url');
    if (genericUrl) {
      this.providers.set('generic', new GenericHttpProvider({
        name: 'generic',
        url: genericUrl,
        method: 'POST',
        headers: {},
        fieldMap: {
          to: this.config.get('sms.generic.fieldTo') ?? 'to',
          body: this.config.get('sms.generic.fieldBody') ?? 'message',
          from: this.config.get('sms.generic.fieldFrom') ?? 'from',
        },
        extraFields: {},
        responseMap: {
          successField: this.config.get('sms.generic.successField'),
          successValue: this.config.get('sms.generic.successValue'),
          messageIdField: this.config.get('sms.generic.messageIdField'),
        },
      }));
    }
  }

  getProvider(name?: string): SmsProvider {
    const providerName = name ?? this.defaultProvider;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `SMS provider "${providerName}" is not configured. ` +
        `Available: ${Array.from(this.providers.keys()).join(', ') || 'none'}`
      );
    }
    return provider;
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}