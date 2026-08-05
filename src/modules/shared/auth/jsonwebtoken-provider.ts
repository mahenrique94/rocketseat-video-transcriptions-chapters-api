import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import type { IJwtProvider, JwtPayload } from './jwt-provider'

export class JsonWebTokenProvider implements IJwtProvider {
  constructor(private readonly secret: string) {}

  sign(payload: JwtPayload, expiresIn: SignOptions['expiresIn'] = '7d'): string {
    return jwt.sign(payload, this.secret, { expiresIn })
  }

  verify<T>(token: string): T {
    return jwt.verify(token, this.secret) as T
  }
}
