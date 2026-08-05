import { randomBytes } from 'node:crypto'

export interface IRefreshTokenGenerator {
  generate(): string
}

export class RefreshTokenGenerator implements IRefreshTokenGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url')
  }
}
