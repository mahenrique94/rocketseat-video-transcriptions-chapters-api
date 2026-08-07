export class CreateVideoDTO {
  constructor(
    public readonly url: string,
    public readonly createdBy: string,
  ) {}
}
