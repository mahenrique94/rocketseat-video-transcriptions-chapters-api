import type { UserRole } from '@features/users/domain/user'

export interface JwtPayload {
  sub: string
  email: string
  jti: string
  role: UserRole
}

export interface IJwtProvider {
  sign(payload: JwtPayload, expiresIn?: string | number): string
  verify<T>(token: string): T
}
