import { UserRole } from '../../common/guards/roles.guard';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
  iat?: number;
  exp?: number;
}
