export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME ?? 'smsgate',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? '',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-this-secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    fromAddress: process.env.EMAIL_FROM ?? 'SMSGate <onboarding@resend.dev>',
  },
  company: {
    name: process.env.COMPANY_NAME ?? 'V-SMS (Pvt) Ltd',
    address: process.env.COMPANY_ADDRESS ?? 'Colombo, Sri Lanka',
    taxId: process.env.COMPANY_TAX_ID ?? '',
    email: process.env.COMPANY_EMAIL ?? 'support@vsms.lk',
  },
  bunny: {
    storageZone: process.env.BUNNY_STORAGE_ZONE ?? '',
    apiKey: process.env.BUNNY_API_KEY ?? '',
    region: process.env.BUNNY_REGION ?? '',
    pullZoneUrl: process.env.BUNNY_PULL_ZONE_URL ?? '',
  },
  onePay: {
    appId: process.env.ONEPAY_APP_ID ?? '',
    hashSalt: process.env.ONEPAY_HASH_SALT ?? '',
    appToken: process.env.ONEPAY_APP_TOKEN ?? '',
    apiUrl: process.env.ONEPAY_API_URL ?? 'https://api.onepay.lk',
  },
sms: {
  defaultProvider: process.env.SMS_DEFAULT_PROVIDER ?? 'hutch',
  hutch: {
    apiUrl: process.env.HUTCH_API_URL,
    username: process.env.HUTCH_USERNAME,
    password: process.env.HUTCH_PASSWORD,
    senderId: process.env.HUTCH_SENDER_ID,
  },
  generic: {
    url: process.env.GENERIC_SMS_URL,
    fieldTo: process.env.GENERIC_SMS_FIELD_TO ?? 'to',
    fieldBody: process.env.GENERIC_SMS_FIELD_BODY ?? 'message',
    fieldFrom: process.env.GENERIC_SMS_FIELD_FROM ?? 'from',
    successField: process.env.GENERIC_SMS_SUCCESS_FIELD,
    successValue: process.env.GENERIC_SMS_SUCCESS_VALUE,
    messageIdField: process.env.GENERIC_SMS_MESSAGE_ID_FIELD,
  },
},
});