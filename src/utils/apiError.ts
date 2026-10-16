export class ApiError extends Error {
  statusCode: number;
  // Machine-readable reason, for errors a client handles specially.
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode; 
    this.code = code;
  }
}
