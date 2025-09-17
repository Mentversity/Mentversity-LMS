'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { CourseList } from '@/components/course/CourseList';
import { Link, Loader2 } from 'lucide-react';
import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function TrainerCoursesPage() {
  const { courses: rawCourses, fetchCourses, isLoading, error } = useCourseStore();
  const { user, isLoading: isUserLoading } = useAuthStore();
  const router = useRouter();

  // The code has been updated to filter courses based on the trainer's ID
  const courses = Array.isArray(rawCourses) ? rawCourses : [];
  const trainerCourses = courses.filter(course => course.trainerId === user?.id);

  useEffect(() => {
    // Fetch all courses. Filtering for trainer-specific courses happens below.
    fetchCourses();
  }, [fetchCourses]);

  const handleCreateCourse = () => {
    router.push('/admin/courses/create');
  };

  // Combined loading check for both user and course data
  if (isUserLoading || isLoading) {
    return (
      <div className={`${inter.className} flex items-center justify-center h-screen bg-gray-50 text-gray-800`}>
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#00404a] mx-auto mb-4" />
          <p className="text-gray-500 font-light">Loading courses...</p>
        </div>
      </div>
    );
  }

  // If there's an error fetching courses, show an error message
  if (error) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 text-gray-900`}>
        <div className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md">
          <svg className="h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856a2 2 0 001.996-2.164L18.4 6.836A2 2 0 0016.404 4H7.596a2 2 0 00-1.996 2.164L4.082 17.836A2 2 0 006.07 20z"></path>
          </svg>
          <h2 className="text-xl font-bold tracking-tight mb-2">Failed to load courses</h2>
          <p className="text-gray-500 mb-4">
            Something went wrong while fetching your courses. Please try again.
          </p>
          <Button onClick={fetchCourses} className="rounded-full bg-[#00404a] text-white font-semibold shadow-[0_4px_8px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} space-y-6 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen text-gray-900`}>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Assigned Courses</h1>
          <p className="text-gray-500">
            View, edit, and manage the courses you are assigned to.
          </p>
        </div>
      </div>
      
      {/* Course List */}
      {trainerCourses.length > 0 ? (
        <CourseList
          courses={trainerCourses}
          userRole="trainer"
        />
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center bg-white rounded-xl shadow-sm">
          <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v1.5m0 0a2.9 2.9 0 01-.2 5.283c-.15.42-.3.84-.45 1.26m0 0V18m0-1.5a2.25 2.25 0 00-2.25 2.25m4.5 0A2.25 2.25 0 0014.25 18"></path>
          </svg>
          <p className="text-gray-500 font-light mb-2">You haven't been assigned to any courses yet.</p>
          <p className="text-sm text-gray-400 mb-4">Please contact an admin to be assigned a course, or create your own.</p>
          <Button onClick={handleCreateCourse} variant="outline" className="rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100">
            Create a New Course
          </Button>
        </div>
      )}
    </div>
  );
}

