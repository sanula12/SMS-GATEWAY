import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class ApiAuthGuard extends JwtAuthGuard implements CanActivate {
  
  constructor(private apiKeysService: ApiKeysService) {
    // This calls the constructor of JwtAuthGuard so we don't break human logins!
    super(); 
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    
    // 1. Look for an API key in the headers
    const apiKey = req.headers['x-api-key'];

    // 2. If a machine sent an API key...
    if (apiKey) {
      // Ask the database if the key is real and active
      const result = await this.apiKeysService.validateApiKey(apiKey);
      
      if (!result.valid) {
        throw new UnauthorizedException('Invalid or Revoked API key');
      }
      
      // Magic step: We inject a fake "User" into the request!
      // This tricks the rest of the application into thinking a real person is logged in.
      req.user = { 
        id: result.accountId, 
        role: 'machine', 
        permissions: result.permissions 
      };
      
      return true; // Let them through!
    }

    // 3. If there is NO API key... 
    // Fall back to the normal cookie check (for humans) by running the parent JwtAuthGuard!
    return super.canActivate(context) as Promise<boolean>;
  }
}


