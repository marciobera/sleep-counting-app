import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Error, MongooseError } from 'mongoose';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: any, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();

        var messages: string[] = ['An error occurred'];
        var statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        if (exception instanceof HttpException) {
            messages = [exception.message ?? exception.getResponse().toString()];
            statusCode = exception.getStatus();
        } else if (exception instanceof MongooseError) {
            messages = exception.message.split(", ");
            if (exception instanceof Error.ValidationError) {
                console.log(exception.addError)
                statusCode = HttpStatus.BAD_REQUEST;
            }
        }


        const responseBody = {
            statusCode,
            messages,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(ctx.getRequest()),
        };

        httpAdapter.reply(ctx.getResponse(), responseBody, statusCode);
    }
}
