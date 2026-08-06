import { randomBytes } from 'node:crypto'

export interface IConfirmationTokenGenerator {
  generate(): string
}

export class ConfirmationTokenGenerator implements IConfirmationTokenGenerator {
  generate(): string {
    return randomBytes(32).toString('base64url')
  }
}
