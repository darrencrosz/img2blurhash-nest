export class ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;

  constructor(data?: T, code = 0, message = 'success') {
    this.code = code;
    this.message = message;
    if (data !== undefined) this.data = data;
  }
}
