export class ReturnVideoDTO {
  constructor(
    public readonly id: string,
    public readonly videoUrl: string,
    public readonly videoId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: string,
  ) {}
}
