import axios from "axios";
import {
  User,
  Course,
  Module,
  Topic,
  Assignment,
  AssignmentSubmission,
  Progress,
} from "@/types";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  me: (token?: string) =>
    api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${token || localStorage.getItem("auth_token")}`,
      },
    }),

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  // NEW: Method to register a student (or enroll an existing one in new courses)
  registerStudent: async (
    email: string,
    password?: string,
    name?: string,
    courseIds: string[] = []
  ) => {
    // Password is optional for existing student updates, but required for new registrations
    const payload: {
      email: string;
      password?: string;
      name?: string;
      courseIds: string[];
    } = {
      email,
      courseIds,
    };
    if (password) {
      payload.password = password;
    }
    if (name) {
      payload.name = name;
    }

    const response = await api.post("/auth/register-student", payload);
    return response.data;
  },
};

// Courses API calls
export const coursesApi = {
  /**
   * Fetches all courses.
   * @returns {Promise<any[]>} A promise that resolves to an array of courses.
   */
  getAll: async (): Promise<any[]> => {
    const response = await api.get("/courses");
    return response.data;
  },

  /**
   * Fetches a course by its ID.
   * @param {string} id The ID of the course.
   * @returns {Promise<any>} A promise that resolves to the course data.
   */
  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/courses/${id}`);
    console.log("Fetched course:", response.data);
    return response.data;
  },

  /**
   * Creates a new course, optionally with a thumbnail.
   * This method now expects a FormData object to handle file uploads.
   * @param {FormData} formData FormData containing course details and the 'thumbnail' file (if any).
   * @returns {Promise<any>} A promise that resolves to the created course data.
   */
  create: async (formData: FormData): Promise<any> => {
    console.log("Course FormData api:", Array.from(formData.entries()));
    const response = await api.post("/courses", formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Crucial for FormData
      },
    });
    return response.data;
  },

  /**
   * Updates an existing course, optionally with a new thumbnail.
   * This method now expects a FormData object to handle file uploads.
   * @param {string} id The ID of the course to update.
   * @param {FormData} formData FormData containing updated course details and the 'thumbnail' file (if any).
   * @returns {Promise<any>} A promise that resolves to the updated course data.
   */
  update: async (id: string, formData: FormData): Promise<any> => {
    const response = await api.put(`/courses/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Crucial for FormData
      },
    });
    return response.data;
  },

  /**
   * Deletes a course by its ID.
   * @param {string} id The ID of the course to delete.
   * @returns {Promise<void>}
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  /**
   * Adds a module to a specific course.
   * @param {string} courseId The ID of the course.
   * @param {Partial<any>} moduleData The module data.
   * @returns {Promise<any>} A promise that resolves to the created module data.
   */
  addModule: async (
    courseId: string,
    moduleData: Partial<any> // Assuming Module type or similar
  ): Promise<any> => {
    const response = await api.post(`/courses/${courseId}/modules`, moduleData);
    return response.data;
  },
};

// Modules API calls
export const modulesApi = {
  addTopic: async (
    moduleId: string,
    topicData: Partial<Topic>
  ): Promise<Topic> => {
    const response = await api.post(`/modules/${moduleId}/topics`, topicData);
    return response.data;
  },

  updateTopic: async (
    moduleId: string,
    topicId: string,
    topicData: Partial<Topic>
  ): Promise<Topic> => {
    const response = await api.put(
      `/modules/${moduleId}/topics/${topicId}`,
      topicData
    );
    return response.data;
  },
};

// Videos API calls
export const videosApi = {
  upload: async (
    topicId: string,
    videoFile: File
  ): Promise<{ videoUrl: string }> => {
    const formData = new FormData();
    formData.append("video", videoFile);
    const response = await api.post(`/topics/${topicId}/video`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  get: async (
    topicId: string
  ): Promise<{ videoUrl: string; duration: number }> => {
    const response = await api.get(`/topics/${topicId}/video`);
    return response.data;
  },
};

// assignmentsApi calls (UPDATED)
export const assignmentsApi = {
  /**
   * Creates or updates an assignment for a topic.
   * Accepts FormData to handle both text fields and file uploads.
   * @param topicId The ID of the topic to associate the assignment with.
   * @param formData FormData containing assignment details and file.
   * @returns Promise<any> The API response data.
   */
  create: async (topicId: string, formData: FormData): Promise<any> => {
    console.log("Creating/Updating assignment for topic:", topicId, formData);
    const response = await api.post(`/topics/${topicId}/assignment`, formData, {
      headers: {
        "Content-Type": "multipart/form-data", // Crucial for FormData
      },
    });
    return response.data;
  },

  /**
   * Deletes an assignment associated with a topic.
   * @param topicId The ID of the topic whose assignment is to be deleted.
   * @returns Promise<void>
   */
  delete: async (topicId: string): Promise<void> => {
    await api.delete(`/topics/${topicId}/assignment`);
  },

  /**
   * Submits a student's assignment file for a given topic.
   * @param topicId The ID of the topic the assignment belongs to.
   * @param file The File object to be uploaded.
   * @returns Promise<AssignmentSubmission> The submission details.
   */
  submit: async (
    topicId: string,
    file: File
  ): Promise<AssignmentSubmission> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(
      `/topics/${topicId}/assignment/submit`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Gets the submission status of an assignment for a specific student and topic.
   * @param topicId The ID of the topic.
   * @returns Promise<AssignmentSubmission> The submission status.
   */
  getStatus: async (topicId: string): Promise<AssignmentSubmission> => {
    const response = await api.get(`/topics/${topicId}/assignment/status`);
    return response.data;
  },

  /**
   * Grades a submitted assignment. (Admin function)
   * @param assignmentId The ID of the assignment submission to grade.
   * @param score The score to assign.
   * @param feedback Any feedback for the submission.
   * @returns Promise<AssignmentSubmission> The updated submission details.
   */
  grade: async (
    assignmentId: string,
    score: number,
    feedback: string
  ): Promise<AssignmentSubmission> => {
    const response = await api.post(`/assignments/${assignmentId}/grade`, {
      score,
      feedback,
    });
    return response.data;
  },

  /**
   * Fetches all courses a student is enrolled in, with their modules, topics,
   * associated assignments, and the student's submission status for each.
   * This is designed for the student's "My Assignments" page.
   * @returns Promise<any[]> An array of course objects, each containing nested modules and topics with assignment details.
   */
  getStudentAssignmentsStructured: async (): Promise<any[]> => {
    const response = await api.get("/student/assignments/structured");
    // Assuming the backend returns { courses: [...] } as per the new controller
    return response.data.data.courses;
  },
};

// Progress API calls
export const progressApi = {
  markComplete: async (topicId: string): Promise<void> => {
    await api.post(`/topics/${topicId}/complete`);
  },

  getCourseProgress: async (courseId: string): Promise<Progress> => {
    const response = await api.get(`/progress/${courseId}`);
    return response.data;
  },

  getAllProgress: async (): Promise<Progress[]> => {
    const response = await api.get("/progress");
    return response.data;
  },
};

// Users API calls
export const studentsApi = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get("/students");
    return response.data;
  },

  getByCourseId: async (courseId: string): Promise<User[]> => {
    const response = await api.get(`/students/course/${courseId}`);
    return response.data;
  },
};
