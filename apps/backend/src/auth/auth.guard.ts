import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedRequest } from './authenticated-request';
import { SessionService } from './session.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const sessionId = request.cookies?.session_id;

    if (!sessionId) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.sessionService.findValid(sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    request.user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
    };

    return true;
  }
}
