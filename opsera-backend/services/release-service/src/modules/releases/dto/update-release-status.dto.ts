import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateReleaseStatusDto {
  @IsString()
  @IsIn(['pending', 'in_progress', 'completed', 'failed', 'rolled_back'])
  status!: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
