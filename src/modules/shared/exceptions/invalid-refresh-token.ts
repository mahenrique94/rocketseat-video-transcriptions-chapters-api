export class InvalidRefreshToken extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidRefreshToken'
  }
}
