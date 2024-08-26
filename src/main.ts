import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, catchError, Observable, throwError } from 'rxjs';

@Injectable()
export class DataWrapperInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        message: 'Request was successful',
        data: data,
      })),
      catchError(err =>
        throwError(() => ({
          message: 'Request failed',
          error: err.message || 'An error occurred',
        })),
      ),
    );
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new DataWrapperInterceptor())
  app.enableCors()
  await app.listen(3000);
}
bootstrap();
