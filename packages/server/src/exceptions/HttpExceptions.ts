export class HttpException extends Error {
  constructor(public status: number, public response?: any, message?: string) {
    super(message);
  }
}
