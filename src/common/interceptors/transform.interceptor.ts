import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../dto/api-response.dto';

@Injectable()
export class TransformInterceptor<T = any> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map(data => {
        // 若已是 ApiResponse，则不再包裹
        if (
          data &&
          typeof data === 'object' &&
          typeof (data as any).code === 'number' &&
          typeof (data as any).message === 'string'
        ) {
          // 先转为 unknown 再断言，解决 TS2352
          return data as unknown as ApiResponse<T>;
        }
        return new ApiResponse(data);
      })
    );
  }
}
