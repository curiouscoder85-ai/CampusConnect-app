

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar: string;
  firstName?: string;
  lastName?: string;
};

export type Question = {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number; // index of the correct option
};

export type ContentItem = {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  url?: string; // For video
  content?: string; // For reading
  questions?: Question[]; // For quiz
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
  teacherId: string; // Denormalized for querying
  progress: number;
  completed: boolean;
};

export type Submission = {
    id: string;
    userId: string;
    assignmentId: string;
    courseId: string;
    teacherId: string; // Denormalized for querying
    content: string;
    grade: number | null;
    submittedAt: any; // Using `any` for Firebase Timestamp compatibility
};

export type Feedback = {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: any; // Using `any` for Firebase Timestamp compatibility
};

export type Assignment = {
    id: string;
    title: string;
    description: string;
};

