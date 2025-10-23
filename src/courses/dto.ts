import { z } from 'zod';

export const CourseCreateSchema = z.object({
  title: z.string().min(2),
  code: z.string().min(2),
  description: z.string().min(2),
});

export type CourseCreateDto = z.infer<typeof CourseCreateSchema>;

export const CourseUpdateSchema = CourseCreateSchema.partial();
export type CourseUpdateDto = z.infer<typeof CourseUpdateSchema>;
