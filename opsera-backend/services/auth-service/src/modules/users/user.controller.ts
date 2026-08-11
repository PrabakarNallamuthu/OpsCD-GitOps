/**
 * WO-027: Admin User Management and Role Assignment
 * WO-028: Structured Access Denied Responses and Audit Logging
 */
import {
  Controller,
  Get,
  Patch,
  Put,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  Logger,
  ForbiddenException,
  UnauthorizedException,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { RbacGuard, Roles } from '../rbac/rbac.guard.js';
import type { SessionService } from '../session/session.service.js';

interface UpdateRolesDto {
  roles: string[];
}

@Controller('api/v1/users')
@UseGuards(RbacGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly session: SessionService) {}

  @Get()
  @Roles('Admin')
  async listUsers(
    @Query('role') role?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 100);
    // In production: query Prisma with filters; returning stub for compilation
    return {
      data: [],
      pagination: { has_more: false, next_cursor: cursor, limit: parsedLimit },
      filters: { role, is_active: isActive, search },
    };
  }

  @Patch(':id/roles')
  @Roles('Admin')
  @HttpCode(200)
  async updateRoles(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateRolesDto,
  ) {
    const validRoles = ['Developer', 'ReleaseManager', 'SRE', 'Leadership', 'Auditor', 'Admin'];
    const invalid = dto.roles.filter((r) => !validRoles.includes(r));
    if (invalid.length > 0) {
      throw new ForbiddenException(`Invalid roles: ${invalid.join(', ')}`);
    }

    this.logger.log(`Role update for user ${userId}: [${dto.roles.join(', ')}]`);
    // In production: update DB, invalidate Redis tokens, emit Kafka event
    return { userId, roles: dto.roles, updated: true };
  }

  @Put(':id/deactivate')
  @Roles('Admin')
  @HttpCode(200)
  async deactivate(@Param('id', ParseUUIDPipe) userId: string) {
    this.logger.log(`Deactivating user ${userId}`);
    // In production: set is_active=false, invalidate tokens, emit Kafka event
    return { userId, is_active: false };
  }

  @Put(':id/reactivate')
  @Roles('Admin')
  @HttpCode(200)
  async reactivate(@Param('id', ParseUUIDPipe) userId: string) {
    this.logger.log(`Reactivating user ${userId}`);
    return { userId, is_active: true };
  }
}

/**
 * WO-028: Global exception filter with structured error responses.
 * Catches all HTTP exceptions, strips stack traces, injects correlation_id.
 */
@Catch(HttpException)
export class StructuredExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(StructuredExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const correlationId =
      (request.headers['x-correlation-id'] as string | undefined) ??
      crypto.randomUUID();

    const exceptionResponse = exception.getResponse() as
      | string
      | Record<string, unknown>;

    // Strip internal details from error response
    let errorBody: Record<string, unknown>;
    if (typeof exceptionResponse === 'string') {
      errorBody = { message: exceptionResponse };
    } else {
      const { stack: _stack, ...safeBody } = exceptionResponse as Record<string, unknown>;
      errorBody = safeBody;
    }

    const code = status === HttpStatus.UNAUTHORIZED
      ? 'UNAUTHORIZED'
      : status === HttpStatus.FORBIDDEN
        ? 'FORBIDDEN'
        : status >= 500
          ? 'INTERNAL_ERROR'
          : 'CLIENT_ERROR';

    const message =
      status >= 500
        ? 'An internal error occurred. Please contact support.'
        : String(errorBody['message'] ?? exception.message);

    this.logger.warn(
      `[${status}] ${request.method} ${request.path} — ${message} — correlation=${correlationId}`,
    );

    response.status(status).json({
      error: {
        code,
        message,
        correlation_id: correlationId,
        ...(errorBody['required_roles'] && { required_roles: errorBody['required_roles'] }),
        ...(errorBody['user_roles'] && { user_roles: errorBody['user_roles'] }),
      },
    });
  }
}
