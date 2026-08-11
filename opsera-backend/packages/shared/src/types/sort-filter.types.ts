import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum FilterOperator {
  EQ = 'EQ',
  NEQ = 'NEQ',
  GT = 'GT',
  GTE = 'GTE',
  LT = 'LT',
  LTE = 'LTE',
  IN = 'IN',
  CONTAINS = 'CONTAINS',
}

export class SortRequest {
  @IsString()
  field!: string;

  @IsEnum(SortDirection)
  direction!: SortDirection;
}

export class FilterRequest {
  @IsString()
  field!: string;

  @IsEnum(FilterOperator)
  operator!: FilterOperator;

  @IsOptional()
  value?: unknown;
}
