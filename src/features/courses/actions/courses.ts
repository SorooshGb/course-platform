'use server';

import { getCurrentUser } from '@/services/clerk';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { deleteCourse as deleteCourseDb, insertCourse, updateCourse as updateCourseDb } from '../db/courses';
import { canCreateCourses, canDeleteCourses, canUpdateCourses } from '../permissions/courses';
import { courseSchema } from '../schemas/courses';

export async function createCourse(unsafeData: z.infer<typeof courseSchema>) {
  const { success, data } = courseSchema.safeParse(unsafeData);

  if (!success || !canCreateCourses(await getCurrentUser())) {
    return { error: true, message: 'There was an error creating your course' };
  }

  const course = await insertCourse(data);

  redirect(`/admin/courses/${course.id}/edit`);
}

export async function updateCourse(id: string, unsafeData: z.infer<typeof courseSchema>) {
  const { success, data } = courseSchema.safeParse(unsafeData);

  if (!success || !canUpdateCourses(await getCurrentUser())) {
    return { error: true, message: 'There was an error updating your course' };
  }

  await updateCourseDb(id, data);

  return { error: false, message: 'Successfully updated your course' };
}

export async function deleteCourse(id: string) {
  if (!canDeleteCourses(await getCurrentUser())) {
    return { error: true, message: 'There was an error deleting your course' };
  }

  await deleteCourseDb(id);

  return { error: false, message: 'Successfully deleted your course' };
}
