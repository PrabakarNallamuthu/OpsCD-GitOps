import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength } from 'class-validator';

export class CreateReleaseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsString()
  @IsOptional()
  environment?: string;

  @IsArray()
  @IsOptional()
  components?: string[];

  @IsString()
  @IsOptional()
  gitRef?: string;
}
