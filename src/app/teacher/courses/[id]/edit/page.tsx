'use client';

import React from 'react';
import { CourseEditor } from './_components/course-editor';

export default function EditCoursePage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!id) {
    return null; // Or a loading/error state
  }

  return <CourseEditor courseId={id} />;
}
