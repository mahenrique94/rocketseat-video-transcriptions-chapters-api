export class SignInDTO {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}
