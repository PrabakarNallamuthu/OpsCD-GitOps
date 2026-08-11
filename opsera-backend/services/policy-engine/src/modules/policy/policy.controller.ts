/**
 * WO-032: Policy Engine API — Policy Controller
 */
import {
  Controller, Get, Post, Patch, Delete, Param, Body, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PolicyService } from './policy.service.js';
import { CreatePolicyDto } from './dto/create-policy.dto.js';

@Controller('policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePolicyDto) {
    return this.policyService.create(dto);
  }

  @Get()
  list() {
    return this.policyService.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.findById(id);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<CreatePolicyDto>) {
    return this.policyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.policyService.deactivate(id);
  }
}
