export class SignInResponseDTO {
  constructor(
    public readonly token: string,
    public readonly refreshToken: string,
  ) {}
}
