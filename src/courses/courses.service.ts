import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
import { CourseCreateDto, CourseUpdateDto } from './dto';

@Injectable()
export class CoursesService {
  constructor(private readonly supa: SupabaseService) {}

  // 🔹 List all courses
  async list(req: Request) {
    const { data, error } = await this.supa
      .forRequest(req)
      .from('Course')
      .select('*')
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data;
  }

  // 🔹 Get a single course by ID
  async get(req: Request, id: string) {
    const { data, error } = await this.supa
      .forRequest(req)
      .from('Course')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  // 🔹 Create a new course
  async create(req: Request, body: CourseCreateDto) {
    const id = randomUUID(); // generate a unique ID
    const now = new Date().toISOString();

    const { data, error } = await this.supa
      .forRequest(req)
      .from('Course')
      .insert([
        {
          id,
          title: body.title,
          code: body.code,
          description: body.description,
          term: 'TBD',
          startDate: now,
          endDate: now,
          visibility: 'PUBLISHED',
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Insert Course failed:', error);
      throw error;
    }

    console.log('✅ Course inserted successfully:', data);
    return data;
  }

  // 🔹 Update a course
  async update(req: Request, id: string, body: CourseUpdateDto) {
    const now = new Date().toISOString();

    const { data, error } = await this.supa
      .forRequest(req)
      .from('Course')
      .update({ ...body, updatedAt: now })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // 🔹 Delete a course
  async remove(req: Request, id: string) {
    const { error } = await this.supa
      .forRequest(req)
      .from('Course')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { ok: true };
  }
}
