export class ReturnTranscriptionDTO {
  constructor(
    public readonly id: string,
    public readonly videoId: string,
    public readonly content: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
