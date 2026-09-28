import { Injectable, Logger } from "@nestjs/common";
import { SmsPayload, SmsProvider, SmsResult } from "./provider.interface";


@Injectable()
export class HutchProvider implements SmsProvider{

  name = 'hutch';
  
  private readonly logger = new 
  Logger(HutchProvider.name);

  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly defaultSenderId: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(config: {
    apiUrl  : string;
    username: string;
    password: string;
    senderId: string;
  }){
    this.baseUrl = config.apiUrl || 'https://bsms.hutch.lk/api';
    this.username = config.username;
    this.password = config.password;
    this.defaultSenderId = config.senderId;
  }

  private async login(): Promise<void> {
    this.logger.log('Logging in to Provider API...');

    const resp = await fetch (`${this.baseUrl}/login`, 
      {
        method: 'POST',
        headers:{
          'Content-Type': 'application/json',
          'X-API-VERSION': 'v1',
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      }
    );

    if(!resp.ok){
      throw new Error(`Provider Login Failed: HTTP ${resp.status}`);
    }

    const data = await resp.json() as any;

      this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.logger.log('Provider API login successful.');
  }


  private async renewToken(): Promise<void> {
    if (!this.refreshToken){
      return this.login();
    }

    this.logger.log('Renewing Provider API access token...');
    
    const resp = await fetch(`${this.baseUrl}/token/accessToken`,{
      method: 'GET',
      headers:{
        'Content-Type': 'application/json',
        'X-API-VERSION': 'v1',
        'Authorization': `Bearer ${this.refreshToken}`
      },
    });

    if(resp.status === 401){
      return this.login();
    }

    const data = await resp.json() as any;

    this.accessToken = data.accessToken;
  }

  private async executeSend(payload: SmsPayload): Promise<Response>{

    const body = {
      campaignName: 'API_SEND',
      mask : payload.from ?? this.defaultSenderId,
      numbers: payload.to.replace('+',''),
      content: payload.body,
      deliveryReportRequest: true 
    };

    return fetch(`${this.baseUrl}/sendsms`, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
        'X-API-VERSION': 'v1',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(body)
    });

  }

  async send(payload: SmsPayload): Promise<SmsResult> {

    try{

      if(!this.accessToken){
        await this.login();
      }

      let resp = await this.executeSend(payload);

      if(resp.status === 401){
        this.logger.log('Access token expired, renewing...');
        await this.renewToken();
        resp = await this.executeSend(payload);
      }

      const text = await resp.text();

      if(!resp.ok){
        return {success: false, error: `HTTP ${resp.status}: ${text}`};
      }

      const data = JSON.parse(text);

      if(data.serverRef){
        return{
          success: true,
          providerMessageId: String(data.serverRef),
          providerResponse: data,
        };
      }

      return {success: false, error: 'Missing serverRef from Provider',
        providerResponse: data};
      }catch(err:any){
      this.logger.error('Error sending SMS via Provider', err);
      return {success: false, error: err.message};
    }

  }

  private async executeSendBatch(payloads: SmsPayload[]): Promise<Response> {
    const body = payloads.map((payload) => ({
      campaignName: 'API_BULK_SEND',
      mask: payload.from ?? this.defaultSenderId,
      numbers: payload.to.replace('+', ''),
      content: payload.body,
      deliveryReportRequest: true
    }));

    return fetch(`${this.baseUrl}/sendsms/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-VERSION': 'v1',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(body)
    });
  }

  async sendBatch(payloads: SmsPayload[]): Promise<SmsResult[]> {
    try {
      if (!this.accessToken) {
        await this.login();
      }

      let resp = await this.executeSendBatch(payloads);

      if (resp.status === 401) {
        this.logger.log('Access token expired, renewing...');
        await this.renewToken();
        resp = await this.executeSendBatch(payloads);
      }

      const text = await resp.text();

      if (!resp.ok) {
        return payloads.map(() => ({ success: false, error: `HTTP ${resp.status}: ${text}` }));
      }

      const data = JSON.parse(text);

      // If Hutch returns an array of objects
      if (Array.isArray(data)) {
        return payloads.map((_, index) => {
          const item = data[index] || {};
          if (item.serverRef) {
            return { success: true, providerMessageId: String(item.serverRef), providerResponse: item };
          }
          return { success: false, error: 'Missing serverRef', providerResponse: item };
        });
      } 
      
      // If Hutch returns a single object with one serverRef for the batch
      return payloads.map(() => {
        if (data.serverRef) {
           return { success: true, providerMessageId: String(data.serverRef), providerResponse: data };
        }
        return { success: false, error: 'Missing serverRef from Provider bulk', providerResponse: data };
      });

    } catch (err: any) {
      this.logger.error('Error sending Bulk SMS via Provider', err);
      return payloads.map(() => ({ success: false, error: err.message }));
    }
  }

}