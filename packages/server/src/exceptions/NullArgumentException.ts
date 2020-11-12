export class NullArgumentException extends Error {
  constructor(public argumentName: string, message?: string) {
    super(message || `The argument "${argumentName}" is null.`);
  }
}
