
import type { User, Course, Enrollment, Feedback, Submission } from './types';

// This data is now for reference and will be replaced by Firestore data.
export const users: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@campus.com', role: 'admin', avatar: 'https://picsum.photos/seed/1/200', firstName: 'Admin', lastName: 'User' },
  { id: '2', name: 'Karthik S', email: 'karthik@campus.com', role: 'teacher', avatar: 'https://picsum.photos/seed/2/200', firstName: 'Karthik', lastName: 'S' },
  { id: '3', name: 'Pranav S', email: 'pranav@campus.com', role: 'student', avatar: 'https://picsum.photos/seed/3/200', firstName: 'Pranav', lastName: 'S' },
  { id: '4', name: 'Jane Doe', email: 'jane@example.com', role: 'student', avatar: 'https://picsum.photos/seed/4/200', firstName: 'Jane', lastName: 'Doe' },
  { id: '5', name: 'John Smith', email: 'john@example.com', role: 'teacher', avatar: 'https://picsum.photos/seed/5/200', firstName: 'John', lastName: 'Smith' },
];

export const courses: Course[] = [
  {
    id: '1',
    title: 'Introduction to Web Development',
    description: 'Learn the fundamentals of HTML, CSS, and JavaScript to build modern websites.',
    teacherId: '2',
    status: 'approved',
    image: 'https://picsum.photos/seed/1/600/400',
    modules: [
      { id: 'm1', title: 'HTML Basics', description: '...', content: [] },
      { id: 'm2', title: 'CSS Fundamentals', description: '...', content: [] },
    ]
  },
  {
    id: '2',
    title: 'Advanced Data Science with Python',
    description: 'Dive deep into machine learning, data visualization, and statistical analysis.',
    teacherId: '5',
    status: 'approved',
    image: 'https://picsum.photos/seed/2/600/400',
    modules: [],
  },
  {
    id: '3',
    title: 'UI/UX Design Principles',
    description: 'Master the art of creating intuitive and beautiful user interfaces.',
    teacherId: '2',
    status: 'pending',
    image: 'https://picsum.photos/seed/3/600/400',
    modules: [],
  },
    {
    id: '4',
    title: 'Digital Marketing Essentials',
    description: 'Understand SEO, SEM, and social media marketing strategies.',
    teacherId: '5',
    status: 'approved',
    image: 'https://picsum.photos/seed/4/600/400',
    modules: [],
  },
];

export const enrollments: Enrollment[] = [
  { id: 'e1', userId: '3', courseId: '1', progress: 75, completed: false, teacherId: '2', completedContent: [] },
  { id: 'e2', userId: '3', courseId: '2', progress: 20, completed: false, teacherId: '5', completedContent: [] },
  { id: 'e3', userId: '4', courseId: '1', progress: 100, completed: true, teacherId: '2', completedContent: [] },
];

export const submissions: Submission[] = [
    { id: 's1', userId: '3', courseId: '1', assignmentId: 'a1', comment: 'Here is my submission for the portfolio.', grade: 95, submittedAt: new Date(), teacherId: '2'},
    { id: 's2', userId: '4', courseId: '1', assignmentId: 'a1', comment: 'My portfolio submission.', grade: 88, submittedAt: new Date(), teacherId: '2'},
];

export const feedback: Feedback[] = [
  { id: 'f1', userId: '3', courseId: '1', rating: 5, comment: 'This course is amazing! Very clear explanations.', createdAt: new Date() },
  { id: 'f2', userId: '4', courseId: '1', rating: 4, comment: 'Great content, but could use more practical examples.', createdAt: new Date() },
  { id: 'f3', userId: '3', courseId: '2', rating: 3, comment: 'The material is quite difficult to understand.', createdAt: new Date() },
];

// Note: These functions are now deprecated in favor of direct Firestore queries.
// They are kept for reference or if parts of the app still use them.

export const getCourseById = (id: string) => courses.find(c => c.id === id);
export const getUserById = (id: string) => users.find(u => u.id === id);
export const getTeacherCourses = (teacherId: string) => courses.filter(c => c.teacherId === teacherId);
export const getStudentEnrollments = (userId: string) => enrollments.filter(e => e.userId === userId);
export const getCourseFeedback = (courseId: string) => feedback.filter(f => f.courseId === courseId);
export const getCourseSubmissions = (courseId: string) => submissions.filter(s => s.courseId === courseId);
