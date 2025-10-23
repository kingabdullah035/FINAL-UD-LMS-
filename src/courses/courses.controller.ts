import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express'
import { CoursesService } from './courses.service';
import { AuthGuard } from '../auth/auth.guard';
import { CourseCreateSchema, CourseUpdateSchema } from './dto';

@Controller('courses')
@UseGuards(AuthGuard)
export class CoursesController {
  constructor(private readonly svc: CoursesService) {}
  @Get() list(@Req() req: Request) { return this.svc.list(req); }
  @Get(':id') get(@Req() req: Request, @Param('id') id: string) { return this.svc.get(req, id); }
  @Post() create(@Req() req: Request, @Body() body: any) { return this.svc.create(req, CourseCreateSchema.parse(body)); }
  @Put(':id') update(@Req() req: Request, @Param('id') id: string, @Body() body: any) { return this.svc.update(req, id, CourseUpdateSchema.parse(body)); }
  @Delete(':id') remove(@Req() req: Request, @Param('id') id: string) { return this.svc.remove(req, id); }
}
