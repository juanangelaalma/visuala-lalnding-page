export class AiDomainError extends Error {
  constructor(
    public readonly status: 400 | 402 | 403 | 404 | 409 | 422,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AiDomainError";
  }
}
