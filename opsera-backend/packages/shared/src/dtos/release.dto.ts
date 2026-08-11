import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import type { UUID, ISO8601Timestamp } from '../types/common.types.js';

export enum ReleaseStatus {
  PENDING = 'PENDING',
  ANALYSIS_IN_PROGRESS = 'ANALYSIS_IN_PROGRESS',
  ANALYSIS_COMPLETE = 'ANALYSIS_COMPLETE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DEPLOYING = 'DEPLOYING',
  DEPLOYED = 'DEPLOYED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum TargetEnvironment {
  DEVELOPMENT = 'DEVELOPMENT',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

/** Request DTO to create a new release. */
export class CreateReleaseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsUUID()
  targetEnvironmentId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  changeRefs!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jiraTicket?: string;
}

/** Partial update request. */
export class UpdateReleaseDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(ReleaseStatus)
  status?: ReleaseStatus;
}

/** Response shape returned by the release service. */
export interface ReleaseResponseDto {
  readonly id: UUID;
  readonly name: string;
  readonly description?: string;
  readonly status: ReleaseStatus;
  readonly targetEnvironmentId: UUID;
  readonly changeRefs: string[];
  readonly jiraTicket?: string;
  readonly createdBy: UUID;
  readonly createdAt: ISO8601Timestamp;
  readonly updatedAt: ISO8601Timestamp;
}
