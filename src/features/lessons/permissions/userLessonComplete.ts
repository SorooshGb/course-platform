import { db } from '@/drizzle/db';
import { CourseSectionTable, CourseTable, LessonTable, UserCourseAccessTable } from '@/drizzle/schema';
import { getUserCourseAccessUserTag } from '@/features/courses/db/cache/userCourseAccess';
import { wherePublicCourseSections } from '@/features/courseSections/permissions/sections';
import { and, eq } from 'drizzle-orm';
import { cacheTag } from 'next/dist/server/use-cache/cache-tag';
import { getLessonIdTag } from '../db/cache/lessons';
import { wherePublicLessons } from './lessons';

export async function canUpdateUserLessonCompleteStatus(user: { userId: string | undefined }, lessonId: string) {
  'use cache';
  cacheTag(getLessonIdTag(lessonId));

  if (user.userId == null) return false;

  cacheTag(getUserCourseAccessUserTag(user.userId), getLessonIdTag(lessonId));

  const [courseAccess] = await db.select({ courseId: CourseTable.id }).from(UserCourseAccessTable).innerJoin(
    CourseTable,
    eq(CourseTable.id, UserCourseAccessTable.courseId)
  ).innerJoin(CourseSectionTable, and(eq(CourseSectionTable.courseId, CourseTable.id), wherePublicCourseSections))
    .innerJoin(LessonTable, and(eq(LessonTable.sectionId, CourseSectionTable.id), wherePublicLessons)).where(
      and(eq(LessonTable.id, lessonId), eq(UserCourseAccessTable.userId, user.userId))
    ).limit(1);

  return courseAccess != null;
}
