'use client';

import React from 'react';
import { CourseDetails } from '../_components/course-details';

// This page now correctly handles the `params` prop as a Promise
// by using `React.use()` to unwrap the `id`.
export default function TeacherCourseDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  if (!id) {
    // This case should ideally not happen with Next.js file-based routing
    // but is a good fallback.
    return <div>Loading...</div>;
  }

  return <CourseDetails courseId={id} />;
}
