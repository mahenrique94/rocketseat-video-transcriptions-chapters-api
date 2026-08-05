export class SignOutDTO {
  constructor(
    public readonly userId: string,
    public readonly jti: string,
  ) {}
}
