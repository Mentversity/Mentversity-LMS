import { create } from "zustand";
import { Course, CourseState, Module, Topic } from "@/types";
import { coursesApi, modulesApi } from "@/lib/api";

interface CourseStore extends CourseState {
  fetchCourses: () => Promise<void>;
  fetchCourse: (id: string) => Promise<void>;
  createCourse: (courseData: Partial<Course>) => Promise<void>;
  addModule: (courseId: string, moduleData: Partial<Module>) => Promise<void>;
  addTopic: (moduleId: string, topicData: Partial<Topic>) => Promise<void>;
  setCurrentCourse: (course: Course | null) => void;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,

  fetchCourses: async () => {
    set({ isLoading: true });
    try {
      const response = await coursesApi.getAll();
      const courses = response.data.courses;
      console.log("Fetched courses:", courses);
      set({ courses, isLoading: false });
    } catch (error) {
      console.error("Error fetching courses:", error);
      set({ isLoading: false });
    }
  },

  fetchCourse: async (id: string) => {
    set({ isLoading: true });
    try {
      const course = await coursesApi.getById(id);
      set({ currentCourse: course, isLoading: false });
    } catch (error) {
      console.error("Error fetching course:", error);
      set({ isLoading: false });
    }
  },

  createCourse: async (courseData: Partial<Course>) => {
    set({ isLoading: true });
    try {
      const newCourse = await coursesApi.create(courseData);
      set({
        courses: [...get().courses, newCourse],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error creating course:", error);
      set({ isLoading: false });
      throw error;
    }
  },

  addModule: async (courseId: string, moduleData: Partial<Module>) => {
    try {
      const newModule = await coursesApi.addModule(courseId, moduleData);
      const currentCourse = get().currentCourse;
      if (currentCourse && currentCourse._id === courseId) {
        set({
          currentCourse: {
            ...currentCourse,
            modules: [...currentCourse.modules, newModule],
          },
        });
      }
    } catch (error) {
      console.error("Error adding module:", error);
      throw error;
    }
  },

  addTopic: async (moduleId: string, topicData: Partial<Topic>) => {
    try {
      const newTopic = await modulesApi.addTopic(moduleId, topicData);
      const currentCourse = get().currentCourse;
      if (currentCourse) {
        const updatedModules = currentCourse.modules.map((module) =>
          module.id === moduleId
            ? { ...module, topics: [...module.topics, newTopic] }
            : module
        );
        set({
          currentCourse: {
            ...currentCourse,
            modules: updatedModules,
          },
        });
      }
    } catch (error) {
      console.error("Error adding topic:", error);
      throw error;
    }
  },

  setCurrentCourse: (course: Course | null) => {
    set({ currentCourse: course });
  },
}));
