import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthState } from "@/types";
import { authApi } from "@/lib/api";

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // 🔹 LOGIN FUNCTION
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { token, user } = response.data; // Ensure backend sends role

          // Save token
          localStorage.setItem("auth_token", token);

          // Fetch latest user info from /me to be 100% sure
          const meRes = await authApi.me(token);
          console.log("User info after login:", meRes.data.data.user);

          set({
            user: meRes.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });

          return meRes.data.data.user;
        } catch (error) {
          console.error("Login error:", error);
          set({ isLoading: false });
          throw error;
        }
      },

      // 🔹 LOGOUT FUNCTION
      logout: () => {
        localStorage.removeItem("auth_token");
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // 🔹 AUTH CHECK ON PAGE LOAD
      checkAuth: async () => {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const meRes = await authApi.me(token);
          set({
            user: meRes.data.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Auth check error:", error);
          localStorage.removeItem("auth_token");
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // 🔹 MANUAL USER SETTER
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
