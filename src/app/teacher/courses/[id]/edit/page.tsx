'use client';

import React from 'react';
import { CourseEditor } from './_components/course-editor';

export default function EditCoursePage({ params }: { params: { id: string } }) {
  // The 'id' will be the actual course ID when editing,
  // and the string 'new' when creating a new course.
  const { id } = params;

  if (!id) {
    return null; // Or a loading/error state
  }

  // If the id is 'new', we pass `undefined` to the CourseEditor
  // to signal that we are creating a new course.
  const courseId = id === 'new' ? undefined : id;

  return <CourseEditor courseId={courseId} />;
}
