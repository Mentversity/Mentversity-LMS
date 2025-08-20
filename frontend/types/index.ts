export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "student";
  avatar?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: string;
  duration: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  rating: number;
  enrolledStudents: [];
  modules: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  topics: Topic[];
  createdAt: string;
}

export interface Topic {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  type: "video" | "text" | "quiz";
  videoUrl?: string;
  videoDuration?: number;
  content?: string;
  order: number;
  assignments: Assignment[];
  completed?: boolean;
  createdAt: string;
}

export interface Assignment {
  id: string;
  topicId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  fileTypes: string[];
  submissions: AssignmentSubmission[];
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  status: "submitted" | "graded" | "pending";
  score?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

export interface Progress {
  userId: string;
  courseId: string;
  moduleId?: string;
  topicId?: string;
  completedTopics: string[];
  totalTopics: number;
  completionPercentage: number;
  timeSpent: number;
  lastAccessed: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
}

export interface ProgressState {
  progress: Record<string, Progress>;
  isLoading: boolean;
}
