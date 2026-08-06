export class InvalidConfirmationToken extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidConfirmationToken'
  }
}
