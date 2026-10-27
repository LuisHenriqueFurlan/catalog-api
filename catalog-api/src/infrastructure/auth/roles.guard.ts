import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../domain/entities/user.entity.js';
import { AuthenticatedRequest, ROLES_KEY } from './decorators.js';

/** Aplica @Roles(...); sem o decorator, qualquer usuário autenticado passa. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Acesso negado para este perfil');
    }
    return true;
  }
}
