export class RefreshTokenResponseDTO {
  constructor(
    public readonly token: string,
    public readonly refreshToken: string,
  ) {}
}
