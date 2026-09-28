import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

const cookieExtractor = (req: any) => {
  let token = null;
  if (req?.cookies) {
    token = req.cookies['access_token'];
  }
  // Fallback to Bearer token if not found in cookies (for API keys/postman)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly  configService: ConfigService,
    private readonly  authService: AuthService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') as string,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) throw new UnauthorizedException();
    
    if(user.status !== 'active') {
      throw new ForbiddenException('Your account has been suspended or is pending.');
    }
    return user;
  }
}