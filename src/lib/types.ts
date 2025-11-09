export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar: string;
  firstName?: string;
  lastName?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  url?: string; // For video
  content?: string; // For reading
  questions?: any[]; // For quiz
};

export type Module = {
  id: string;
  title: string;
  description: string;
  content: ContentItem[];
};

export type Course = {
  id:string;
  title: string;
  description: string;
  teacherId: string;
  status: 'pending' | 'approved' | 'rejected';
  modules?: Module[];
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

export type Assignment = {
    id: string;
    title: string;
    description: string;
};
