import { create } from "zustand";
import { Progress, ProgressState } from "@/types";
import { progressApi } from "@/lib/api";

interface ProgressStore extends ProgressState {
  markTopicComplete: (topicId: string) => Promise<void>;
  fetchCourseProgress: (courseId: string) => Promise<void>;
  fetchAllProgress: () => Promise<void>;
  getProgressByCourse: (courseId: string) => Progress | undefined;
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  progress: {},
  isLoading: false,

  markTopicComplete: async (topicId: string) => {
    try {
      await progressApi.markComplete(topicId);
      // Refresh progress after marking complete
      // This could be optimized to update local state
    } catch (error) {
      console.error("Error marking topic complete:", error);
      throw error;
    }
  },

  fetchCourseProgress: async (courseId: string) => {
    set({ isLoading: true });
    try {
      const courseProgress = await progressApi.getCourseProgress(courseId);
      set({
        progress: {
          ...get().progress,
          [courseId]: courseProgress,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching course progress:", error);
      set({ isLoading: false });
    }
  },

  fetchAllProgress: async () => {
    set({ isLoading: true });
    try {
      const allProgress = await progressApi.getAllProgress();
      console.log("Fetched all progress:", allProgress);
      const progressMap = allProgress.reduce((acc, progress) => {
        acc[progress.courseId] = progress;
        return acc;
      }, {} as Record<string, Progress>);
      set({ progress: progressMap, isLoading: false });
    } catch (error) {
      console.error("Error fetching all progress:", error);
      set({ isLoading: false });
    }
  },

  getProgressByCourse: (courseId: string) => {
    return get().progress[courseId];
  },
}));
