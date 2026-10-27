import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '../../domain/entities/user.entity.js';
import { TokenPayload } from '../../application/ports/token-service.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Rota aberta (sem JWT). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
/** Restringe a rota às roles informadas. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export type AuthenticatedRequest = Request & { user?: TokenPayload };

/** Usuário autenticado (payload do JWT). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().user!,
);
