export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar: string;
  firstName?: string;
  lastName?: string;
};

export type Assignment = {
  id: string;
  title: string;
  description: string;
};

export type Module = {
  id: string;
  title: string;
  description: string;
  videos: { id: string; title: string; url: string }[];
  reading: { id: string; title: string; content: string }[];
  quizzes: { id: string; title: string; questions: any[] }[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'rejected';
  modules?: Module[];
  assignments?: Assignment[];
  image: string;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
};

export type Submission = {
    id: string;
    userId: string;
    assignmentId: string;
    courseId: string;
    content: string;
    grade: number | null;
    submittedAt: Date;
};

export type Feedback = {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};
