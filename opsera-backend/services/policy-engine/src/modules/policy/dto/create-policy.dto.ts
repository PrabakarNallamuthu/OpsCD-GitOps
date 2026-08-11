import { IsString, IsNotEmpty, IsOptional, IsObject, IsIn, MaxLength } from 'class-validator';

export class CreatePolicyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  ruleType!: string;

  @IsObject()
  conditions!: Record<string, unknown>;

  @IsString()
  @IsIn(['block', 'warn', 'audit'])
  action!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
