import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ErrorCodes } from '../../shared/error-codes';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

export enum UserRole {
  ADMIN = 'admin',
  TEAM = 'team',
  COACH = 'coach',
  CLIENT = 'client',
}

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload;

    if (!user) {
      throw new ForbiddenException({
        errorCode: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
        message: 'User not authenticated',
      });
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    
    if (!hasRole) {
      throw new ForbiddenException({
        errorCode: ErrorCodes.AUTH_INSUFFICIENT_PERMISSIONS,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      });
    }

    return true;
  }
}

// Decorator for applying role-based access control
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
