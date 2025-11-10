'use client';

import React from 'react';
import { CourseEditor } from './_components/course-editor';

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  React.useEffect(() => {
    if (id) {
      console.log(`Edit page loaded for course with ID: ${id}`);
    }
  }, [id]);

  if (!id) {
    return null; // Or a loading/error state
  }

  return <CourseEditor courseId={id} />;
}
