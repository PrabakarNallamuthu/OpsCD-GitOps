/**
 * WO-028: Release Service API — Release Controller
 */
import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ReleaseService } from './release.service.js';
import { CreateReleaseDto } from './dto/create-release.dto.js';
import { UpdateReleaseStatusDto } from './dto/update-release-status.dto.js';

@Controller('releases')
export class ReleaseController {
  constructor(private readonly releaseService: ReleaseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateReleaseDto) {
    return this.releaseService.create(dto);
  }

  @Get()
  list() {
    return this.releaseService.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.releaseService.findById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReleaseStatusDto,
  ) {
    return this.releaseService.updateStatus(id, dto);
  }
}
